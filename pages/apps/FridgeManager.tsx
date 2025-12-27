import React, { useState, useEffect } from 'react';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
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

  // 1. Firebase初期化
  useEffect(() => {
    if (!firebaseConfigRaw) {
      setGlobalError("Firebase設定が見つかりません。");
      setIsAuthReady(true);
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
          if (initialAuthToken) {
            await signInWithCustomToken(auth, initialAuthToken);
          } else {
            await signInAnonymously(auth);
          }
        } catch (err) {
          console.error("Auth error:", err);
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
      setGlobalError("追加に失敗しました。");
    }
  };

  const handleToggleUsed = async (itemId: string, currentStatus: boolean) => {
    const { db } = firebase;
    if (!user || !db) return;
    await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'fridgeItems', itemId), { used: !currentStatus });
  };

  const handleDeleteItem = async (itemId: string) => {
    const { db } = firebase;
    if (!user || !db || !confirm('削除しますか？')) return;
    await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'fridgeItems', itemId));
  };

  const handleGenerateRecipe = async () => {
    const activeItems = items.filter(item => !item.used);
    if (activeItems.length === 0) {
      setAiRecipe("冷蔵庫が空です。食材を追加してください。");
      return;
    }
    if (!GEMINI_API_KEY) {
      setAiRecipe("APIキーが設定されていません。");
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
      setAiRecipe(`生成エラー: ${error.message}`);
    } finally {
      setIsRecipeLoading(false);
    }
  };

  const getExpirationStatus = (dateString: string | null) => {
    if (!dateString) return 'none';
    const diffDays = Math.ceil((new Date(dateString).getTime() - new Date().setHours(0,0,0,0)) / (1000 * 60 * 60 * 24));
    return diffDays < 0 ? 'expired' : diffDays <= 3 ? 'warning' : 'ok';
  };

  if (globalError) return <div className="p-10 text-center text-red-500">{globalError}</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <header className="bg-white p-4 shadow-sm flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <button onClick={() => window.location.href='/apps/categories'}><ArrowLeft /></button>
          <h1 className="font-bold text-lg">冷蔵庫管理</h1>
        </div>
        <button onClick={() => setIsGuideOpen(true)} className="text-blue-600 border border-blue-600 px-3 py-1 rounded-full text-sm">使い方</button>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-6">
        <section className="bg-white p-4 rounded-2xl shadow-sm border">
          <form onSubmit={handleAddItem} className="space-y-3">
            <input type="text" value={newItemName} onChange={(e)=>setNewItemName(e.target.value)} placeholder="食材名" className="w-full p-3 border rounded-xl" required />
            <input type="date" value={newExpirationDate} onChange={(e)=>setNewExpirationDate(e.target.value)} className="w-full p-3 border rounded-xl" />
            <button className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold flex justify-center gap-2"><Plus />追加</button>
          </form>
        </section>

        <section className="bg-orange-50 p-4 rounded-2xl border border-orange-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold flex items-center gap-2 text-orange-800"><ChefHat />AIレシピ提案</h2>
            <select value={servings} onChange={(e)=>setServings(Number(e.target.value))} className="p-1 rounded border">
              {[1,2,3,4].map(n => <option key={n} value={n}>{n}人分</option>)}
            </select>
          </div>
          <button onClick={handleGenerateRecipe} disabled={isRecipeLoading} className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold flex justify-center gap-2 shadow-md">
            {isRecipeLoading ? <Loader2 className="animate-spin" /> : <Sparkles />} レシピ作成
          </button>
          {aiRecipe && (
            <div className="mt-4 p-4 bg-white rounded-xl text-sm whitespace-pre-wrap relative border border-orange-100">
               <button onClick={()=>setAiRecipe(null)} className="absolute top-2 right-2 text-gray-400"><X size={16}/></button>
               {aiRecipe}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="font-bold px-1">在庫リスト ({items.filter(i=>!i.used).length})</h2>
          {items.filter(i=>!i.used).map(item => (
            <div key={item.id} className="bg-white p-4 rounded-2xl flex justify-between items-center shadow-sm border border-gray-100">
              <div>
                <div className="font-bold">{item.name}</div>
                <div className="text-xs text-gray-400">{item.expirationDate || '期限なし'}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={()=>handleToggleUsed(item.id, false)} className="p-2 bg-green-50 text-green-600 rounded-full"><CheckCircle size={20}/></button>
                <button onClick={()=>handleDeleteItem(item.id)} className="p-2 bg-gray-50 text-gray-400 rounded-full"><Trash2 size={20}/></button>
              </div>
            </div>
          ))}
        </section>
      </main>
      
      {isGuideOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6">
          <div className="bg-white p-6 rounded-3xl max-w-sm w-full">
            <h3 className="font-bold text-xl mb-4">使い方</h3>
            <p className="text-sm text-gray-600 mb-6">食材を登録して、AIボタンを押すだけで今ある材料からレシピを提案します。使い切った食材はチェックボタンで履歴へ移動できます。</p>
            <button onClick={()=>setIsGuideOpen(false)} className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold">閉じる</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FridgeManagerApp;