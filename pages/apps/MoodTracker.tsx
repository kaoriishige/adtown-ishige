import React, { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import { 
  getAuth, 
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
  orderBy, 
  serverTimestamp, 
  deleteDoc, 
  doc,
  updateDoc // ★修正: updateDoc を追加
} from 'firebase/firestore';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
// ★修正: Clock を追加し、XとLogOutは使用しているため維持
import { ArrowLeft, AlertTriangle, Loader2, Smile, Calendar, LogOut, CheckCircle, Trash2, X, Sun, Clock } from 'lucide-react'; 

// --- 型定義 ---
interface MoodLog {
    id: string;
    date: string;
    mood: string; // 😡 😢 🙂 😄 🤩
    memo: string;
    createdAt: any;
}

// --- 環境変数の取得 ---
const getEnvVar = (name: string): any => {
    if (typeof window !== 'undefined' && (window as any)[name] !== undefined) {
        return (window as any)[name];
    }
    return undefined;
};

const firebaseConfigRaw = getEnvVar('__firebase_config');
const initialAuthToken = getEnvVar('__initial_auth_token') || null;
const appId = getEnvVar('__app_id') || 'mood-tracker-app';


export default function MoodTrackerApp() {
    const [user, setUser] = useState<any>(null);
    const [logs, setLogs] = useState<MoodLog[]>([]);
    
    const [selectedMood, setSelectedMood] = useState('🙂');
    const [memo, setMemo] = useState('');
    const [currentDate, setCurrentDate] = useState(new Date().toISOString().substring(0, 10));
    
    const [loading, setLoading] = useState(true);
    const [globalError, setGlobalError] = useState<string | null>(null);

    // Firebaseインスタンス
    const [db, setDb] = useState<ReturnType<typeof getFirestore> | null>(null);
    const [authService, setAuthService] = useState<ReturnType<typeof getAuth> | null>(null);

    const MOOD_OPTIONS = ['🤩', '😄', '🙂', '😢', '😡'];

    // 1. Firebase初期化とAuthセットアップ
    useEffect(() => {
        if (!firebaseConfigRaw) {
            setGlobalError("Firebase configuration not found.");
            setLoading(false);
            return;
        }

        try {
            const firebaseConfig = JSON.parse(firebaseConfigRaw);
            const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
            const auth = getAuth(app);
            const firestoreDb = getFirestore(app);
            
            setDb(firestoreDb);
            setAuthService(auth);

            signInAnonymously(auth); 
            onAuthStateChanged(auth, (currentUser) => {
                setUser(currentUser);
                setLoading(false);
            });
        } catch (e: any) {
            console.error("Firebase Initialization Error:", e);
            setGlobalError(`Initialization failed: ${e.message}`);
            setLoading(false);
        }
    }, []); 

    // 2. Data Synchronization (ログの読み込み)
    useEffect(() => {
        if (!user || !db || globalError) {
            setLogs([]);
            return;
        }

        const logsRef = collection(db, 'artifacts', appId, 'users', user.uid, 'moodLogs');
        // 最新の記録が上になるように降順でソート
        const q = query(logsRef, orderBy('date', 'desc')); 

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedLogs: MoodLog[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...(doc.data() as Omit<MoodLog, 'id'>), 
            } as MoodLog));

            setLogs(fetchedLogs);
        }, (err: any) => {
            console.error("Data sync error:", err);
            setGlobalError("ログの読み込みに失敗しました。ルールを確認してください。"); 
        });

        return () => unsubscribe();
    }, [user, db, globalError]); 

    // --- Actions ---
    
    const handleAddLog = async () => {
        if (!user || !db || !selectedMood) return;

        // 今日のログが既にあるかチェック
        const existsToday = logs.find(log => log.date === currentDate);
        if (existsToday) {
            if (!confirm('今日の気分は既に記録されています。上書きしますか？')) return;
        }

        setLoading(true);

        const logData: Omit<MoodLog, 'id' | 'createdAt'> = {
            date: currentDate,
            mood: selectedMood,
            memo: memo.trim(),
        };

        try {
            if (existsToday) {
                // 更新
                await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'moodLogs', existsToday.id), {
                    ...logData,
                    updatedAt: serverTimestamp(),
                });
            } else {
                // 新規作成
                await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'moodLogs'), {
                    ...logData,
                    createdAt: serverTimestamp(),
                });
            }
            
            setMemo('');
            setGlobalError(null);
        } catch (err) {
            console.error("Add log error:", err);
            setGlobalError("記録の追加に失敗しました。");
        } finally {
            setLoading(false);
        }
    };
    
    const handleDeleteLog = async (logId: string) => {
        if (!user || !db) return;
        if (!confirm('この日の記録を削除しますか？')) return;
        try {
            await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'moodLogs', logId));
        } catch (err) {
            console.error("Delete log error:", err);
        }
    };

    // 週間分析 (過去7日間の感情頻度)
    const weeklyAnalysis = useMemo(() => {
        const last7Days = logs.slice(0, 7);
        const totals: { [key: string]: number } = {};
        let totalCount = 0;

        last7Days.forEach(log => {
            totals[log.mood] = (totals[log.mood] || 0) + 1;
            totalCount++;
        });

        if (totalCount === 0) return { message: '過去7日間の記録がありません。', moods: [] };

        const analysis = Object.entries(totals)
            .map(([mood, count]) => ({
                mood,
                count,
                percentage: ((count / totalCount) * 100).toFixed(0) + '%',
            }))
            .sort((a, b) => b.count - a.count); // 降順

        return { message: `過去7日間の傾向 (${totalCount}件)`, moods: analysis };
    }, [logs]);


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
            <Head><title>わたしの気分ログ</title></Head>

            {/* ヘッダー */}
            <header className="bg-white shadow-sm sticky top-0 z-10 p-4 border-b border-gray-200">
                <div className="max-w-xl mx-auto flex items-center justify-between">
                    <button onClick={handleGoCategories} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft size={20} className="text-gray-600" />
                    </button>
                    
                    <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Smile className="w-6 h-6 text-yellow-500" />
                        わたしの気分ログ
                    </h1>
                    
                    {authService ? (
                        <button onClick={() => signOut(authService)} className="text-sm text-gray-500 hover:text-red-500">
                            <LogOut size={20} />
                        </button>
                    ) : (
                        <div className="w-5 h-5"></div>
                    )}
                </div>
            </header>

            <main className="max-w-xl mx-auto p-4 sm:p-6">
                
                {/* 1. 気分登録フォーム */}
                <section className="mb-8 bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                    <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
                        <Sun size={20} /> 今日の気分を記録
                    </h2>
                    
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">日付</label>
                        <input
                            type="date"
                            value={currentDate}
                            onChange={(e) => setCurrentDate(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg text-gray-600"
                        />
                    </div>

                    <label className="block text-sm font-medium text-gray-700 mb-2">現在の気分を選択</label>
                    <div className="flex justify-around gap-2 mb-4">
                        {MOOD_OPTIONS.map(mood => (
                            <button
                                key={mood}
                                onClick={() => setSelectedMood(mood)}
                                className={`text-4xl p-2 rounded-xl transition-all border-4 ${
                                    selectedMood === mood ? 'border-yellow-500 shadow-md transform scale-110' : 'border-gray-200 hover:bg-gray-100'
                                }`}
                            >
                                {mood}
                            </button>
                        ))}
                    </div>

                    <textarea
                        value={memo}
                        onChange={(e) => setMemo(e.target.value)}
                        placeholder="メモ: 何が気分に影響したか (任意)"
                        rows={3}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500 mb-4 text-sm"
                    />

                    <button
                        onClick={handleAddLog}
                        disabled={loading || !selectedMood}
                        className="w-full py-3 bg-yellow-600 text-white font-bold rounded-lg shadow-md hover:bg-yellow-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle size={20} />}
                        {logs.find(log => log.date === currentDate) ? '記録を上書き保存' : '記録を追加'}
                    </button>
                </section>
                
                {/* 2. 週間分析 */}
                <section className="mb-8 p-6 bg-white rounded-xl shadow-lg border border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Calendar size={20} className="text-indigo-500" /> 過去7日間の傾向
                    </h2>
                    <p className="text-sm text-gray-600 mb-3">{weeklyAnalysis.message}</p>
                    
                    {weeklyAnalysis.moods.length > 0 ? (
                        <div className="space-y-3">
                            {weeklyAnalysis.moods.map(item => (
                                <div key={item.mood} className="flex justify-between items-center text-sm">
                                    <span className="font-bold text-gray-700">{item.mood}</span>
                                    <div className="flex items-center w-3/4 bg-gray-100 rounded-full h-3">
                                        <div 
                                            className="h-3 rounded-full bg-yellow-500 transition-all duration-700" 
                                            style={{ width: item.percentage }}
                                        ></div>
                                    </div>
                                    <span className="font-bold w-10 text-right">{item.percentage}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-sm">記録が足りません。</p>
                    )}
                </section>

                {/* 3. ログ履歴 */}
                <section>
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Clock size={20} className="text-gray-500" /> ログ履歴
                    </h2>
                    
                    {logs.length === 0 ? (
                        <p className="text-gray-500 text-sm text-center py-4">まだ記録がありません。</p>
                    ) : (
                        <div className="space-y-2">
                            {logs.map(log => (
                                <div key={log.id} className="p-3 bg-white rounded-lg shadow-sm border border-gray-200 flex justify-between items-start">
                                    <div className="flex items-start gap-3">
                                        <span className="text-2xl flex-shrink-0">{log.mood}</span>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-800">{log.date}</p>
                                            <p className="text-xs text-gray-500">{log.memo || 'メモなし'}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDeleteLog(log.id)} className="text-red-400 hover:text-red-600 p-1">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main>

            <footer className="text-center py-6 text-xs text-gray-400">
                © 2025 みんなの那須アプリ
            </footer>
        </div>
    );
}