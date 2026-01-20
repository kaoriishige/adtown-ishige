import React, { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
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
  orderBy,
  serverTimestamp,
  deleteDoc,
  doc,
  updateDoc
} from 'firebase/firestore';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { Plus, AlertTriangle, LogOut, Heart, Loader2, ArrowLeft, X, Gift, Bed, Droplet, Clock, Trash2, BookOpen, Calendar, CheckCircle } from 'lucide-react';


// --- 型定義 ---
interface LogItem {
  id: string;
  type: 'feed' | 'diaper' | 'sleep';
  detail: string; // 例: 'left', 'right', 'wet', 'dirty', 'start', 'end'
  timestamp: any; // Firestore Timestamp または Date オブジェクト
  note?: string;
  duration?: number; // 睡眠時間 (分)
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


export default function BabyLogApp() {
  // --- Firebase State ---
  const [firebase, setFirebase] = useState<{ auth: ReturnType<typeof getAuth> | null, db: ReturnType<typeof getFirestore> | null, appId: string }>({ auth: null, db: null, appId: 'default-app-id' });
  const [globalError, setGlobalError] = useState<string | null>(null);

  // --- App State ---
  const [user, setUser] = useState<any>(null);
  const [logItems, setLogItems] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [sleepStartTime, setSleepStartTime] = useState<number | null>(null); // 睡眠開始時刻 (Unix ms)

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
      setFirebase({ auth, db, appId });

      const initAuth = async () => {
        try {
          if (initialAuthToken) { await signInWithCustomToken(auth, initialAuthToken as string); }
          else { await signInAnonymously(auth); }
        } catch (err) { console.error("Auth error:", err); setGlobalError("認証に失敗しました。"); }
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
    if (!isAuthReady || !user || !db || globalError) {
      setLogItems([]);
      return;
    }

    setLoading(true);
    // Path: /artifacts/{appId}/users/{userId}/babyLog
    const logRef = collection(db, 'artifacts', appId, 'users', user.uid, 'babyLog');
    const q = query(logRef, orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedLogs: LogItem[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<LogItem, 'id'>),
      } as LogItem));

      setLogItems(fetchedLogs);
      setLoading(false);

      // 最新の記録から睡眠開始時刻を探す (睡眠終了ボタン表示用)
      const activeSleep = fetchedLogs.find(log => log.type === 'sleep' && log.detail === 'start' && !log.duration);
      if (activeSleep) {
        // toMillis()が利用できない可能性があるため、Dateオブジェクトも許容
        setSleepStartTime(activeSleep.timestamp ? (activeSleep.timestamp.toMillis ? activeSleep.timestamp.toMillis() : new Date(activeSleep.timestamp).getTime()) : null);
      } else {
        setSleepStartTime(null);
      }

    }, (err: any) => {
      console.error("Data sync error:", err);
      setGlobalError("データ読み込みに失敗しました。ルールを確認してください。");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAuthReady, user, globalError, firebase]);

  // --- Actions ---

  const handleLogAction = async (type: LogItem['type'], detail: LogItem['detail']) => {
    const { db, appId } = firebase;
    if (!user || !db) return;

    if (type === 'sleep' && detail === 'end' && sleepStartTime) {
      // 睡眠終了時
      const duration = Math.round((Date.now() - sleepStartTime) / 60000); // 単位: 分

      // 既存の睡眠開始ログを更新してdurationを追加
      const startLog = logItems.find(log => log.type === 'sleep' && log.detail === 'start' && !log.duration);
      if (startLog) {
        const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'babyLog', startLog.id);
        await updateDoc(docRef, { duration: duration });
      }

      setSleepStartTime(null); // タイマーリセット

    } else if (type === 'sleep' && detail === 'start' && sleepStartTime) {
      // 既に開始している場合は何もしない
      return;
    } else {
      // 通常の記録 (授乳、オムツ、睡眠開始)
      const newLog: Omit<LogItem, 'id'> = {
        type: type,
        detail: detail,
        timestamp: serverTimestamp(),
      };

      try {
        await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'babyLog'), newLog);
        if (type === 'sleep' && detail === 'start') {
          setSleepStartTime(Date.now()); // タイマー開始
        }
      } catch (err) {
        console.error("Add log error:", err);
        setGlobalError("記録の追加に失敗しました。");
      }
    }
  };

  const handleDeleteLog = async (logId: string) => {
    const { db, appId } = firebase;
    if (!user || !db) return;
    if (!confirm('この記録を削除しますか？')) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'babyLog', logId));
    } catch (err) {
      console.error("Delete log error:", err);
    }
  };

  // --- Render Helpers ---

  const formatTime = (timestamp: any) => {
    if (!timestamp || !timestamp.toDate) return '—';
    const date = timestamp.toDate();
    return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp || !timestamp.toDate) return '—';
    const date = timestamp.toDate();
    return date.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric', weekday: 'short' });
  };

  // 過去24時間の活動サマリー
  const summary = useMemo(() => {
    const now = Date.now();
    const last24h = now - 24 * 60 * 60 * 1000;

    const relevantLogs = logItems.filter(log => {
      if (!log.timestamp) return false;
      const time = log.timestamp.toMillis ? log.timestamp.toMillis() : new Date(log.timestamp).getTime();
      return time > last24h;
    });

    const feeds = relevantLogs.filter(log => log.type === 'feed').length;
    const wet = relevantLogs.filter(log => log.type === 'diaper' && log.detail === 'wet').length;
    const dirty = relevantLogs.filter(log => log.type === 'diaper' && log.detail === 'dirty').length;

    // 睡眠時間合計 (分)
    const sleepDuration = relevantLogs
      .filter(log => log.type === 'sleep' && log.duration)
      .reduce((sum, log) => sum + (log.duration || 0), 0);

    const lastFeed = relevantLogs.filter(log => log.type === 'feed').shift();

    return { feeds, wet, dirty, sleepDuration, lastFeedTime: lastFeed ? formatTime(lastFeed.timestamp) : '—' };

  }, [logItems]);

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
    <div className="min-h-screen bg-gray-50 font-sans">
      <Head><title>育児記録ワンタッチログ</title></Head>

      {/* ヘッダー */}
      <header className="bg-white shadow-sm sticky top-0 z-10 p-4 border-b border-gray-200">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <button onClick={handleGoCategories} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>

          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Gift size={24} className="text-pink-500" />
            育児記録ログ
          </h1>

          <div className="flex gap-2">
            <button
              onClick={() => setIsGuideOpen(true)}
              className="text-sm text-blue-600 hover:text-blue-800 border border-blue-600 hover:border-blue-800 rounded-full px-3 py-1 transition-colors flex items-center gap-1"
            >
              <BookOpen size={16} />使い方
            </button>
            {user && firebase.auth ? (
              <button onClick={() => signOut(firebase.auth!)} className="text-sm text-gray-500 hover:text-red-500">
                <LogOut size={20} />
              </button>
            ) : (
              <div className="w-5 h-5"></div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto p-4 sm:p-6">

        {/* ワンタッチ記録ボタン */}
        <section className="mb-6 bg-white p-4 rounded-xl shadow-lg border border-gray-200">
          <h2 className="text-lg font-bold text-gray-700 mb-3">👶 記録する (ワンタッチ)</h2>

          {/* 授乳ボタン */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              onClick={() => handleLogAction('feed', 'left')}
              className="py-3 bg-pink-100 text-pink-700 font-bold rounded-lg shadow-sm hover:bg-pink-200 transition"
            >
              左の授乳🍼
            </button>
            <button
              onClick={() => handleLogAction('feed', 'right')}
              className="py-3 bg-pink-100 text-pink-700 font-bold rounded-lg shadow-sm hover:bg-pink-200 transition"
            >
              右の授乳🍼
            </button>
          </div>

          {/* オムツボタン */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              onClick={() => handleLogAction('diaper', 'wet')}
              className="py-3 bg-blue-100 text-blue-700 font-bold rounded-lg shadow-sm hover:bg-blue-200 transition"
            >
              おしっこ 💧
            </button>
            <button
              onClick={() => handleLogAction('diaper', 'dirty')}
              className="py-3 bg-yellow-100 text-yellow-700 font-bold rounded-lg shadow-sm hover:bg-yellow-200 transition"
            >
              うんち 💩
            </button>
          </div>

          {/* 睡眠ボタン */}
          <div className="grid grid-cols-2 gap-3">
            {sleepStartTime ? (
              <button
                onClick={() => handleLogAction('sleep', 'end')}
                className="py-3 bg-red-500 text-white font-bold rounded-lg shadow-md hover:bg-red-600 transition col-span-2 flex items-center justify-center gap-2"
              >
                <Bed size={20} /> 睡眠終了！ (記録中)
              </button>
            ) : (
              <button
                onClick={() => handleLogAction('sleep', 'start')}
                className="py-3 bg-green-600 text-white font-bold rounded-lg shadow-md hover:bg-green-700 transition col-span-2 flex items-center justify-center gap-2"
              >
                <Bed size={20} /> 睡眠開始
              </button>
            )}
          </div>
        </section>

        {/* 24時間サマリー */}
        <section className="mb-8 p-4 bg-white rounded-xl shadow-lg border border-gray-200">
          <h2 className="text-lg font-bold text-gray-700 mb-3">⏰ 過去24時間のサマリー</h2>
          <div className="grid grid-cols-4 text-center gap-2">
            <div className="bg-gray-100 p-2 rounded-lg">
              <p className="text-xl font-bold text-pink-600">{summary.feeds}</p>
              <p className="text-xs text-gray-600">授乳回数</p>
            </div>
            <div className="bg-gray-100 p-2 rounded-lg">
              <p className="text-xl font-bold text-blue-600">{summary.wet}</p>
              <p className="text-xs text-gray-600">おしっこ</p>
            </div>
            <div className="bg-gray-100 p-2 rounded-lg">
              <p className="text-xl font-bold text-yellow-600">{summary.dirty}</p>
              <p className="text-xs text-gray-600">うんち</p>
            </div>
            <div className="bg-gray-100 p-2 rounded-lg">
              <p className="text-sm font-bold text-green-600">{Math.floor(summary.sleepDuration / 60)}h {summary.sleepDuration % 60}m</p>
              <p className="text-xs text-gray-600">睡眠合計</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-right">最終授乳: {summary.lastFeedTime}</p>
        </section>

        {/* タイムライン */}
        <section>
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Clock size={20} /> タイムライン ({logItems.length}件)
          </h2>

          {loading && logItems.length === 0 ? (
            <div className="text-center py-10"><Loader2 className="w-8 h-8 text-gray-300 animate-spin mx-auto" /></div>
          ) : logItems.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-dashed border-gray-300">
              <p className="text-gray-500">まだ記録がありません。ワンタッチで記録を始めましょう。</p>
            </div>
          ) : (
            <div className="space-y-4">
              {logItems.map(log => {
                const time = formatTime(log.timestamp);
                const date = formatDate(log.timestamp);

                let icon, text, color;

                switch (log.type) {
                  case 'feed':
                    icon = <Heart size={18} />;
                    text = `授乳: ${log.detail === 'left' ? '左' : '右'}`;
                    color = 'text-pink-600 bg-pink-50';
                    break;
                  case 'diaper':
                    icon = <Droplet size={18} />;
                    text = `オムツ: ${log.detail === 'wet' ? 'おしっこ' : 'うんち'}`;
                    color = log.detail === 'wet' ? 'text-blue-600 bg-blue-50' : 'text-yellow-600 bg-yellow-50';
                    break;
                  case 'sleep':
                    icon = <Bed size={18} />;
                    text = log.detail === 'start'
                      ? '睡眠開始'
                      : `睡眠終了 (${log.duration}分)`;
                    color = 'text-indigo-600 bg-indigo-50';
                    break;
                  default:
                    icon = <Clock size={18} />;
                    text = '記録';
                    color = 'text-gray-600 bg-gray-50';
                }

                return (
                  <div
                    key={log.id}
                    className={`p-4 bg-white rounded-xl shadow-sm border border-gray-200 flex justify-between items-center transition-shadow hover:shadow-md`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className={`p-2 rounded-full flex-shrink-0 ${color}`}>
                        {icon}
                      </span>
                      <div className="flex flex-col min-w-0">
                        <p className={`font-bold text-sm ${color}`}>{text}</p>
                        <p className="text-xs text-gray-500">
                          {date} {time}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteLog(log.id)}
                      title="記録を削除"
                      className="p-2 rounded-full bg-gray-100 text-gray-400 hover:bg-red-500 hover:text-white transition"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* 使い方ガイドセクション */}
      {isGuideOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">使い方ガイド</h2>
              <button onClick={() => setIsGuideOpen(false)} className="text-gray-500 hover:text-gray-800">
                <X size={24} />
              </button>
            </div>
            <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto text-sm">
              <h3 className="font-bold text-lg text-pink-600">目的：育児記録の効率化</h3>
              <p className="text-gray-700">
                ワンタッチで授乳、オムツ、睡眠の時刻を記録し、親御さんの負担を減らします。
              </p>

              <div className="border-t pt-3">
                <h4 className="font-bold text-base mb-2">1. 記録方法</h4>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>**授乳**: 「左の授乳」「右の授乳」ボタンを押すと、その時刻が記録されます。</li>
                  <li>**オムツ**: 「おしっこ」「うんち」ボタンを押すと、自動で時刻と種類が記録されます。</li>
                  <li>**睡眠**: 「睡眠開始」ボタンを押し、起きたら必ず「睡眠終了」ボタンを押してください。睡眠時間を自動で計算します。</li>
                </ul>
              </div>

              <div className="border-t pt-3">
                <h4 className="font-bold text-base mb-2">2. データ管理</h4>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>記録はすべてデータベースに保存され、アプリを閉じても消えません。</li>
                  <li>記録の右端の**ゴミ箱アイコン**で、いつでも個別に削除できます。</li>
                </ul>
              </div>
            </div>
            <div className="p-4 border-t text-center">
              <button onClick={() => setIsGuideOpen(false)} className="bg-pink-600 hover:bg-pink-700 text-white font-bold py-2 px-6 rounded-lg shadow-md">
                記録を始める
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}