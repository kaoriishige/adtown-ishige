import React, { useState, useEffect } from 'react';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithCustomToken,
  signInAnonymously,
  onAuthStateChanged,
  signOut,
  setPersistence,
  browserLocalPersistence
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
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  Plus,
  Trash2,
  AlertTriangle,
  LogOut,
  CheckCircle,
  Clock,
  Loader2,
  ArrowLeft,
  X,
  BookOpen,
  ChefHat,
  RefreshCw,
  Users,
  Sparkles
} from 'lucide-react';

// --- 型定義 ---
interface FridgeItem {
  id: string;
  name: string;
  expirationDate: string | null;
  createdAt: any;
  used: boolean;
}

// --- 環境変数取得ヘルパー ---
const getEnvVar = (name: string): any => {
  if (typeof window !== 'undefined') {
    if (name === 'NEXT_PUBLIC_GEMINI_API_KEY') return process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if ((window as any)[name] !== undefined) return (window as any)[name];
  }
  return undefined;
};

const firebaseConfigRaw: string | null = getEnvVar('__firebase_config') || null;
const initialAuthToken: string | null = getEnvVar('__initial_auth_token') || null;
const appId: string = getEnvVar('__app_id') || 'default-app-id';
const GEMINI_API_KEY: string | undefined = getEnvVar('NEXT_PUBLIC_GEMINI_API_KEY');

const FridgeManagerApp = () => {
  // --- States ---
  const [firebase, setFirebase] = useState<{ auth: any, db: any, appId: string }>({ auth: null, db: null, appId: 'default-app-id' });
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [items, setItems] = useState<FridgeItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newExpirationDate, setNewExpirationDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [aiRecipe, setAiRecipe] = useState<string | null>(null);
  const [isRecipeLoading, setIsRecipeLoading] = useState(false);
  const [servings, setServings] = useState(2);

  // 1. Firebase初期化（認証の安定性を最大化）
  useEffect(() => {
    if (!firebaseConfigRaw) {
      setGlobalError("システム構成エラー: 管理者にお問い合わせください。");
      setLoading(false);
      return;
    }

    try {
      const firebaseConfig = JSON.parse(firebaseConfigRaw);
      const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
      const auth = getAuth(app);
      const db = getFirestore(app);
      setFirebase({ auth, db, appId });

      const initAuth = async () => {
        try {
          // 【重要】認証状態の保存先を「ブラウザのローカルストレージ」に強制固定。
          // これにより「initial state missing」エラー（sessionStorageの欠落）を回避します。
          await setPersistence(auth, browserLocalPersistence);

          if (initialAuthToken) {
            await signInWithCustomToken(auth, initialAuthToken);
          } else {
            // トークンがない場合のみ匿名ログイン
            if (!auth.currentUser) {
              await signInAnonymously(auth);
            }
          }
        } catch (err: any) {
          console.error("Auth persistence/sign-in error:", err);
          // 万が一ローカルストレージが使えない極限状態でも、動作を止めないための処理
          try {
            await signInAnonymously(auth);
          } catch (e) {
            setGlobalError("認証システムの接続に失敗しました。時間をおいて再度お試しください。");
          }
        }
      };

      initAuth();

      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        setIsAuthReady(true);
        setLoading(false);
      });
      return () => unsubscribe();
    } catch (e: any) {
      setGlobalError(`初期化エラー: ${e.message}`);
      setLoading(false);
    }
  }, []);

  // 2. データ同期
  useEffect(() => {
    const { db } = firebase;
    if (!isAuthReady || !user || !db) return;

    const itemsRef = collection(db, 'artifacts', appId, 'users', user.uid, 'fridgeItems');
    const unsubscribe = onSnapshot(query(itemsRef), (snapshot) => {
      const fetchedItems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as FridgeItem[];

      fetchedItems.sort((a, b) => {
        if (!a.expirationDate || !b.expirationDate) return 0;
        return new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime();
      });
      setItems(fetchedItems);
    }, (err) => {
      console.error("Firestore sync error:", err);
    });
    return () => unsubscribe();
  }, [isAuthReady, user, firebase]);

  // --- Actions ---
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const { db } = firebase;
    if (!newItemName.trim() || !user || !db) return;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'fridgeItems'), {
        name: newItemName.trim(),
        expirationDate: newExpirationDate || null,
        createdAt: serverTimestamp(),
        used: false
      });
      setNewItemName('');
      setNewExpirationDate('');
    } catch (err) {
      alert("食材の追加に失敗しました。");
    }
  };

  const handleToggleUsed = async (itemId: string, currentStatus: boolean) => {
    const { db } = firebase;
    if (!user || !db) return;
    await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'fridgeItems', itemId), { used: !currentStatus });
  };

  const handleDeleteItem = async (itemId: string) => {
    const { db } = firebase;
    if (!user || !db || !confirm('削除してもよろしいですか？')) return;
    await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'fridgeItems', itemId));
  };

  const handleGenerateRecipe = async () => {
    const activeItems = items.filter(item => !item.used);
    if (activeItems.length === 0) {
      setAiRecipe("冷蔵庫が空です。食材を追加してください。");
      return;
    }
    if (!GEMINI_API_KEY) {
      setAiRecipe("AI機能が現在利用できません。管理者設定を確認してください。");
      return;
    }

    setIsRecipeLoading(true);
    try {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const activeIngredients = activeItems.map(item => `${item.name} (${item.id})`);

      const prompt = `${servings}人分のレシピを提案してください。材料リスト: ${activeIngredients.join(', ')}。
      使用した食材のIDを必ず括弧内に含めてください。手順とコツも教えてください。`;

      const result = await model.generateContent(prompt);
      setAiRecipe(result.response.text());
    } catch (error: any) {
      setAiRecipe(`レシピ生成中にエラーが発生しました。しばらくしてから再度お試しください。`);
    } finally {
      setIsRecipeLoading(false);
    }
  };

  const getExpirationStatus = (dateString: string | null) => {
    if (!dateString) return 'none';
    const diffDays = Math.ceil((new Date(dateString).getTime() - new Date().setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24));
    return diffDays < 0 ? 'expired' : diffDays <= 3 ? 'warning' : 'ok';
  };

  if (globalError) return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="bg-white p-6 rounded-2xl shadow-xl border border-red-100 text-center max-w-sm">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-800 font-bold mb-4">{globalError}</p>
        <button onClick={() => window.location.reload()} className="w-full py-2 bg-blue-600 text-white rounded-xl">再読み込み</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-10 font-sans">
      <header className="bg-white p-4 shadow-sm flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <button onClick={() => window.location.href = '/premium/dashboard'} className="p-2 hover:bg-gray-100 rounded-full"><ArrowLeft /></button>
          <h1 className="font-bold text-lg">冷蔵庫管理</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsGuideOpen(true)} className="text-blue-600 border border-blue-600 px-3 py-1 rounded-full text-sm font-bold">使い方</button>
          {user && !user.isAnonymous && <button onClick={() => signOut(firebase.auth)} className="text-gray-400 p-2"><LogOut size={20} /></button>}
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-6">
        {/* 在庫登録フォーム */}
        <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-sm font-bold text-gray-500 mb-4">食材を追加する</h2>
          <form onSubmit={handleAddItem} className="space-y-3">
            <input type="text" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} placeholder="食材名 (例: 鶏もも肉)" className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500" required />
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-400 ml-1">賞味期限</span>
              <input type="date" value={newExpirationDate} onChange={(e) => setNewExpirationDate(e.target.value)} className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500" />
            </div>
            <button className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold flex justify-center gap-2 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100">
              {loading ? <Loader2 className="animate-spin" /> : <Plus />} 冷蔵庫に入れる
            </button>
          </form>
        </section>

        {/* AIレシピ提案 */}
        <section className="bg-gradient-to-br from-orange-50 to-amber-50 p-5 rounded-3xl border border-orange-100 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold flex items-center gap-2 text-orange-900"><ChefHat className="text-orange-600" />AIシェフの提案</h2>
            <div className="flex items-center gap-1 bg-white/50 px-2 py-1 rounded-lg">
              <Users size={14} className="text-orange-700" />
              <select value={servings} onChange={(e) => setServings(Number(e.target.value))} className="bg-transparent text-xs font-bold text-orange-900 border-none p-0 focus:ring-0">
                {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n}人分</option>)}
              </select>
            </div>
          </div>
          <button onClick={handleGenerateRecipe} disabled={isRecipeLoading || items.filter(i => !i.used).length === 0} className="w-full py-4 bg-orange-500 text-white rounded-2xl font-bold flex justify-center gap-2 shadow-lg shadow-orange-200 hover:bg-orange-600 transition-all active:scale-95 disabled:opacity-50">
            {isRecipeLoading ? <Loader2 className="animate-spin" /> : <Sparkles />} レシピを考えてもらう
          </button>

          {aiRecipe && (
            <div className="mt-4 p-4 bg-white rounded-2xl text-sm whitespace-pre-wrap relative border border-orange-100 animate-in fade-in slide-in-from-top-2 duration-300">
              <button onClick={() => setAiRecipe(null)} className="absolute top-3 right-3 text-gray-300 hover:text-gray-500"><X size={18} /></button>
              <div className="prose prose-sm prose-orange">{aiRecipe}</div>
            </div>
          )}
        </section>

        {/* 在庫リスト */}
        <section className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <h2 className="font-bold text-gray-800">今の在庫 ({items.filter(i => !i.used).length})</h2>
            <span className="text-xs text-gray-400">賞味期限が近い順</span>
          </div>

          {loading ? (
            <div className="py-10 text-center"><Loader2 className="animate-spin mx-auto text-gray-300" /></div>
          ) : items.filter(i => !i.used).length === 0 ? (
            <div className="bg-white p-10 rounded-3xl text-center border border-dashed border-gray-200">
              <p className="text-gray-400 text-sm">冷蔵庫は空っぽです</p>
            </div>
          ) : (
            items.filter(i => !i.used).map(item => {
              const status = getExpirationStatus(item.expirationDate);
              return (
                <div key={item.id} className={`bg-white p-4 rounded-2xl flex justify-between items-center shadow-sm border transition-all ${status === 'expired' ? 'border-red-200 bg-red-50' : status === 'warning' ? 'border-amber-200' : 'border-gray-50'}`}>
                  <div className="flex-1 min-w-0">
                    <div className={`font-bold truncate ${status === 'expired' ? 'text-red-700' : 'text-gray-800'}`}>{item.name}</div>
                    <div className={`text-xs flex items-center gap-1 ${status === 'expired' ? 'text-red-500' : status === 'warning' ? 'text-amber-600' : 'text-gray-400'}`}>
                      <Clock size={12} /> {item.expirationDate || '期限設定なし'}
                      {status === 'expired' && <span className="font-bold ml-1">期限切れ！</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button onClick={() => handleToggleUsed(item.id, false)} title="使い切った" className="p-2.5 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 active:scale-90 transition-all"><CheckCircle size={22} /></button>
                    <button onClick={() => handleDeleteItem(item.id)} title="削除" className="p-2.5 bg-gray-50 text-gray-300 rounded-xl hover:bg-red-50 hover:text-red-500 active:scale-90 transition-all"><Trash2 size={22} /></button>
                  </div>
                </div>
              );
            })
          )}
        </section>

        {/* 使用済み履歴 */}
        {items.some(i => i.used) && (
          <section className="pt-4 opacity-60">
            <h2 className="text-sm font-bold text-gray-400 mb-3 px-1">最近使い切った食材</h2>
            <div className="flex flex-wrap gap-2">
              {items.filter(i => i.used).slice(0, 10).map(item => (
                <div key={item.id} className="bg-gray-200/50 text-gray-500 px-3 py-1 rounded-lg text-xs flex items-center gap-1">
                  <span className="line-through">{item.name}</span>
                  <button onClick={() => handleDeleteItem(item.id)} className="hover:text-red-500"><X size={12} /></button>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* 使い方ガイドモーダル */}
      {isGuideOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white p-8 rounded-[2.5rem] max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
              <BookOpen size={32} />
            </div>
            <h3 className="font-bold text-2xl mb-4 text-gray-800">使い方ガイド</h3>
            <ul className="space-y-4 text-gray-600 text-sm mb-8">
              <li className="flex gap-3">
                <span className="bg-blue-100 text-blue-600 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0">1</span>
                食材の名前と賞味期限を登録します。
              </li>
              <li className="flex gap-3">
                <span className="bg-blue-100 text-blue-600 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0">2</span>
                AIシェフが、今の在庫だけで作れるレシピを提案します。
              </li>
              <li className="flex gap-3">
                <span className="bg-blue-100 text-blue-600 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0">3</span>
                使い切ったら緑のチェック。自動で履歴に移動します。
              </li>
            </ul>
            <button onClick={() => setIsGuideOpen(false)} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-colors">はじめる</button>
          </div>
        </div>
      )}

      <footer className="text-center py-10 text-xs text-gray-300">
        © 2025 冷蔵庫マネージャー | みんなの那須アプリ
      </footer>
    </div>
  );
};

export default FridgeManagerApp;