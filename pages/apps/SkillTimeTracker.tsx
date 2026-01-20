import React, { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
// ★修正: Firestoreの必要なメソッドを追加
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, query, onSnapshot, serverTimestamp, addDoc, orderBy, deleteDoc } from 'firebase/firestore';
import { ArrowLeft, BookOpen, AlertTriangle, Loader2, Zap, CheckCircle, Clock, Trash2, User, Target, TrendingUp, BarChart, Plus, LogOut } from 'lucide-react';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signOut } from 'firebase/auth';

// --- 型定義 ---
interface StudyLog {
    id: string;
    date: string;
    minutesStudied: number;
    topic: string;
    createdAt: any;
}

interface UserConfig {
    targetMinutesPerDay: number; // minutes
    currentSkill: string;
}

// --- Firebase Config & Initialization Helper ---
const getEnvVar = (name: string): any => {
    if (typeof window !== 'undefined' && (window as any)[name] !== undefined) {
        return (window as any)[name];
    }
    return undefined;
};

export default function SkillTimeTrackerApp() {
    // --- Firebase State ---
    const [firebase, setFirebase] = useState<{ auth: ReturnType<typeof getAuth> | null, db: ReturnType<typeof getFirestore> | null, appId: string }>({ auth: null, db: null, appId: 'default-app-id' });
    const [globalError, setGlobalError] = useState<string | null>(null);

    // --- App State ---
    const [user, setUser] = useState<any>(null);
    const [logs, setLogs] = useState<StudyLog[]>([]);
    const [config, setConfig] = useState<UserConfig>({ targetMinutesPerDay: 60, currentSkill: 'Webライティング' });

    const [newMinutes, setNewMinutes] = useState('');
    const [currentDate, setCurrentDate] = useState(new Date().toISOString().substring(0, 10));

    const [loading, setLoading] = useState(true);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [isConfigOpen, setIsConfigOpen] = useState(false);


    // 1. Firebase初期化とAuthセットアップ
    useEffect(() => {
        const firebaseConfigRaw = getEnvVar('__firebase_config');
        const initialAuthToken = getEnvVar('__initial_auth_token') || null;
        const appId = getEnvVar('__app_id') || 'default-app-id';

        let firebaseConfig;
        if (firebaseConfigRaw) {
            try {
                firebaseConfig = JSON.parse(firebaseConfigRaw);
            } catch (e) {
                console.error("Failed to parse __firebase_config", e);
            }
        }

        // Fallback to environment variables if window config is missing or invalid
        if (!firebaseConfig || !firebaseConfig.apiKey) {
            firebaseConfig = {
                apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
                authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
                projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
                messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
                appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
            };
        }

        if (!firebaseConfig.apiKey) {
            setGlobalError("Firebase configuration not found.");
            setIsAuthReady(true);
            setLoading(false);
            return;
        }

        try {
            const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
            const auth = getAuth(app);
            const db = getFirestore(app);
            setFirebase({ auth, db, appId: getEnvVar('__app_id') || 'skill-tracker-app' });

            signInAnonymously(auth);
            onAuthStateChanged(auth, (currentUser) => {
                setUser(currentUser);
                setIsAuthReady(true);
            });
        } catch (e: any) {
            console.error("Firebase Initialization Error:", e);
            setGlobalError(`Initialization failed: ${e.message}`);
            setIsAuthReady(true);
            setLoading(false);
        }
    }, []);

    // 2. データ同期と設定ロード
    useEffect(() => {
        const { db, appId } = firebase;
        if (!user || !db) return;

        // ログデータの購読
        const logsRef = collection(db, 'artifacts', appId, 'users', user.uid, 'studyLogs');
        const logsQuery = query(logsRef, orderBy('date', 'desc'));

        const unsubscribeLogs = onSnapshot(logsQuery, (snapshot) => {
            const fetchedLogs: StudyLog[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...(doc.data() as Omit<StudyLog, 'id'>),
            } as StudyLog));

            setLogs(fetchedLogs);
            setLoading(false);
        });

        // 設定のロード
        const configRef = doc(db, 'artifacts', appId, 'users', user.uid, 'config', 'userSettings');
        getDoc(configRef).then(snap => {
            if (snap.exists()) {
                setConfig(snap.data() as UserConfig);
            }
        }).catch(err => console.error("Config load error:", err));

        return () => unsubscribeLogs();
    }, [user, firebase]);


    // --- Calculations ---

    const todayLog = logs.find(log => log.date === currentDate);
    const todayMinutes = todayLog ? todayLog.minutesStudied : 0;
    // targetPagesPerDay -> targetMinutesPerDay に変更
    const progress = useMemo(() => Math.min(100, (todayMinutes / config.targetMinutesPerDay) * 100), [todayMinutes, config.targetMinutesPerDay]);
    const isGoalMet = todayMinutes >= config.targetMinutesPerDay;

    const totalMinutes = logs.reduce((sum, log) => sum + log.minutesStudied, 0);
    const totalHours = Math.floor(totalMinutes / 60);


    // --- Actions ---

    const handleConfigSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const { db, appId } = firebase;
        // targetPagesPerDay -> targetMinutesPerDay に変更
        const target = parseInt(config.targetMinutesPerDay.toString());

        if (isNaN(target) || target <= 0 || !user || !db || !config.currentSkill.trim()) {
            setGlobalError("目標時間とスキル名を正しく入力してください。");
            return;
        }

        const configRef = doc(db, 'artifacts', appId, 'users', user.uid, 'config', 'userSettings');

        try {
            await setDoc(configRef, {
                targetMinutesPerDay: target,
                currentSkill: config.currentSkill.trim(),
            }, { merge: true });

            setConfig({ targetMinutesPerDay: target, currentSkill: config.currentSkill.trim() });
            setIsConfigOpen(false);
            setGlobalError(null);
        } catch (error) {
            console.error("Config save error:", error);
            setGlobalError("設定の保存に失敗しました。");
        }
    };

    const handleAddLog = async (e: React.FormEvent) => {
        e.preventDefault();
        const { db, appId } = firebase;
        const minutesNum = parseInt(newMinutes);

        if (isNaN(minutesNum) || minutesNum <= 0 || !user || !db) {
            setGlobalError("学習時間を正しく入力してください。");
            return;
        }

        setGlobalError(null);
        setLoading(true);

        const logData = {
            date: currentDate,
            minutesStudied: minutesNum,
            topic: config.currentSkill,
            createdAt: serverTimestamp(),
        };

        try {
            if (todayLog) {
                // 既存のログを更新 (上書き)
                const docRef = doc(db!, 'artifacts', appId, 'users', user.uid, 'studyLogs', todayLog.id);
                await updateDoc(docRef, { minutesStudied: minutesNum });
            } else {
                // 新規ログ
                await addDoc(collection(db!, 'artifacts', appId, 'users', user.uid, 'studyLogs'), logData);
            }
            // ★修正: setNewPages -> setNewMinutes に修正
            setNewMinutes('');
        } catch (error) {
            console.error("Log error:", error);
            setGlobalError("記録の追加に失敗しました。");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteLog = async (logId: string) => {
        const { db, appId } = firebase;
        if (!user || !db) return;
        if (!confirm('この日の記録を削除しますか？')) return;
        try {
            // ★修正: deleteDoc のインポート漏れを修正したため、そのまま実行
            await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'studyLogs', logId));
        } catch (error) {
            console.error("Delete error:", error);
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
        window.location.href = '/premium/dashboard';
    };


    return (
        <div className="min-h-screen bg-gray-50 font-sans pb-20">
            <Head><title>スキル学習時間トラッカー</title></Head>

            {/* ヘッダー */}
            <header className="bg-white shadow-sm sticky top-0 z-10 p-4 border-b border-gray-200">
                <div className="max-w-xl mx-auto flex items-center justify-between">
                    <button onClick={handleGoCategories} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft size={20} className="text-gray-600" />
                    </button>

                    <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <TrendingUp className="w-6 h-6 text-indigo-600" />
                        学習時間トラッカー
                    </h1>

                    {user && firebase.auth ? (
                        <button onClick={() => signOut(firebase.auth!)} className="text-sm text-gray-500 hover:text-red-500">
                            <LogOut size={20} />
                        </button>
                    ) : (
                        <div className="w-5 h-5"></div>
                    )}
                </div>
            </header>

            <main className="max-w-xl mx-auto p-4 sm:p-6">

                {/* 進行状況と目標 */}
                <section className="mb-8 bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                    <div className="flex justify-between items-start mb-4">
                        <h2 className="text-lg font-bold text-gray-700">目標: {config.currentSkill}</h2>
                        <button onClick={() => setIsConfigOpen(true)} className="text-sm text-indigo-600 font-medium flex items-center gap-1 hover:text-indigo-800">
                            <Target size={18} /> 設定変更
                        </button>
                    </div>

                    <div className="text-center mb-4">
                        <p className="text-sm text-gray-500">今日の学習</p>
                        <p className="text-4xl font-extrabold text-indigo-600 mt-1">
                            {todayMinutes} <span className="text-xl font-semibold">分</span>
                        </p>
                        <p className="text-sm text-gray-600">目標まであと {Math.max(0, config.targetMinutesPerDay - todayMinutes)} 分</p>
                    </div>

                    {/* プログレスバー */}
                    <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                            className={`h-3 rounded-full transition-all duration-500 ${isGoalMet ? 'bg-green-500' : 'bg-indigo-500'}`}
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>

                    <p className={`mt-2 text-sm font-bold ${isGoalMet ? 'text-green-600' : 'text-gray-600'} text-right`}>
                        {isGoalMet ? '目標達成！' : `${progress.toFixed(0)}% 完了`} (目標: {config.targetMinutesPerDay}分)
                    </p>

                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-sm text-gray-600">総学習時間: <span className="font-bold text-indigo-600">{totalHours} 時間</span></p>
                    </div>
                </section>

                {/* 記録フォーム */}
                <section className="mb-8 bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                    <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
                        <Clock size={20} /> 今日の学習時間を記録
                    </h2>
                    <form onSubmit={handleAddLog} className="space-y-3">
                        <input
                            type="date"
                            value={currentDate}
                            onChange={(e) => setCurrentDate(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg text-gray-600"
                        />
                        <input
                            type="number"
                            value={newMinutes}
                            onChange={(e) => setNewMinutes(e.target.value)}
                            placeholder={`学習時間 (分) - ${todayMinutes}分を上書き`}
                            min="1"
                            required
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 text-lg font-bold"
                        />
                        <button
                            type="submit"
                            disabled={loading || !newMinutes.trim()}
                            className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus size={20} />}
                            学習時間を記録 (上書き)
                        </button>
                    </form>
                </section>

                {/* 記録履歴 */}
                <section>
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <BarChart size={20} /> 記録履歴
                    </h2>

                    {logs.length === 0 ? (
                        <div className="p-8 text-center bg-white rounded-xl border border-dashed border-gray-300">
                            <p className="text-gray-500">まだ記録がありません。</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {logs.map(log => (
                                <div
                                    key={log.id}
                                    className={`p-4 bg-white rounded-xl shadow-sm border ${log.date === todayLog?.date ? 'border-indigo-400' : 'border-gray-200'} flex justify-between items-center`}
                                >
                                    <div className="flex flex-col flex-1 min-w-0">
                                        <p className="text-xs text-gray-500 mb-1">{log.date} ({log.topic})</p>
                                        <p className="font-bold text-xl text-gray-800">
                                            {log.minutesStudied} <span className="text-sm font-normal">分</span>
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteLog(log.id)}
                                        title="記録を削除"
                                        className="p-2 rounded-full bg-gray-100 text-gray-500 hover:bg-red-500 hover:text-white transition"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

            </main>

            {/* 設定モーダル */}
            {isConfigOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
                    <form onSubmit={handleConfigSave} className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6 space-y-4">
                        <h2 className="text-xl font-bold text-gray-800 border-b pb-2">学習目標設定</h2>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">現在のスキル名 (例: Webライティング)</label>
                            <input
                                value={config.currentSkill}
                                onChange={(e) => setConfig(prev => ({ ...prev, currentSkill: e.target.value }))}
                                required
                                className="w-full p-3 border rounded-lg"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">目標学習時間 (分/日)</label>
                            <input
                                type="number"
                                value={config.targetMinutesPerDay}
                                onChange={(e) => setConfig(prev => ({ ...prev, targetMinutesPerDay: parseInt(e.target.value) || 0 }))}
                                min="1"
                                required
                                className="w-full p-3 border rounded-lg"
                            />
                        </div>

                        <div className="flex justify-between pt-2">
                            <button
                                type="button"
                                onClick={() => setIsConfigOpen(false)}
                                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                            >
                                キャンセル
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                            >
                                保存して適用
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <footer className="text-center py-6 text-xs text-gray-400">
                © 2025 みんなの那須アプリ
            </footer>
        </div>
    );
}