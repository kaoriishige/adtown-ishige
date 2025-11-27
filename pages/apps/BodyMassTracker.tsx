import React, { useState, useEffect, useMemo } from 'react';
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
  onSnapshot, 
  query, 
  serverTimestamp,
  deleteDoc,
  doc
} from 'firebase/firestore';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { Plus, AlertTriangle, LogOut, Heart, Loader2, ArrowLeft, Calculator, Clock, Trash2, BookOpen } from 'lucide-react'; 

// --- 型定義 ---
interface RecordItem {
  id: string;
  weight: number;
  height: number;
  date: string;
  createdAt: any;
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

const BodyMassTrackerApp = () => {
  // --- Firebase State ---
  const [firebase, setFirebase] = useState<{ auth: ReturnType<typeof getAuth> | null, db: ReturnType<typeof getFirestore> | null, appId: string }>({ auth: null, db: null, appId: 'default-app-id' });
  const [globalError, setGlobalError] = useState<string | null>(null);

  // --- App State ---
  const [user, setUser] = useState<any>(null);
  const [records, setRecords] = useState<RecordItem[]>([]);
  
  const [newWeight, setNewWeight] = useState('');
  const [newHeight, setNewHeight] = useState(''); // 初回入力後に保存
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().substring(0, 10));
  
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);


  // 1. Firebase初期化とAuthセットアップ
  useEffect(() => {
    if (!firebaseConfigRaw) {
      setGlobalError("Firebase configuration not found. (設定変数が見つかりません)");
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

  // 2. Data Synchronization (onSnapshot)
  useEffect(() => {
    const { db, appId } = firebase;
    // 認証が完了し、ユーザーが存在する場合のみデータ取得を行う
    if (!isAuthReady || !user || !db || globalError) {
      setRecords([]);
      return;
    }

    setLoading(true);
    // Path: /artifacts/{appId}/users/{userId}/bodyRecords
    const recordsRef = collection(db, 'artifacts', appId, 'users', user.uid, 'bodyRecords');
    
    // ★重要: orderByを使わず、全てのデータを取得する単純なクエリにします（インデックスエラー回避）
    const q = query(recordsRef); 

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedRecords: RecordItem[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<RecordItem, 'id'>), 
      } as RecordItem));

      // JavaScript側で日付の降順（新しい順）に並び替え
      fetchedRecords.sort((a, b) => {
        if (a.date > b.date) return -1;
        if (a.date < b.date) return 1;
        return 0;
      });

      setRecords(fetchedRecords);
      setLoading(false);

      // 身長がまだ入力欄になく、過去の記録がある場合は最新の身長を自動セット
      if (fetchedRecords.length > 0 && !newHeight) {
          const lastHeight = fetchedRecords[0].height;
          if (lastHeight) setNewHeight(lastHeight.toString());
      }
      
    }, (err: any) => {
      console.error("Data sync error:", err);
      // エラーの詳細を表示してデバッグしやすくする
      setGlobalError(`データ読み込みに失敗しました。(${err.code || err.message})`); 
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAuthReady, user, globalError, firebase, newHeight]); // newHeightを依存配列に追加（自動入力のため）

  // 3. タイトル設定 (Next/Headの代替)
  useEffect(() => {
    document.title = "体重記録＆BMI";
  }, []);

  // --- Calculations & Helpers ---

  const latestRecord = records[0];

  const calculateBmi = (weight: number, height: number): number | null => {
      if (!weight || !height) return null;
      // 身長をcmからmに変換
      const heightM = height / 100;
      return parseFloat((weight / (heightM * heightM)).toFixed(1));
  };

  const getBmiCategory = (bmi: number): { text: string, color: string } => {
    if (bmi < 18.5) return { text: '低体重', color: 'bg-blue-100 text-blue-700' };
    if (bmi < 25) return { text: '普通体重', color: 'bg-green-500 text-white' };
    if (bmi < 30) return { text: '肥満(1度)', color: 'bg-yellow-500 text-gray-900' };
    return { text: '肥満(2度以上)', color: 'bg-red-500 text-white' };
  };

  const currentBmi = useMemo(() => {
    if (latestRecord && latestRecord.weight && latestRecord.height) {
        return calculateBmi(latestRecord.weight, latestRecord.height);
    }
    return null;
  }, [latestRecord]);


  // --- Actions ---
  
  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    const { db, appId } = firebase;
    const weightNum = parseFloat(newWeight);
    const heightNum = parseFloat(newHeight);

    if (!weightNum || !heightNum || !user || !db || isNaN(weightNum) || isNaN(heightNum)) {
        alert("体重と身長を正しく入力してください。");
        return;
    }
    
    setLoading(true);

    try {
      await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'bodyRecords'), {
        weight: weightNum,
        height: heightNum,
        date: currentDate,
        createdAt: serverTimestamp(),
      });
      setNewWeight(''); // 体重だけリセット（身長は維持）
    } catch (err: any) {
      console.error("Add record error:", err);
      alert(`記録の追加に失敗しました: ${err.message}`);
    } finally {
        setLoading(false);
    }
  };
  
  const handleDeleteRecord = async (recordId: string) => {
    const { db, appId } = firebase;
    if (!user || !db) return;
    if (!confirm('この記録を削除しますか？')) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'bodyRecords', recordId));
    } catch (err) {
      console.error("Delete record error:", err);
      alert("削除に失敗しました。");
    }
  };


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

  const handleGoCategories = () => {
      window.location.href = '/apps/categories';
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-20">
      
      <header className="bg-white shadow-sm sticky top-0 z-10 p-4 border-b border-gray-200">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <button onClick={handleGoCategories} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Heart className="w-6 h-6 text-pink-500" />
            体重記録＆BMI
          </h1>
          
          <div className="flex gap-2">
              {user && firebase.auth ? (
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
        
        {/* BMI/現在のステータス表示 */}
        <section className="mb-8 bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 border rounded-lg bg-indigo-50 border-indigo-200">
              <p className="text-sm text-indigo-700 font-medium">現在の体重</p>
              <p className="text-3xl font-extrabold text-indigo-800 mt-1">
                {latestRecord ? latestRecord.weight.toFixed(1) : '—'} <span className="text-lg font-semibold">kg</span>
              </p>
            </div>
            
            <div className="text-center p-3 border rounded-lg bg-green-50 border-green-200">
              <p className="text-sm text-green-700 font-medium">BMI</p>
              <p className="text-3xl font-extrabold text-green-800 mt-1">
                {currentBmi ? currentBmi.toFixed(1) : '—'}
              </p>
              {currentBmi !== null && (
                <span className={`mt-1 inline-block px-2 py-0.5 rounded-full text-xs font-bold ${getBmiCategory(currentBmi).color}`}>
                  {getBmiCategory(currentBmi).text}
                </span>
              )}
            </div>
          </div>
        </section>

        {/* 記録フォーム */}
        <section className="mb-8 bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
            <Calculator size={20} /> 毎日の記録
          </h2>
          <form onSubmit={handleAddRecord} className="space-y-3">
            <input
                type="number"
                value={newHeight}
                onChange={(e) => setNewHeight(e.target.value)}
                placeholder="身長 (cm) - 初回のみ必須"
                min="50" max="250" step="0.1"
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-pink-500 focus:border-pink-500 text-gray-600"
            />
            <input
              type="date"
              value={currentDate}
              onChange={(e) => setCurrentDate(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-pink-500 focus:border-pink-500 text-gray-600"
            />
            <input
              type="number"
              value={newWeight}
              onChange={(e) => setNewWeight(e.target.value)}
              placeholder="今日の体重 (kg)"
              min="20" max="300" step="0.1"
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-pink-500 focus:border-pink-500 text-lg font-bold"
            />
            <button
              type="submit"
              disabled={loading || !newWeight.trim() || !newHeight.trim()}
              className="w-full py-3 bg-pink-600 text-white font-bold rounded-lg shadow-md hover:bg-pink-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus size={20} />}
              記録を追加
            </button>
          </form>
        </section>

        {/* 記録履歴 */}
        <section>
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Clock size={20} /> 記録履歴 ({records.length}件)
          </h2>
          
          {loading && records.length === 0 ? (
            <div className="text-center py-10"><Loader2 className="w-8 h-8 text-gray-300 animate-spin mx-auto" /></div>
          ) : records.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-dashed border-gray-300">
              <p className="text-gray-500">まだ記録がありません。</p>
            </div>
          ) : (
            <div className="space-y-3">
              {records.map(record => {
                const bmi = calculateBmi(record.weight, record.height);
                const bmiText = bmi ? getBmiCategory(bmi).text : '—';
                const bmiColor = bmi ? getBmiCategory(bmi).color : 'bg-gray-200';

                return (
                  <div 
                    key={record.id} 
                    className={`p-4 bg-white rounded-xl shadow-sm border border-gray-200 flex justify-between items-center`}
                  >
                    <div className="flex flex-col flex-1 min-w-0">
                      <p className="text-xs text-gray-500 mb-1">{record.date}</p>
                      <p className="font-bold text-xl text-gray-800">
                        {record.weight.toFixed(1)} <span className="text-sm font-normal">kg</span>
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-4 flex-shrink-0">
                        <div className="text-right">
                            <p className="text-xs text-gray-500">BMI</p>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${bmiColor}`}>
                                {bmiText} ({bmi?.toFixed(1)})
                            </span>
                        </div>
                      <button 
                        onClick={() => handleDeleteRecord(record.id)}
                        title="記録を削除"
                        className="p-2 rounded-full bg-gray-100 text-gray-500 hover:bg-red-500 hover:text-white transition"
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
      </main>
      
      {/* 使い方ガイドセクション */}
      <section className="max-w-xl mx-auto p-4 sm:p-6 pt-0">
          <div className="mt-8 p-6 bg-white rounded-xl shadow-lg border border-blue-200">
              <h2 className="text-lg font-bold text-blue-600 mb-3 flex items-center gap-2">
                  <BookOpen size={20} /> 使い方ガイド
              </h2>
              <div className="space-y-3 text-sm">
                  <div className="border-t pt-3">
                      <h4 className="font-bold text-base mb-1">1. データの保存について</h4>
                      <ul className="list-disc list-inside ml-4 space-y-1 text-gray-700">
                          <li>記録はすべてデータベースに保存され、アプリを閉じても消えません。</li>
                          <li>記録が溜まりすぎても、**右側のゴミ箱アイコン**で個別に削除できます。</li>
                      </ul>
                  </div>
                  <div className="border-t pt-3">
                      <h4 className="font-bold text-base mb-1">2. BMI判定基準（厚生労働省）</h4>
                      <div className="overflow-x-auto mt-2">
                          <table className="w-full text-left text-sm border-collapse">
                              <thead>
                                  <tr className="bg-gray-100">
                                      <th className="p-2 font-semibold">判定</th>
                                      <th className="p-2 font-semibold">BMI値</th>
                                      <th className="p-2 font-semibold">アプリ表示</th>
                                  </tr>
                              </thead>
                              <tbody>
                                  <tr className="border-t">
                                      <td className="p-2">低体重</td>
                                      <td className="p-2">18.5未満</td>
                                      <td className="p-2 text-blue-700 font-medium">低体重</td>
                                  </tr>
                                  <tr className="border-t">
                                      <td className="p-2 font-bold">普通体重</td>
                                      <td className="p-2">18.5以上 25未満</td>
                                      <td className="p-2 bg-green-500 text-white font-medium rounded-full w-fit">普通体重</td>
                                  </tr>
                                  <tr className="border-t">
                                      <td className="p-2">肥満(1度)</td>
                                      <td className="p-2">25以上 30未満</td>
                                      <td className="p-2 text-yellow-700 font-medium">肥満(1度)</td>
                                  </tr>
                                  <tr className="border-t">
                                      <td className="p-2">肥満(2度以上)</td>
                                      <td className="p-2">30以上</td>
                                      <td className="p-2 text-red-700 font-medium">肥満(2度以上)</td>
                                  </tr>
                              </tbody>
                          </table>
                      </div>
                  </div>
              </div>
          </div>
      </section>

      <footer className="text-center py-6 text-xs text-gray-400">
        © 2025 みんなの那須アプリ
      </footer>
    </div>
  );
};

export default BodyMassTrackerApp;