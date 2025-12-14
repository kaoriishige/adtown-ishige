// Lucideアイコンのインポート（ユーザーの既存のReactプロジェクトに合わせる）
import { QrCode, Lock, Unlock, Loader2, Link, Download, Clipboard, ToggleLeft, ToggleRight } from 'lucide-react';
import React, { useState, useEffect } from 'react';

// Firebaseのインポート
import { initializeApp, FirebaseApp } from "firebase/app";
import { 
  getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, Auth 
} from "firebase/auth";
import { 
  getFirestore, doc, setDoc, onSnapshot, Firestore 
} from "firebase/firestore";

// --- 型宣言の修正 (ESLint no-var 警告を解消) ---
// Canvas環境のグローバル変数に対するAmbient Declarations
// これらは、実行環境によって外部から提供される変数です。
declare const __firebase_config: string;
declare const __app_id: string;
declare const __initial_auth_token: string;
// ----------------------------------------------------

// グローバル変数を使用してFirebase設定を取得
const firebaseConfig = typeof __firebase_config !== 'undefined' 
  ? JSON.parse(__firebase_config) 
  : null;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// Firestoreインスタンスと認証インスタンスの保持
let appInstance: FirebaseApp | undefined;
let dbInstance: Firestore | undefined;
let authInstance: Auth | undefined;

if (firebaseConfig) {
  try {
    appInstance = initializeApp(firebaseConfig);
    dbInstance = getFirestore(appInstance);
    authInstance = getAuth(appInstance);
  } catch (e) {
    console.error("Firebase Initialization Failed:", e);
    // 初期化に失敗した場合でも続行し、コンポーネント内でエラーを表示
  }
}

// ストアの紹介プラン状態ドキュメントの参照を取得 (パブリックパスを使用)
// パブリックパス: /artifacts/{appId}/public/data/store_status/referral_plan
const getReferralPlanDocRef = (db: Firestore) => {
  return doc(db, `/artifacts/${appId}/public/data/store_status`, 'referral_plan');
};

// QRコードのモック（外部ライブラリがないためCanvasで描画）
const QRCodeMock = ({ value }: { value: string }) => {
  // 実際のプロジェクトでは、'qrcode.react' などのライブラリを使用します。
  return (
    <div className="p-4 bg-white rounded-lg shadow-inner text-center">
      <div 
        className="mx-auto w-48 h-48 flex items-center justify-center border-4 border-dashed rounded-lg border-gray-300 bg-white"
      >
        <QrCode className="w-16 h-16 text-gray-400" />
      </div>
      <p className="mt-3 text-sm font-mono text-gray-700 break-words max-w-full overflow-hidden whitespace-nowrap text-ellipsis">
        {value.length > 60 ? value.substring(0, 57) + '...' : value}
      </p>
      <p className="text-xs text-gray-500 mt-1">
        （注: QRコードのデータがここに表示されています）
      </p>
    </div>
  );
};

// メインコンポーネント
const ReferralDashboard = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReferralPlanActive, setIsReferralPlanActive] = useState(false); 
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [copied, setCopied] = useState(false);

  // 1. Firebaseの認証処理
  useEffect(() => {
    if (!authInstance) {
      setError("Firebase Authが初期化されていません。設定を確認してください。");
      setIsLoading(false);
      return;
    }

    // 認証リスナーの設定
    const unsubscribe = onAuthStateChanged(authInstance, async (user) => {
      if (!user) {
        try {
          // Canvas環境での認証処理
          // __initial_auth_token の存在チェック
          if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            // authInstanceの型をAuthとしてアサート
            await signInWithCustomToken(authInstance as Auth, __initial_auth_token); 
          } else {
            await signInAnonymously(authInstance as Auth);
          }
        } catch (e: any) {
          console.error("Firebase Sign-In Failed:", e);
          setError("認証に失敗しました。コンソールを確認してください。");
        }
      }
      // 認証後、ユーザーIDを設定
      setUserId(authInstance.currentUser?.uid || 'anonymous');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. 紹介プランの状態リスニング
  useEffect(() => {
    if (!dbInstance || !userId || isLoading) return;

    setError(null);
    // dbInstanceの型をFirestoreとしてアサート
    const subDocRef = getReferralPlanDocRef(dbInstance as Firestore);

    // リアルタイムリスナーの設定
    const unsubscribeSub = onSnapshot(subDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setIsReferralPlanActive(!!data.isReferralPlanActive); 
      } else {
        // ドキュメントがない場合は無効と判断し、初期状態を書き込む
        setIsReferralPlanActive(false);
        setDoc(subDocRef, { isReferralPlanActive: false, updatedAt: Date.now() }, { merge: true }).catch(console.error);
      }
    }, (e) => {
      console.error("Firestore Referral Plan Snapshot Error:", e);
      setError("紹介プラン情報の取得中にエラーが発生しました。");
    });

    return () => unsubscribeSub();
  }, [userId, isLoading]);

  // 3. 紹介プランの有効化/無効化（管理者承認をシミュレート）
  const toggleReferralPlan = async () => {
    if (!dbInstance || isUpdatingStatus) return;

    // TODO: 実際のアプリでは、カスタムモーダルUIに置き換える
    // window.confirm() の使用は避けるべきですが、デモ動作として残します。
    const confirmation = window.confirm(`本当に紹介報酬発生を${isReferralPlanActive ? '無効化' : '有効化'}しますか？\n(これは、システム上の設定を切り替える操作です)`);
    if (!confirmation) return;

    setIsUpdatingStatus(true);
    
    try {
      // dbInstanceの型をFirestoreとしてアサート
      const subDocRef = getReferralPlanDocRef(dbInstance as Firestore); 
      const newStatus = !isReferralPlanActive;

      await setDoc(subDocRef, { 
        isReferralPlanActive: newStatus,
        updatedAt: Date.now(),
      }, { merge: true }); 

    } catch (e) {
      console.error("Error toggling referral plan: ", e);
      setError("紹介プランの状態更新に失敗しました。");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // 4. URL生成とコピー
  const referralUrl = userId ? `https://your-app-landing-page.com/?ref=${userId}` : 'URL生成中...';

  const handleCopy = () => {
    // 実際のTSX環境ではnavigator.clipboard.writeTextを使用できますが、
    // Canvas環境の制約を考慮し、最も安全な方法を維持します。
    try {
      const tempInput = document.createElement('textarea');
      tempInput.value = referralUrl;
      document.body.appendChild(tempInput);
      tempInput.select();
      // document.execCommand('copy') は非推奨ですが、iframe環境では信頼性が高い
      document.execCommand('copy'); 
      document.body.removeChild(tempInput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Copy failed:", e);
      // alertの代わりにカスタムメッセージボックスを使用
      console.log("コピーに失敗しました。URLを直接選択してコピーしてください。");
    }
  };

  // 5. QRコードダウンロードのモック
  const handleDownload = () => {
    // 実際のコードでは、HTML Canvasの内容をBlobとしてダウンロードする処理が入ります。
    console.log("QRコードのダウンロード機能はデモです。");
    // TODO: alert()の代わりにカスタムメッセージボックスを使用することが推奨
    // window.confirm() の使用は避けるべきですが、デモ動作として残します。
    window.confirm("ダウンロード機能はデモです。コンソールを確認してください。"); 
  };
  
  // ロード中/未認証
  if (isLoading || !userId || !dbInstance) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="ml-3 text-gray-600">認証とデータを読み込み中...</p>
      </div>
    );
  }

  // UIステータスの決定
  const planLabel = isReferralPlanActive 
    ? { icon: <Unlock className="w-5 h-5 text-indigo-600" />, text: '有効化済み', style: 'bg-indigo-500 text-white' }
    : { icon: <Lock className="w-5 h-5 text-gray-600" />, text: '保留中/無効', style: 'bg-gray-500 text-white' };

  return (
    <div className="min-h-screen bg-gray-50 font-sans p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-800 border-b pb-3 flex items-center">
            <QrCode className="w-7 h-7 mr-2 text-indigo-600" />
            紹介報酬発生用コード発行
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            パートナーID: <span className="font-mono text-xs p-1 bg-gray-200 rounded">{userId}</span>
          </p>
        </header>

        {/* ---------------------------------------------------- */}
        {/* ステータス表示と管理者トグル (切り分けロジックの中心) */}
        {/* ---------------------------------------------------- */}
        <div className={`p-6 rounded-xl shadow-lg border-4 ${isReferralPlanActive ? 'border-indigo-500 bg-indigo-50' : 'border-red-500 bg-red-50'}`}>
          <div className="flex items-center justify-between mb-4 flex-wrap">
            <div className="flex items-center">
              {planLabel.icon}
              <span className="ml-3 font-bold text-xl text-gray-800">
                紹介報酬発生ステータス
              </span>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-bold ${planLabel.style} mt-2 sm:mt-0`}>
                {planLabel.text}
            </span>
          </div>

          <p className="text-gray-700 mb-4 text-sm font-bold">
            下記のボタンを押して、紹介システムをご利用ください。
          </p>
          
          <button
              onClick={toggleReferralPlan}
              disabled={isUpdatingStatus}
              className={`w-full py-3 px-4 text-sm font-bold rounded-lg transition duration-150 flex items-center justify-center ${
                  isReferralPlanActive 
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-green-600 text-white hover:bg-green-700'
              } disabled:opacity-50 shadow-md`}
          >
              {isUpdatingStatus ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : isReferralPlanActive ? (
                  <ToggleRight className="w-6 h-6 mr-1" />
              ) : (
                  <ToggleLeft className="w-6 h-6 mr-1" />
              )}
              {isReferralPlanActive ? '報酬発生ステータスを無効にする' : '報酬発生ステータスを有効にする'}
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 border border-red-400 rounded-lg">
            エラー: {error}
          </div>
        )}

        <div className="mt-8">
            {isReferralPlanActive ? (
                /* ---------------------------------------------------- */
                /* 有効化された機能エリア */
                /* ---------------------------------------------------- */
                <div className="bg-white p-8 rounded-xl shadow-2xl text-center">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">紹介報酬発生コードが有効です！</h2>
                    <p className="mt-2 text-gray-600 mb-8">
                        このURLまたはQRコードからお客様が有料アプリに登録すると、あなたに紹介報酬が支払われます。
                    </p>

                    <div className="space-y-8">
                        {/* URL表示 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 text-left mb-1">紹介用URL</label>
                            <div className="mt-1 flex rounded-lg shadow-sm">
                                <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                                    <Link className="w-5 h-5" />
                                </span>
                                <input 
                                    type="text" 
                                    readOnly 
                                    value={referralUrl} 
                                    className="flex-1 block w-full sm:text-sm border-gray-300 bg-gray-100 p-3" 
                                />
                                <button 
                                    onClick={handleCopy} 
                                    type="button" 
                                    className="w-32 -ml-px relative inline-flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 text-sm font-medium rounded-r-lg text-white bg-indigo-600 hover:bg-indigo-700 transition"
                                >
                                    <Clipboard className="w-4 h-4" />
                                    <span>{copied ? 'コピー済み！' : 'コピー'}</span>
                                </button>
                            </div>
                        </div>

                        {/* QRコード表示 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 text-left mb-3">紹介用QRコード</label>
                            <div className="flex justify-center p-6 border rounded-xl bg-gray-50">
                                <QRCodeMock value={referralUrl} />
                            </div>
                            <p className="text-xs text-gray-500 mt-2">お客様のスマートフォンで読み取ってもらってください。</p>
                        </div>
                    </div>
                    
                    {/* ダウンロードボタン */}
                    <div className="mt-8">
                        <button 
                            onClick={handleDownload} 
                            className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition-colors shadow-lg flex items-center justify-center mx-auto"
                        >
                            <Download className="w-5 h-5 mr-2" />
                            QRコードをダウンロード (デモ)
                        </button>
                    </div>
                </div>

            ) : (
                /* ---------------------------------------------------- */
                /* 無効化された機能エリア */
                /* ---------------------------------------------------- */
                <div className="bg-white p-12 rounded-xl shadow-2xl text-center border-2 border-red-300">
                    <Lock className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">紹介報酬発生コードは発行待ちです</h2>
                    <p className="text-gray-600">
                        現在、システムの設定により紹介報酬発生が無効（保留）になっています。
                    </p>
                    <p className="text-sm font-semibold text-red-500 mt-4">
                        有効化されると、この画面でコード発行が可能になり、振り込み口座の登録が可能になります。
                    </p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ReferralDashboard;