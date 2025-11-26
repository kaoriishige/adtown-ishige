import React, { useState, useEffect } from 'react';
import { 
  getAuth, 
  signInWithCustomToken, 
  signInAnonymously, 
  onAuthStateChanged,
  signOut
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  serverTimestamp, 
  query
} from 'firebase/firestore';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { Plus, Trash2, AlertTriangle, LogOut, CheckCircle, Clock, Loader2, ArrowLeft, X, BookOpen } from 'lucide-react'; 

// --- 型定義 ---
interface FridgeItem {
  id: string;
  name: string;
  expirationDate: string | null;
  createdAt: any;
  used: boolean;
}

// --- Firebase Config & Initialization Helper ---
const getEnvVar = (name: string): any => {
    if (typeof window !== 'undefined' && (window as any)[name] !== undefined) {
        return (window as any)[name];
    }
    return undefined;
};

const firebaseConfigRaw = getEnvVar('__firebase_config');
const initialAuthToken = getEnvVar('__initial_auth_token') || null;
const appId = getEnvVar('__app_id') || 'default-app-id';

const FridgeManagerApp = () => {
  // --- Firebase State ---
  const [firebase, setFirebase] = useState<{ auth: ReturnType<typeof getAuth> | null, db: ReturnType<typeof getFirestore> | null, appId: string }>({ auth: null, db: null, appId: 'default-app-id' });
  const [globalError, setGlobalError] = useState<string | null>(null);

  // --- App State ---
  const [user, setUser] = useState<any>(null);
  const [items, setItems] = useState<FridgeItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newExpirationDate, setNewExpirationDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false); 


  // 1. Firebase初期化とAuthセットアップ (CRITICAL FIX: 遅延初期化)
  useEffect(() => {
    // 1-1. 初期化ロジック
    if (!firebaseConfigRaw) {
      setGlobalError("Firebase configuration not found. (設定変数が見つかりません)");
      setIsAuthReady(true);
      setLoading(false);
      return;
    }

    try {
      const firebaseConfig = JSON.parse(firebaseConfigRaw);
      if (Object.keys(firebaseConfig).length === 0) {
        throw new Error("Firebase configuration is empty.");
      }
      
      const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
      const auth = getAuth(app);
      const db = getFirestore(app);
      
      setFirebase({ auth, db, appId });

      // Auth処理
      const initAuth = async () => {
        try {
          if (initialAuthToken) {
            await signInWithCustomToken(auth, initialAuthToken as string);
          } else {
            await signInAnonymously(auth);
          }
        } catch (err) {
          console.error("Auth error:", err);
          setGlobalError("認証に失敗しました。リロードしてください。");
        }
      };
      
      initAuth(); // サインイン試行

      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        setIsAuthReady(true);
        setLoading(false);
      });

      return () => unsubscribe();
      
    } catch (e: any) {
      console.error("Firebase Initialization Error:", e);
      setGlobalError(`Initialization failed: ${e.message}`);
      setIsAuthReady(true);
      setLoading(false);
    }
  }, []); 

  // 2. Data Synchronization (onSnapshot)
  useEffect(() => {
    const { auth, db, appId } = firebase;
    // Authインスタンスがnullでないことを確認
    if (!isAuthReady || !user || !db || !auth || globalError) {
      setItems([]);
      return;
    }

    setLoading(true);
    // Path: /artifacts/{appId}/users/{userId}/fridgeItems
    const itemsRef = collection(db, 'artifacts', appId, 'users', user.uid, 'fridgeItems');
    const q = query(itemsRef); 

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedItems: FridgeItem[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<FridgeItem, 'id'>), 
      } as FridgeItem));

      // Sort by expiration date (client-side)
      fetchedItems.sort((a, b) => {
        if (!a.expirationDate || !b.expirationDate) return 0;
        return new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime();
      });

      setItems(fetchedItems);
      setLoading(false);
    }, (err: any) => {
      console.error("Data sync error:", err);
      // Firebaseルールエラーの可能性を指摘
      setGlobalError("在庫データの読み込みに失敗しました。Firebaseのセキュリティルールを確認してください。"); 
      setLoading(false);
    });

    return () => unsubscribe();
    // ★修正: firebaseオブジェクトを依存配列に追加
  }, [isAuthReady, user, globalError, firebase]);

  // --- Actions ---
  
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const { db, appId } = firebase;
    if (!newItemName.trim() || !user || !db) return;

    const name = newItemName.trim();
    const expDate = newExpirationDate || null; // 賞味期限がない場合も許可

    try {
      await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'fridgeItems'), {
        name: name,
        expirationDate: expDate,
        createdAt: serverTimestamp(),
        used: false
      });
      setNewItemName('');
      setNewExpirationDate('');
    } catch (err) {
      console.error("Add item error:", err);
      setGlobalError("食材の追加に失敗しました。");
    }
  };
  
  const handleToggleUsed = async (itemId: string, currentStatus: boolean) => {
    const { db, appId } = firebase;
    if (!user || !db) return;
    try {
      const itemRef = doc(db, 'artifacts', appId, 'users', user.uid, 'fridgeItems', itemId);
      await updateDoc(itemRef, { used: !currentStatus });
    } catch (err) {
      console.error("Toggle used error:", err);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    const { db, appId } = firebase;
    if (!user || !db) return;
    if (!confirm('この食材を削除しますか？')) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'fridgeItems', itemId));
    } catch (err) {
      console.error("Delete item error:", err);
    }
  };

  const getExpirationStatus = (dateString: string | null): 'none' | 'expired' | 'warning' | 'ok' => {
    if (!dateString) return 'none';
    const today = new Date();
    today.setHours(0,0,0,0);
    const expDate = new Date(dateString);
    expDate.setHours(0,0,0,0);
    
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'expired';
    if (diffDays <= 3) return 'warning';
    return 'ok';
  };

  const ExpirationTag = ({ dateString, status }: { dateString: string | null, status: 'none' | 'expired' | 'warning' | 'ok' }) => {
    if (status === 'none') return <span className="text-gray-400 text-xs">期限なし</span>;

    const date = new Date(dateString!).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' });
    
    let colorClass, text;
    
    const today = new Date();
    const expDate = new Date(dateString!);
    today.setHours(0,0,0,0);
    expDate.setHours(0,0,0,0);
    const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (status === 'expired') {
      colorClass = 'bg-red-500 text-white';
      text = '期限切れ！';
    } else if (status === 'warning') {
      colorClass = 'bg-yellow-400 text-gray-900';
      text = `残り ${diffDays}日`;
    } else {
      colorClass = 'bg-green-100 text-green-700';
      text = `〜${date}`;
    }

    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${colorClass}`}>
        {text}
      </span>
    );
  };

  const activeItems = items.filter(item => !item.used);
  const usedItems = items.filter(item => item.used);
  
  if (globalError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <h1 className="text-xl font-bold text-gray-800 mb-2">システムエラー</h1>
        <p className="text-gray-600 mb-4 text-center max-w-md">{globalError}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mt-4"
        >
          再読み込み
        </button>
      </div>
    );
  }

  // ★修正: リンクの代わりにボタンを使用し、window.locationで遷移させる
  const handleGoCategories = () => {
      window.location.href = '/apps/categories'; // 遷移先を categories に変更
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
        
      {/* 使い方モーダル */}
      {isGuideOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                  <div className="p-4 border-b flex justify-between items-center">
                      <h2 className="text-xl font-bold text-gray-800">使い方ガイド</h2>
                      <button onClick={() => setIsGuideOpen(false)} className="text-gray-500 hover:text-gray-800">
                          <X size={24} />
                      </button>
                  </div>
                  <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto text-sm">
                      <h3 className="font-bold text-lg text-blue-600">目的：フードロス削減と献立の効率化</h3>
                      <p className="text-gray-700">
                          このアプリは、冷蔵庫の在庫と賞味期限を一元管理し、無駄な買い物を防ぐために作られました。
                      </p>

                      <div className="border-t pt-3">
                          <h4 className="font-bold text-base mb-2">1. 在庫の登録</h4>
                          <ul className="list-disc list-inside ml-4 space-y-1">
                              <li>**食材名**: 「豚こま肉 300g」など、量も一緒に登録すると便利です。</li>
                              <li>**日付**: 賞味期限を入力すると、自動で期限が近いものに警告マーク（黄色）がつきます。</li>
                              <li>**追加**: 「冷蔵庫に追加」ボタンで在庫リストに入ります。</li>
                          </ul>
                      </div>

                      <div className="border-t pt-3">
                          <h4 className="font-bold text-base mb-2">2. ステータスの管理</h4>
                          <ul className="list-disc list-inside ml-4 space-y-1">
                              <li>**🟢 在庫**: まだ使用していない食材です。</li>
                              <li>**✅ 使用済みボタン**: 食材を使い切ったら、緑色のチェックボタンを押してください。履歴に移動します。</li>
                              <li>**🗑️ 削除ボタン**: 食材を完全にリストから消したい場合に使います。</li>
                          </ul>
                      </div>

                      <div className="border-t pt-3">
                          <h4 className="font-bold text-base mb-2">3. 買い物リスト候補</h4>
                          <p className="text-gray-700">
                              このセクションは、将来的に献立AIと連携し、**在庫がないため買うべき食材**を自動でリストアップするために使用されます。（このセクションは現在表示されません）
                          </p>
                      </div>

                  </div>
                  <div className="p-4 border-t text-center">
                      <button onClick={() => setIsGuideOpen(false)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg">
                          アプリを始める
                      </button>
                  </div>
              </div>
          </div>
      )}
      
      <header className="bg-white shadow-md sticky top-0 z-10 p-4 border-b border-gray-200">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          {/* ★修正: 遷移先を handleGoCategories に変更 */}
          <button onClick={handleGoCategories} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Clock className="w-6 h-6 text-blue-500" />
            冷蔵庫 在庫管理
          </h1>
          
          <div className="flex gap-2">
              <button 
                  onClick={() => setIsGuideOpen(true)} 
                  className="text-sm text-blue-600 hover:text-blue-800 border border-blue-600 hover:border-blue-800 rounded-full px-3 py-1 transition-colors flex items-center gap-1"
              >
                  <BookOpen size={16} />使い方
              </button>
              {user ? (
                  <button onClick={() => signOut(firebase.auth!)} className="text-sm text-gray-500 hover:text-red-500">
                      <LogOut className="w-5 h-5" />
                  </button>
              ) : (
                  <div className="w-5 h-5"></div>
              )}
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto p-4 sm:p-6">
        
        {/* 在庫登録フォーム */}
        <section className="mb-6 bg-white p-4 rounded-xl shadow-lg border border-gray-200">
          <h2 className="text-lg font-bold mb-3 text-gray-700">新しい在庫の登録</h2>
          <form onSubmit={handleAddItem} className="space-y-3">
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="食材名 (例: 豚こま肉 300g)"
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="date"
              value={newExpirationDate}
              onChange={(e) => setNewExpirationDate(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-600"
            />
            <button
              type="submit"
              disabled={loading || !newItemName.trim()}
              className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              冷蔵庫に追加
            </button>
          </form>
        </section>

        {/* 在庫一覧 (使用前) */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-green-600">🟢</span> 在庫 ({activeItems.length}品)
          </h2>
          
          {loading ? (
            <div className="text-center py-10"><Loader2 className="w-8 h-8 text-gray-300 animate-spin mx-auto" /></div>
          ) : activeItems.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-dashed border-gray-300">
              <p className="text-gray-500">冷蔵庫は空です。食材を追加しましょう。</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeItems.map(item => {
                const status = getExpirationStatus(item.expirationDate);
                const isWarning = status !== 'ok';

                return (
                  <div 
                    key={item.id} 
                    className={`p-4 bg-white rounded-xl shadow-sm border ${isWarning ? 'border-red-400 bg-red-50' : 'border-gray-200'} flex items-center justify-between transition-shadow hover:shadow-md`}
                  >
                    <div className="flex flex-col flex-1 min-w-0">
                      <p className={`font-bold text-base mb-1 ${isWarning ? 'text-red-800' : 'text-gray-800'} truncate`}>
                        {item.name}
                      </p>
                      <ExpirationTag dateString={item.expirationDate} status={status} />
                    </div>
                    
                    <div className="flex gap-2 items-center flex-shrink-0 ml-4">
                      <button 
                        onClick={() => handleToggleUsed(item.id, item.used)}
                        title="使用済みにする"
                        className="p-2 rounded-full bg-green-500 text-white hover:bg-green-600 transition"
                      >
                        <CheckCircle size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteItem(item.id)}
                        title="完全に削除"
                        className="p-2 rounded-full bg-gray-200 text-gray-600 hover:bg-red-500 hover:text-white transition"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* 買い物リスト (削除済み) */}
        
        {/* 使用済みリスト (履歴) */}
        <section>
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-gray-400">🗑️</span> 使用済み (履歴)
          </h2>
          <div className="space-y-2 max-h-48 overflow-y-auto p-2 bg-white rounded-xl border border-gray-200 shadow-sm">
            {usedItems.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">使用済みアイテムはありません。</p>
            ) : (
              usedItems.map(item => (
                <div key={item.id} className="text-sm text-gray-500 flex justify-between items-center px-2 py-1 border-b border-gray-100">
                  <span className="line-through">{item.name}</span>
                  <button onClick={() => handleDeleteItem(item.id)} className="text-red-400 hover:text-red-600">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
        
        {/* 使い方ガイドをフッターの上に配置 (常に表示) */}
        <div className="mt-8 p-6 bg-white rounded-xl shadow-lg border border-blue-200">
            <h2 className="text-lg font-bold text-blue-600 mb-3 flex items-center gap-2">
                <BookOpen size={20} /> 使い方ガイド
            </h2>
            <div className="space-y-3 text-sm">
                <div className="border-t pt-3">
                    <h4 className="font-bold text-base mb-1">1. 在庫の登録</h4>
                    <ul className="list-disc list-inside ml-4 space-y-1 text-gray-700">
                        <li>**食材名**: 「豚こま肉 300g」など、量も一緒に登録してください。</li>
                        <li>**日付**: 賞味期限を入力すると、自動で**赤（期限切れ）**や**黄（期限間近）**の警告がつきます。</li>
                    </ul>
                </div>

                <div className="border-t pt-3">
                    <h4 className="font-bold text-base mb-1">2. ステータスの管理</h4>
                    <ul className="list-disc list-inside ml-4 space-y-1 text-gray-700">
                        <li>**✅ 使用済み**: 食材を使い切ったら、緑色のチェックボタンを押してください。履歴に移動します。</li>
                        <li>**🗑️ 削除**: 完全にリストから消したい場合に使います。</li>
                    </ul>
                </div>
            </div>
        </div>
      </main>

      <footer className="text-center py-6 text-xs text-gray-400">
        © 2025 みんなの那須アプリ
      </footer>
    </div>
  );
};

export default FridgeManagerApp;