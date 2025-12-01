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
import { Plus, Trash2, AlertTriangle, LogOut, CheckCircle, Clock, Loader2, ArrowLeft, X, BookOpen, ChefHat, RefreshCw, Users, Sparkles } from 'lucide-react'; 

// Google Gen AI SDK のインポート
import { GoogleGenAI } from '@google/genai'; 

// --- 型定義 ---
interface FridgeItem {
  id: string;
  name: string;
  expirationDate: string | null;
  createdAt: any;
  used: boolean;
}

// --- Firebase Config & Initialization Helper ---
/**
 * 環境変数を取得するヘルパー関数。
 * (エラー7030対策: 戻り値の型を any に広げ、明示的に undefined を返す)
 */
const getEnvVar = (name: string): any => { // 戻り値の型を any に設定
    // Netlify/Next.jsのクライアント公開変数を直接読み込む
    if (typeof window !== 'undefined' && name === 'NEXT_PUBLIC_GEMINI_API_KEY') {
        return process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    }
    
    // 他の特殊な環境変数のための既存ロジック (windowオブジェクトからの取得を想定)
    if (typeof window !== 'undefined' && (window as any)[name] !== undefined) {
        return (window as any)[name];
    }
    
    // すべてのコードパスで値を返すことを保証
    return undefined; 
};

// 初期化時に値を安全に取得し、型を確定させる
const firebaseConfigRaw: string | null = getEnvVar('__firebase_config') || null;
const initialAuthToken: string | null = getEnvVar('__initial_auth_token') || null;
const appId: string = getEnvVar('__app_id') || 'default-app-id';

// NEXT_PUBLIC_GEMINI_API_KEY を取得 (string | undefined)
const GEMINI_API_KEY: string | undefined = getEnvVar('NEXT_PUBLIC_GEMINI_API_KEY');


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
  
  // --- AI Recipe State ---
  const [aiRecipe, setAiRecipe] = useState<string | null>(null);
  const [isRecipeLoading, setIsRecipeLoading] = useState(false);
  const [servings, setServings] = useState(2); // 人数設定

  // 1. Firebase初期化
  useEffect(() => {
    if (!firebaseConfigRaw) {
      setGlobalError("Firebase configuration not found.");
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
      
      initAuth();

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

  // 2. データ同期
  useEffect(() => {
    const { auth, db, appId } = firebase;
    if (!isAuthReady || !user || !db || !auth || globalError) {
      setItems([]);
      return;
    }

    setLoading(true);
    const itemsRef = collection(db, 'artifacts', appId, 'users', user.uid, 'fridgeItems');
    const q = query(itemsRef); 

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedItems: FridgeItem[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<FridgeItem, 'id'>), 
      } as FridgeItem));

      fetchedItems.sort((a, b) => {
        if (!a.expirationDate || !b.expirationDate) return 0;
        return new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime();
      });

      setItems(fetchedItems);
      setLoading(false);
    }, (err: any) => {
      console.error("Data sync error:", err);
      setGlobalError("在庫データの読み込みに失敗しました。"); 
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAuthReady, user, globalError, firebase]);

  // --- Actions ---
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const { db, appId } = firebase;
    if (!newItemName.trim() || !user || !db) return;

    const name = newItemName.trim();
    const expDate = newExpirationDate || null;

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

  // 決定されたレシピの食材を在庫から削除する（used: true にする）
  const handleRecipeDecision = async () => {
    const { db, appId } = firebase;
    if (!user || !db || !aiRecipe) return;
    
    if (!confirm('このレシピで作りますか？使用した食材は在庫から「使用済み」に移動します。')) {
      return;
    }

    try {
        // 1. AIの応答から使用した食材のIDをパースする (ユニークIDを持つもののみ)
        // 正規表現: 括弧内の文字列を全て抽出
        const regex = /\(([^)]+)\)/g; 
        
        let match;
        const usedIds: string[] = [];
        
        // aiRecipeから、プロンプトで要求した形式のIDを全て抽出
        while ((match = regex.exec(aiRecipe)) !== null) {
            const potentialId = match[1].trim();
            usedIds.push(potentialId);
        }
        
        // 重複を排除し、実際にアクティブな在庫リストにあるIDのみを対象とする
        const uniqueUsedIds = Array.from(new Set(usedIds)).filter(id => 
            items.some(item => item.id === id && !item.used)
        );

        if (uniqueUsedIds.length === 0) {
            alert('レシピから使用する食材のIDを特定できませんでした。全ての在庫をそのまま残します。');
            setAiRecipe(null);
            return;
        }
        
        // 2. IDに基づいて該当アイテムのusedフラグをtrueに更新
        // ※ 厳密な在庫の残量計算（例：300g中150g使用で残り150g）は、AI応答の複雑なパースとFirestoreのフィールド構造変更が必要なため、今回はスキップします。
        // シンプル化のため、レシピにIDが登場したアイテムは「使用済み」に移動します。
        const updates = uniqueUsedIds.map(id => {
            const itemRef = doc(db, 'artifacts', appId, 'users', user.uid, 'fridgeItems', id);
            return updateDoc(itemRef, { used: true });
        });
        
        await Promise.all(updates);

        setAiRecipe(null); // レシピ表示をクリア
        alert(`${uniqueUsedIds.length}種類の食材を使用済みに移動しました。`);

    } catch (err) {
      console.error("Recipe decision error:", err);
      setGlobalError("在庫の更新に失敗しました。");
    }
  };


  // --- AI Recipe Generation (Client-side API Call) ---
  const handleGenerateRecipe = async () => {
    // 修正: activeItemsをIDと名前を持つオブジェクトの配列として保持
    const activeItems = items.filter(item => !item.used);
    
    if (activeItems.length === 0) {
      setAiRecipe("冷蔵庫が空っぽです！まずは食材を追加してください。");
      return;
    }

    // 修正: プロンプトに渡す食材リストを「食材名 (ID)」形式にする
    const activeIngredients = activeItems.map(item => `${item.name} (${item.id})`);
    
    // NEXT_PUBLIC_GEMINI_API_KEYが設定されているか確認
    if (!GEMINI_API_KEY) {
        setAiRecipe("エラー: NEXT_PUBLIC_GEMINI_API_KEYが設定されていません。Netlify環境変数を確認してください。" as string | null);
        return;
    }

    setIsRecipeLoading(true);
    setAiRecipe(null);
    
    // クライアントサイドで直接GoogleGenAIを使用 (APIキーをオプションオブジェクトとして渡す)
    try {
        const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY }); 
        
        // 🚨 修正後のプロンプト: 日本の標準的な分量を強く要求し、ID付与を指示
        const prompt = `以下の食材を使って、${servings}人分の簡単で美味しいレシピを提案してください。

提案するレシピの分量は**${servings}人分を厳守**し、材料には**具体的なグラム数、個数、またはml、大さじなどの単位**を記載してください。
特に肉や魚、野菜などの主たる材料は、**日本の家庭料理における${servings}人前の標準的な分量（例：肉類は1人あたり80g〜100g）**を基準に記載してください。
在庫リストは、使用可能な食材の参照にのみ使用してください。

**重要**: レシピの「材料」セクションでは、元の食材リストにある食材を使う場合、必ずその食材名に続く括弧内のユニークIDをレシピの材料名にもそのまま付与してください。
例: 食材リストに「豚こま肉 300g (item_xyz)」がある場合、レシピの材料は「豚こま肉 (item_xyz) 150g」のようにしてください。

レシピに使い切れなかった食材については、**残った食材の保管方法または翌日以降の活用方法**を箇条書きで提案してください。

食材リスト: ${activeIngredients.join(', ')}

(指示: レシピ名、材料、手順を分かりやすく箇条書きで記述してください。)`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        // resultTextのエラー対策: response.textがundefinedでないかチェック
        const resultText = response.text; 
        
        if (resultText) {
             setAiRecipe(resultText); 
        } else {
             setAiRecipe("レシピの生成に失敗しました。AIからの応答が空でした。プロンプトを見直してください。");
        }
        
    } catch (error) { // エラーハンドリングを安全な型で実装
        console.error("AI Generation Error:", error);
        
        let errorMessage: string;
        if (error instanceof Error) {
            errorMessage = error.message;
        } else if (typeof error === 'object' && error !== null && 'message' in error) {
             errorMessage = String((error as any).message); 
        } else {
             errorMessage = String(error);
        }
        
        setAiRecipe(`レシピの生成に失敗しました。Gemini APIエラー: ${errorMessage}`);
    } finally {
      setIsRecipeLoading(false);
    }
  };

  // --- Helper Functions ---
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
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mt-4">
          再読み込み
        </button>
      </div>
    );
  }

  const handleGoCategories = () => {
      window.location.href = '/apps/categories'; 
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {isGuideOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md animate-fade-in-up">
                  <div className="p-4 border-b flex justify-between items-center">
                      <h2 className="text-xl font-bold text-gray-800">使い方ガイド</h2>
                      <button onClick={() => setIsGuideOpen(false)} className="text-gray-500 hover:text-gray-800"><X size={24} /></button>
                  </div>
                  <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto text-sm">
                      <h3 className="font-bold text-lg text-blue-600">目的：フードロス削減と献立の効率化</h3>
                      <p className="text-gray-700">冷蔵庫の在庫を一元管理し、AIが献立を提案して毎日の料理をサポートします。</p>
                      <div className="border-t pt-3">
                          <h4 className="font-bold text-base mb-2">1. 在庫の登録</h4>
                          <ul className="list-disc list-inside ml-4 space-y-1">
                              <li>**食材名**: 「豚こま肉 300g」など、量も入力すると便利です。</li>
                              <li>**日付**: 賞味期限を入力すると、期限切れ・間近を警告します。</li>
                          </ul>
                      </div>
                      <div className="border-t pt-3">
                          <h4 className="font-bold text-base mb-2">2. AIレシピ提案</h4>
                          <p className="text-gray-700 ml-4">「AIでレシピを提案」ボタンで、現在の在庫からレシピを考案します。</p>
                      </div>
                  </div>
                  <div className="p-4 border-t text-center">
                      <button onClick={() => setIsGuideOpen(false)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg">閉じる</button>
                  </div>
              </div>
          </div>
      )}
      
      <header className="bg-white shadow-md sticky top-0 z-10 p-4 border-b border-gray-200">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={handleGoCategories} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Clock className="w-6 h-6 text-blue-500" />
              <span className="hidden sm:inline">冷蔵庫 在庫管理</span>
              <span className="sm:hidden">在庫管理</span>
            </h1>
          </div>
          <div className="flex gap-2 items-center">
              <button onClick={() => setIsGuideOpen(true)} className="text-sm text-blue-600 hover:text-blue-800 border border-blue-600 hover:border-blue-800 rounded-full px-3 py-1 transition-colors flex items-center gap-1">
                <BookOpen size={16} /><span className="hidden sm:inline">使い方</span>
              </button>
              {user && (
                  <button onClick={() => signOut(firebase.auth!)} className="text-sm text-gray-500 hover:text-red-500 ml-1"><LogOut className="w-5 h-5" /></button>
              )}
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto p-4 sm:p-6">
        
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
            <label className="block text-sm text-gray-600 font-semibold">賞味期限入力</label>
            <input
              type="date"
              value={newExpirationDate}
              onChange={(e) => setNewExpirationDate(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-600"
            />
            <button type="submit" disabled={loading || !newItemName.trim()} className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              冷蔵庫に追加
            </button>
          </form>
        </section>

        <section className="mb-8">
            <div className="bg-gradient-to-r from-orange-100 to-yellow-50 p-4 rounded-xl border border-orange-200 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-bold text-orange-800 flex items-center gap-2">
                        <ChefHat className="w-6 h-6" />
                        AIシェフの献立提案
                    </h2>
                </div>
                <p className="text-sm text-orange-700 mb-4">今ある在庫を使って、AIがおすすめレシピを考えます。</p>
                
                <div className="mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-orange-600" />
                    <span className="text-sm font-bold text-orange-800">何人分？</span>
                    <select value={servings} onChange={(e) => setServings(Number(e.target.value))} className="bg-white border border-orange-300 text-orange-900 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 block p-2.5">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                            <option key={num} value={num}>{num}人分</option>
                        ))}
                    </select>
                </div>

                <button onClick={handleGenerateRecipe} disabled={isRecipeLoading || activeItems.length === 0} className="w-full py-3 bg-orange-500 text-white font-bold rounded-lg shadow hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
                    {isRecipeLoading ? <><Loader2 className="w-5 h-5 animate-spin" />レシピを考案中...</> : <><Sparkles className="w-5 h-5" />AIでレシピを提案</>}
                </button>

                {aiRecipe && (
                    <div className="mt-4 bg-white p-4 rounded-lg border border-orange-200 animate-fade-in-up">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-lg text-gray-800">提案レシピ ({servings}人分)</h3>
                            <button onClick={() => setAiRecipe(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                        </div>
                        <div className="prose prose-orange prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                            {aiRecipe}
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                            <button onClick={handleRecipeDecision} className="flex-1 py-2 bg-green-600 text-white font-bold rounded-lg shadow hover:bg-green-700 transition-colors">
                                <CheckCircle className="w-5 h-5 inline mr-1" /> このレシピで決定
                            </button>
                            <button onClick={handleGenerateRecipe} className="py-2 px-3 text-orange-600 text-sm font-bold hover:bg-orange-50 rounded-lg flex items-center gap-1 transition-colors">
                                <RefreshCw className="w-4 h-4" /> 別のレシピ
                            </button>
                        </div>
                        
                    </div>
                )}
            </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"><span className="text-green-600">🟢</span> 在庫 ({activeItems.length}品)</h2>
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
                  <div key={item.id} className={`p-4 bg-white rounded-xl shadow-sm border ${isWarning ? 'border-red-400 bg-red-50' : 'border-gray-200'} flex items-center justify-between transition-shadow hover:shadow-md`}>
                    <div className="flex flex-col flex-1 min-w-0">
                      <p className={`font-bold text-base mb-1 ${isWarning ? 'text-red-800' : 'text-gray-800'} truncate`}>{item.name}</p>
                      <ExpirationTag dateString={item.expirationDate} status={status} />
                    </div>
                    <div className="flex gap-2 items-center flex-shrink-0 ml-4">
                      <button onClick={() => handleToggleUsed(item.id, item.used)} title="使用済みにする" className="p-2 rounded-full bg-green-500 text-white hover:bg-green-600 transition"><CheckCircle size={18} /></button>
                      <button onClick={() => handleDeleteItem(item.id)} title="完全に削除" className="p-2 rounded-full bg-gray-200 text-gray-600 hover:bg-red-500 hover:text-white transition"><Trash2 size={18} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"><span className="text-gray-400">🗑️</span> 使用済み (履歴)</h2>
          <div className="space-y-2 max-h-48 overflow-y-auto p-2 bg-white rounded-xl border border-gray-200 shadow-sm">
            {usedItems.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">使用済みアイテムはありません。</p>
            ) : (
              usedItems.map(item => (
                <div key={item.id} className="text-sm text-gray-500 flex justify-between items-center px-2 py-1 border-b border-gray-100">
                  <span className="line-through">{item.name}</span>
                  <button onClick={() => handleDeleteItem(item.id)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
      <footer className="text-center py-6 text-xs text-gray-400">© 2025 みんなの那須アプリ</footer>
    </div>
  );
};

export default FridgeManagerApp;