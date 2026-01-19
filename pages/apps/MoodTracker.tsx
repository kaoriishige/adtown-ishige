import React, { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { ArrowLeft, Loader2, Smile, Calendar, LogOut, CheckCircle, Trash2, Sun, Clock } from 'lucide-react';

interface MoodLog {
    id: string;
    date: string;
    mood: string;
    memo: string;
    createdAt?: any;
}

const getEnvVar = (name: string): any => {
    if (typeof window !== 'undefined' && (window as any)[name] !== undefined) {
        return (window as any)[name];
    }
    return undefined;
};

export default function MoodTrackerApp() {
    const [user, setUser] = useState<any>(null);
    const [logs, setLogs] = useState<MoodLog[]>([]);
    const [selectedMood, setSelectedMood] = useState('🙂');
    const [memo, setMemo] = useState('');
    const [currentDate, setCurrentDate] = useState(new Date().toISOString().substring(0, 10));
    const [loading, setLoading] = useState(true);
    const [isLocalMode, setIsLocalMode] = useState(false);

    const [db, setDb] = useState<any>(null);
    const [authService, setAuthService] = useState<any>(null);

    const MOOD_OPTIONS = ['🤩', '😄', '🙂', '😢', '😡'];
    const appId = getEnvVar('__app_id') || 'mood-tracker-app';

    useEffect(() => {
        const firebaseConfigRaw = getEnvVar('__firebase_config');
        if (!firebaseConfigRaw) {
            setIsLocalMode(true);
            const saved = localStorage.getItem(`${appId}_logs`);
            if (saved) setLogs(JSON.parse(saved));
            setLoading(false);
            return;
        }
        try {
            const firebaseConfig = JSON.parse(firebaseConfigRaw);
            const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
            const auth = getAuth(app);
            const firestoreDb = getFirestore(app);
            setDb(firestoreDb);
            setAuthService(auth);
            signInAnonymously(auth).catch(() => setIsLocalMode(true));
            onAuthStateChanged(auth, (currentUser) => {
                setUser(currentUser);
                setLoading(false);
            });
        } catch (e) {
            setIsLocalMode(true);
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isLocalMode || !user || !db) return;
        const logsRef = collection(db, 'artifacts', appId, 'users', user.uid, 'moodLogs');
        // 日付順、かつ作成順でソート
        const q = query(logsRef, orderBy('date', 'desc'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedLogs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MoodLog));
            setLogs(fetchedLogs);
        });
        return () => unsubscribe();
    }, [user, db, isLocalMode]);

    // ★ 修正：上書きチェックを外し、常に新規追加にする
    const handleAddLog = async () => {
        if (!selectedMood) return;

        const logId = Date.now().toString(); // ローカル用のユニークID
        const logData = {
            date: currentDate,
            mood: selectedMood,
            memo: memo.trim()
        };

        if (isLocalMode) {
            const newLogs = [{ ...logData, id: logId }, ...logs];
            setLogs(newLogs);
            localStorage.setItem(`${appId}_logs`, JSON.stringify(newLogs));
            setMemo('');
            // 登録後にフィードバック（任意）
        } else {
            setLoading(true);
            try {
                await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'moodLogs'), {
                    ...logData,
                    createdAt: serverTimestamp()
                });
                setMemo('');
            } catch (e) {
                alert("保存エラー");
            } finally {
                setLoading(false);
            }
        }
    };

    const handleDeleteLog = async (logId: string) => {
        if (!confirm('この記録を削除しますか？')) return;
        if (isLocalMode) {
            const newLogs = logs.filter(log => log.id !== logId);
            setLogs(newLogs);
            localStorage.setItem(`${appId}_logs`, JSON.stringify(newLogs));
        } else if (db && user) {
            try {
                await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'moodLogs', logId));
            } catch (e) {
                alert("削除に失敗しました");
            }
        }
    };

    // 分析（件数ベース）
    const moodAnalysis = useMemo(() => {
        if (logs.length === 0) return [];
        const totals: any = {};
        logs.forEach(l => totals[l.mood] = (totals[l.mood] || 0) + 1);
        return Object.entries(totals).map(([mood, count]: any) => ({
            mood,
            count,
            percentage: ((count / logs.length) * 100).toFixed(0) + '%'
        })).sort((a, b) => b.count - a.count);
    }, [logs]);

    return (
        <div className="min-h-screen bg-gray-50 text-gray-800 pb-10">
            <header className="bg-white p-4 border-b flex items-center justify-between sticky top-0 z-10">
                <button onClick={() => window.location.href = '/apps/categories'}><ArrowLeft /></button>
                <h1 className="font-bold flex items-center gap-2 text-gray-800"><Smile className="text-yellow-500" /> 気分ログ</h1>
                {authService && user ? <button onClick={() => signOut(authService)}><LogOut size={18} /></button> : <div className="w-5" />}
            </header>

            <main className="max-w-xl mx-auto p-4">
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-bold text-gray-400 flex items-center gap-2"><Sun size={16} /> 気分を記録</h2>
                        <input type="date" value={currentDate} onChange={(e) => setCurrentDate(e.target.value)} className="text-sm font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded" />
                    </div>

                    <div className="flex justify-around mb-6">
                        {MOOD_OPTIONS.map(m => (
                            <button key={m} onClick={() => setSelectedMood(m)} className={`text-4xl p-2 rounded-2xl transition-all ${selectedMood === m ? 'bg-yellow-100 scale-110 shadow-inner' : 'opacity-20 grayscale'}`}>{m}</button>
                        ))}
                    </div>

                    <textarea value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="今の気持ちや出来事をメモ..." className="w-full p-3 bg-gray-50 rounded-xl mb-4 text-sm focus:outline-none focus:ring-1 ring-yellow-400" rows={2} />

                    <button onClick={handleAddLog} disabled={loading} className="w-full py-4 bg-yellow-500 text-white font-bold rounded-xl shadow-lg shadow-yellow-100 hover:bg-yellow-600 flex items-center justify-center gap-2 transition-transform active:scale-95">
                        {loading ? <Loader2 className="animate-spin" /> : <CheckCircle />} 記録する
                    </button>
                </section>

                {moodAnalysis.length > 0 && (
                    <section className="mb-8 px-2">
                        <h2 className="text-xs font-bold text-gray-400 mb-3 flex items-center gap-2 uppercase tracking-widest"><Calendar size={14} /> 全体の傾向</h2>
                        <div className="flex flex-wrap gap-4">
                            {moodAnalysis.map(item => (
                                <div key={item.mood} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-gray-100 shadow-sm">
                                    <span className="text-lg">{item.mood}</span>
                                    <span className="text-xs font-bold text-gray-600">{item.count}回</span>
                                    <span className="text-[10px] text-gray-400">{item.percentage}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                <section>
                    <h2 className="text-xs font-bold text-gray-400 mb-3 flex items-center gap-2 uppercase tracking-widest"><Clock size={14} /> 履歴</h2>
                    <div className="space-y-3">
                        {logs.length === 0 && <p className="text-center text-gray-400 py-10 text-sm">記録がまだありません</p>}
                        {logs.map(log => (
                            <div key={log.id} className="bg-white p-4 rounded-xl border border-gray-100 flex justify-between items-center group animate-in slide-in-from-bottom-2">
                                <div className="flex items-center gap-4">
                                    <span className="text-3xl">{log.mood}</span>
                                    <div>
                                        <div className="text-[10px] font-bold text-indigo-400">{log.date}</div>
                                        <div className="text-sm text-gray-700 mt-0.5">{log.memo || <span className="text-gray-300 italic">メモなし</span>}</div>
                                    </div>
                                </div>
                                <button onClick={() => handleDeleteLog(log.id)} className="text-gray-200 hover:text-red-400 transition-colors p-2"><Trash2 size={18} /></button>
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}