import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { app } from '@/lib/firebase';

const RecruitLoginPage = () => {
  const router = useRouter();
  const auth = getAuth(app);

  // 認証状態管理
  const [authChecked, setAuthChecked] = useState(false);
  const [debugLog, setDebugLog] = useState<string[]>([]);

  const addDebugLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setDebugLog(prev => [`[${time}] ${msg}`, ...prev].slice(0, 50));
    console.log(`[RECRUIT LOGIN DEBUG] ${msg}`);
  };

  useEffect(() => {
    addDebugLog("Initializing Auth check...");
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      addDebugLog(`Auth confirmed: ${user?.uid || 'null'}`);
      setAuthChecked(true);
      if (user) {
        // ログイン状態が確認できたら自動でダッシュボードへ
        console.log("ログイン中ユーザーを検出しました");
        router.replace('/recruit/dashboard');
      }
    });
    return () => unsubscribe();
  }, [auth, router]);

  const handleLogin = async () => {
    try {
      // ログイン情報をブラウザに記憶させる設定
      await setPersistence(auth, browserLocalPersistence);

      // テストログイン
      await signInWithEmailAndPassword(auth, 'test@example.com', 'password');
      router.push('/recruit/dashboard');
    } catch (error) {
      console.error(error);
      alert('ログイン失敗');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-grow flex items-center justify-center">
        {!authChecked ? (
          <div className="text-center">Loading...</div>
        ) : (
          <button onClick={handleLogin} className="px-4 py-2 bg-blue-500 text-white rounded-md">
            テストログイン（情報を記憶）
          </button>
        )}
      </div>

      {/* デバッグログ表示 (本番での切り分け用) */}
      <div className="p-4 bg-gray-900 text-green-400 font-mono text-xs overflow-auto max-h-60 border-t-4 border-gray-700">
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

export default RecruitLoginPage;
