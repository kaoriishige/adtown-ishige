import { useState, useEffect, useCallback, useMemo } from 'react';
import type { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { db, auth, storage } from '../../lib/firebase-client';
import {
  collection, query, where, getDocs, addDoc, serverTimestamp, orderBy, doc, Timestamp, deleteDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, uploadBytesResumable, getStorage } from "firebase/storage";
import { onAuthStateChanged, User } from 'firebase/auth';
import { v4 as uuidv4 } from 'uuid';
import Head from 'next/head';
import { RiArrowLeftLine } from 'react-icons/ri';

// グローバル変数の型を宣言
declare const __app_id: string;

// グローバル変数または環境変数からアプリIDを取得
const appId = process.env.NEXT_PUBLIC_APP_ID || (typeof __app_id !== 'undefined' ? __app_id : 'default-app-id');

// --- 型定義 ---
interface Store {
  id: string;
  ownerId: string;
  mainCategory?: string;
  subCategory?: string;
}

interface MediaItem {
  url: string;
  type: 'image' | 'video';
}

interface Deal {
  id: string;
  type: 'お得情報' | 'クーポン' | 'フードロス';
  title: string;
  description: string;
  imageUrl?: string; // 後方互換性のため残す
  mediaUrls?: MediaItem[]; // 複数画像・動画用
  createdAt: string; // ISO 8601 string
}

// 説明文のプレースホルダー
const dealPlaceholders: { [key: string]: { [key: string]: string } } = {
  'お得情報': {
    '飲食関連': '【例文】本日限定！とちおとめを贅沢に使った新作パフェが登場しました！数量限定ですのでお早めにどうぞ。',
    '買い物関連': '【例文】明日から3日間限定で、店内全品10%OFFのセールを開催します！この機会をお見逃しなく。',
    '美容・健康関連': '【例文】新生活応援キャンペーン！4月中にご予約いただくと、新しいヘッドスパメニューを特別価格でお試しいただけます。',
    'デフォルト': '【例文】期間限定のイベントが始まります！詳しくは店頭スタッフまでお問い合わせください。'
  },
  'クーポン': {
    'デフォルト': '【例文】この画面を提示していただいたお客様限定で、お会計から500円割引いたします。\n\n利用条件：\n・お一人様一回限り\n・他のクーポンとの併用不可\n・有効期限：YYYY年MM月DD日まで'
  },
  'フードロス': {
    '飲食関連': '【例文】本日、パンの在庫が多めのため、18時以降パン全品30%OFFでご提供します！ご協力お願いします！',
    '買い物関連': '【例文】本日入荷したお野菜ですが、少し形が不揃いなため特別価格で販売いたします。味は一級品です！',
    'デフォルト': '【例文】賞味期限が近いため、〇〇を本日限定で半額にて販売いたします。'
  }
};

// --- ページコンポーネント ---
const PartnerDealsPage: NextPage = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false); // 認証確認完了フラグ
  const [store, setStore] = useState<Store | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true); // データ読み込み中フラグ

  // フォームのState
  const [newDealType, setNewDealType] = useState<'お得情報' | 'クーポン' | 'フードロス'>('お得情報');
  const [newDealTitle, setNewDealTitle] = useState('');
  const [newDealDescription, setNewDealDescription] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]); // 複数画像ファイル選択用
  const [videoUrl, setVideoUrl] = useState(''); // 動画URL入力用
  const [fileInputKey, setFileInputKey] = useState(0); // ファイル入力リセット用

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null); // アップロード状況表示用
  const [successMessage, setSuccessMessage] = useState<string | null>(null); // 登録完了メッセージ用
  const [error, setError] = useState<string | null>(null);
  const [debugLog, setDebugLog] = useState<string[]>([]);

  const addDebugLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setDebugLog(prev => [`[${time}] ${msg}`, ...prev].slice(0, 50));
    console.log(`[DEBUG] ${msg}`);
  };

  // プレースホルダーの動的生成
  const descriptionPlaceholder = useMemo(() => {
    const dealTypePlaceholders = dealPlaceholders[newDealType];
    const mainCategory = store?.mainCategory;

    if (mainCategory && dealTypePlaceholders[mainCategory]) {
      return dealTypePlaceholders[mainCategory];
    }
    return dealTypePlaceholders['デフォルト'];
  }, [newDealType, store]);

  // 認証チェック
  useEffect(() => {
    addDebugLog(`Initializing Auth check... appId: ${appId}`);
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        addDebugLog(`Auth confirmed: ${currentUser.uid}`);
        setUser(currentUser);
        setAuthChecked(true); // ユーザー確認完了
      } else {
        addDebugLog("No active userSession. Redirecting to login...");
        setLoading(false); // ローディング終了（ログインページへ遷移するため）
        setAuthChecked(true);
        router.push('/partner/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  // データ取得関数
  const fetchStoreAndDeals = useCallback(async (currentUser: User) => {
    try {
      setLoading(true);
      setError(null);
      const storesRef = collection(db, 'artifacts', appId, 'users', currentUser.uid, 'stores');
      const storeQuery = query(storesRef);
      const storeSnapshot = await getDocs(storeQuery);

      if (storeSnapshot.empty) {
        setError("店舗情報が見つかりません。まずプロフィールを登録してください。");
        setLoading(false);
        return;
      }

      const storeDoc = storeSnapshot.docs[0];
      const fetchedStore = { id: storeDoc.id, ...storeDoc.data() } as Store;
      setStore(fetchedStore);

      const dealsRef = collection(db, 'artifacts', appId, 'users', currentUser.uid, 'stores', fetchedStore.id, 'deals');

      // ★★★ 解決策 (B) : インデックス作成後に `orderBy` を元に戻す ★★★
      const dealsQuery = query(dealsRef, orderBy("createdAt", "desc"));
      // ※ もしインデックス作成がまだなら、上の行をコメントアウトし、下の行を有効にしてください。
      // const dealsQuery = query(dealsRef); 

      const dealsSnapshot = await getDocs(dealsQuery);

      const dealsData = dealsSnapshot.docs.map(doc => {
        const data = doc.data();

        let isoDate = new Date().toISOString();
        const createdAtTimestamp = data.createdAt as Timestamp;

        if (createdAtTimestamp && typeof createdAtTimestamp.toDate === 'function') {
          isoDate = createdAtTimestamp.toDate().toISOString();
        } else if (data.createdAt) {
          try {
            isoDate = new Date(data.createdAt).toISOString();
          } catch (e) {
            console.warn("Invalid date format in deal:", doc.id, data.createdAt);
          }
        }

        return {
          id: doc.id,
          type: data.type,
          title: data.title,
          description: data.description,
          imageUrl: data.imageUrl,
          mediaUrls: data.mediaUrls,
          createdAt: isoDate,
        };
      });
      setDeals(dealsData);

    } catch (err: any) {
      console.error("データ取得エラー:", err);
      let userMessage = "データの読み込みに失敗しました。";

      if (err.code === 'failed-precondition' || (err.message && err.message.toLowerCase().includes('index'))) {
        userMessage = "データベース設定エラー: この機能に必要なインデックスがありません。Firebaseコンソールで「deals」コレクション（コレクション グループ）に「createdAt (降順)」のインデックスを作成してください。";
      } else if (err.code === 'permission-denied') {
        userMessage = "データの読み込み権限がありません。Firebaseのルール設定を確認してください。";
      }
      setError(userMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // 認証完了時にデータを取得（初回のみ）
  useEffect(() => {
    if (user && authChecked) {
      addDebugLog("Auth and User ready. Fetching data...");
      fetchStoreAndDeals(user);
    }
  }, [user, authChecked, fetchStoreAndDeals]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      const MAX_FILES = 5;
      const MAX_SIZE = 3 * 1024 * 1024; // 3MB

      if (selectedFiles.length + newFiles.length > MAX_FILES) {
        setError(`最大${MAX_FILES}枚までしか登録できません。安定動作のため枚数を制限しています。`);
        return;
      }

      for (const file of newFiles) {
        if (file.size > MAX_SIZE) {
          setError(`ファイル "${file.name}" が3MBを超えています。安定動作のため、小さい画像を使用してください。`);
          return;
        }
      }

      setError(null);
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateDeal = async (event: React.FormEvent) => {
    event.preventDefault();
    console.log("Starting registration...");
    if (!store || !user) {
      console.error("Store or user missing");
      setError("店舗情報またはユーザー情報が読み込めていません。");
      return;
    }
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    addDebugLog(`Registration started (AppID: ${appId}). Preparing files...`);

    try {
      const mediaItems: MediaItem[] = [];
      let mainImageUrl = '';

      // 画像ファイルのアップロード
      if (selectedFiles.length > 0) {
        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          const logPrefix = `[${i + 1}/${selectedFiles.length}] ${file.name}: `;

          try {
            const extension = file.name.split('.').pop() || 'png';
            const sanitizedFileName = `${Date.now()}_${uuidv4()}.${extension}`;
            const fileRef = ref(storage, `ads/${store.id}/${sanitizedFileName}`);

            // Resumable upload with progress and timeout
            addDebugLog(`${logPrefix} Starting Storage upload...`);
            const uploadTask = uploadBytesResumable(fileRef, file);

            const uploadPromise = new Promise<string>((resolve, reject) => {
              const timeoutId = setTimeout(() => {
                uploadTask.cancel();
                reject(new Error("アップロードが120秒でタイムアウトしました。通信環境やファイルサイズをご確認ください。"));
              }, 120000); // 120秒に延長

              uploadTask.on('state_changed',
                (snapshot) => {
                  // 進捗率をUIにフィードバック
                  const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                  setUploadStatus(`${logPrefix} ${progress.toFixed(0)}%`);
                  console.log(`${logPrefix} ${progress.toFixed(0)}%`);
                },
                (error: any) => {
                  clearTimeout(timeoutId);
                  console.error("Upload error details:", error);
                  let errorMsg = error.message;
                  if (error.code === 'storage/unauthorized') {
                    errorMsg = "ストレージへの書き込み権限がありません。storage.rulesの設定を確認してください。";
                  } else if (error.code === 'storage/canceled') {
                    errorMsg = "アップロードがキャンセルされました（タイムアウトの可能性があります）。";
                  }
                  reject(new Error(`アップロード失敗 (${file.name}): ${errorMsg}`));
                },
                async () => {
                  clearTimeout(timeoutId);
                  addDebugLog(`${logPrefix} Upload success. Fetching URL...`);
                  const url = await getDownloadURL(uploadTask.snapshot.ref);
                  resolve(url);
                }
              );
            });

            const url = await uploadPromise;

            if (!mainImageUrl) mainImageUrl = url;
            mediaItems.push({ url, type: 'image' });

          } catch (fileErr: any) {
            console.error(`File upload error (${file.name}):`, fileErr);
            throw fileErr;
          }

          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      // 動画URL
      if (videoUrl.trim()) {
        mediaItems.push({ url: videoUrl.trim(), type: 'video' });
      }

      const dealsCollectionRef = collection(db, 'artifacts', appId, 'users', user.uid, 'stores', store.id, 'deals');

      const newDealData = {
        type: newDealType,
        title: newDealTitle,
        description: newDealDescription,
        imageUrl: mainImageUrl,
        mediaUrls: mediaItems,
        ownerId: user.uid,
        createdAt: serverTimestamp(),
        isActive: true,
      };

      addDebugLog("All files uploaded. Saving to Firestore...");
      const docRef = await addDoc(dealsCollectionRef, newDealData);
      addDebugLog(`Successfully registered! ID: ${docRef.id}`);
      console.log("Document added with ID:", docRef.id);

      // ローカルStateを更新（再取得によるフリーズ回避）
      const newDealState: Deal = {
        id: docRef.id,
        type: newDealType,
        title: newDealTitle,
        description: newDealDescription,
        imageUrl: mainImageUrl,
        mediaUrls: mediaItems,
        createdAt: new Date().toISOString()
      };

      setDeals(prev => [newDealState, ...prev]);

      setNewDealTitle('');
      setNewDealDescription('');
      setSelectedFiles([]);
      setVideoUrl('');
      setFileInputKey(prev => prev + 1);
      setSuccessMessage("登録が完了しました！");

    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err.message || '登録中にエラーが発生しました。');
    } finally {
      setIsSubmitting(false);
      setUploadStatus(null);
    }
  };

  const handleDeleteDeal = async (dealId: string) => {
    if (!user || !store) {
      alert("ログイン情報または店舗情報がありません。");
      return;
    }
    if (!window.confirm("この情報を本当に削除しますか？")) return;

    setError(null);
    try {
      const dealDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'stores', store.id, 'deals', dealId);
      await deleteDoc(dealDocRef);

      setDeals(prevDeals => prevDeals.filter(deal => deal.id !== dealId));
      alert('削除しました。');

    } catch (err: any) {
      console.error("削除エラー:", err);
      setError(err.message);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-3xl min-h-screen flex flex-col">
      <Head>
        <title>{"お得情報・クーポン・フードロス管理"}</title>
      </Head>

      <div className="flex-grow">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">お得情報・クーポン・フードロス管理</h1>
          <Link href="/partner/dashboard" className="text-blue-600 hover:underline flex items-center">
            <RiArrowLeftLine className="mr-1" /> ダッシュボードに戻る
          </Link>
        </div>

        {!authChecked ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-lg font-semibold text-gray-700">認証情報を確認中...</p>
              <p className="text-sm text-gray-500 mt-2">画面下のログを確認してください</p>
            </div>
          </div>
        ) : !user ? (
          <div className="flex justify-center items-center py-20">ログインページへ移動しています...</div>
        ) : (
          <>

            <form onSubmit={handleCreateDeal} className="space-y-4 p-4 border rounded-lg mb-8 bg-white shadow">
              <h2 className="text-xl font-semibold">新規登録</h2>
              <div>
                <label className="font-bold">種別</label>
                <select
                  value={newDealType}
                  onChange={(e) => setNewDealType(e.target.value as 'お得情報' | 'クーポン' | 'フードロス')}
                  className="w-full p-2 border rounded mt-1"
                >
                  <option value="お得情報">お得情報</option>
                  <option value="クーポン">クーポン</option>
                  <option value="フードロス">フードロス</option>
                </select>
              </div>
              <div><label className="font-bold">タイトル</label><input type="text" value={newDealTitle} onChange={(e) => setNewDealTitle(e.target.value)} required className="w-full p-2 border rounded mt-1" /></div>
              <div><label className="font-bold">説明文</label><textarea value={newDealDescription} onChange={(e) => setNewDealDescription(e.target.value)} required className="w-full p-2 border rounded mt-1" rows={5} placeholder={descriptionPlaceholder}></textarea></div>
              <div>
                <label className="font-bold">画像 (追加・複数可)</label>
                <input
                  type="file"
                  key={fileInputKey}
                  onChange={handleFileChange}
                  accept="image/*"
                  multiple
                  className="w-full p-2 border rounded mt-1 text-sm"
                />
                {selectedFiles.length > 0 && (
                  <div className="mt-2 p-2 border rounded bg-gray-50">
                    <p className="text-sm font-bold text-gray-700 mb-1">選択中の画像 ({selectedFiles.length}枚):</p>
                    <ul className="space-y-1">
                      {selectedFiles.map((file, index) => (
                        <li key={index} className="flex justify-between items-center text-xs bg-white p-1 border rounded">
                          <span className="truncate flex-1 mr-2">{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                          <button
                            type="button"
                            onClick={() => removeSelectedFile(index)}
                            className="text-red-500 hover:text-red-700 font-bold px-2"
                          >
                            削除
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div>
                <label className="font-bold">動画URL (任意)</label>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... または https://example.com/video.mp4"
                  className="w-full p-2 border rounded mt-1 text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">動画はURLで登録してください（YouTube、Vimeo、直接URLなど）</p>
              </div>

              <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-green-500 text-white font-bold rounded hover:bg-green-600 disabled:bg-gray-400 mt-4 w-full">
                {isSubmitting ? (uploadStatus || '処理中...') : '登録する'}
              </button>
            </form>

            <h2 className="text-xl font-semibold">登録済みリスト</h2>

            {successMessage && <p className="text-green-600 my-4 bg-green-100 p-3 rounded text-sm font-semibold whitespace-pre-wrap">{successMessage}</p>}
            {error && <p className="text-red-500 my-4 bg-red-100 p-3 rounded text-sm font-semibold whitespace-pre-wrap">エラー: {error}</p>}

            {loading ? (
              <div className="text-center py-4">データを読み込み中...</div>
            ) : (
              <div className="space-y-4 mt-4">
                {deals.length > 0 ? (
                  deals.map(deal => (
                    <div key={deal.id} className="bg-white p-4 border rounded-lg flex flex-col gap-4 shadow-sm">
                      <div className="flex justify-between items-start">
                        <div className="min-w-0 flex-1">
                          <span className="text-xs bg-gray-200 rounded-full px-2 py-1 font-semibold">{deal.type}</span>
                          <p className="font-bold truncate mt-1 text-lg">{deal.title}</p>
                          <p className="text-sm text-gray-600 whitespace-pre-wrap">{deal.description}</p>
                        </div>
                        <div className="text-right flex-shrink-0 flex flex-col items-end ml-4">
                          <p className="text-xs text-gray-500 mb-2">{deal.createdAt ? new Date(deal.createdAt).toLocaleDateString('ja-JP') : ''}</p>
                          <button onClick={() => handleDeleteDeal(deal.id)} className="text-red-500 hover:underline text-sm">削除</button>
                        </div>
                      </div>

                      {/* メディア表示エリア */}
                      {deal.mediaUrls && deal.mediaUrls.length > 0 ? (
                        <div className="flex gap-2 overflow-x-auto pb-2">
                          {deal.mediaUrls.map((media, idx) => {
                            if (media.type === 'video') {
                              // YouTube URLを埋め込み形式に変換
                              let embedUrl = media.url;
                              if (media.url.includes('youtube.com/watch?v=')) {
                                const videoId = media.url.split('v=')[1]?.split('&')[0];
                                embedUrl = `https://www.youtube.com/embed/${videoId}`;
                              } else if (media.url.includes('youtu.be/')) {
                                const videoId = media.url.split('youtu.be/')[1]?.split('?')[0];
                                embedUrl = `https://www.youtube.com/embed/${videoId}`;
                              }

                              return (
                                <iframe
                                  key={idx}
                                  src={embedUrl}
                                  className="w-64 h-40 rounded flex-shrink-0"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                />
                              );
                            } else {
                              return (
                                <img key={idx} src={media.url} alt={`img-${idx}`} className="w-40 h-40 object-cover rounded flex-shrink-0" />
                              );
                            }
                          })}
                        </div>
                      ) : (
                        deal.imageUrl && <img src={deal.imageUrl} alt={deal.title} className="w-40 h-40 object-cover rounded" />
                      )}
                    </div>
                  ))
                ) : (
                  !error && <p>まだ情報が登録されていません。</p>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* デバッグログ表示 (本番での切り分け用) */}
      <div className="mt-20 p-4 bg-gray-900 text-green-400 font-mono text-xs rounded-lg overflow-auto max-h-60 border-2 border-gray-700">
        <p className="font-bold border-b border-gray-700 mb-2 pb-1">Debug Terminal</p>
        <p className="mb-2 italic opacity-70">※ エラー調査用のログです。解決したら削除します。</p>
        {debugLog.map((log, i) => (
          <div key={i}>{log}</div>
        ))}
        {debugLog.length === 0 && <div>Waiting for events...</div>}
      </div>
    </div>
  );
};

export default PartnerDealsPage;
