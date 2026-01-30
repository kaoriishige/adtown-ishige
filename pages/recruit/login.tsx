import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { app } from '@/lib/firebase';

const RecruitLoginPage = () => {
  const router = useRouter();
  const auth = getAuth(app);

  // 認証状態管理
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    // 【重要】auth.currentUserを直接見ず、監視関数を使う
    const unsubscribe = onAuthStateChanged(auth, (user) => {
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

  // 認証状態がまだ確認中
  if (!authChecked) {
    return <div className="text-center py-40">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <button onClick={handleLogin} className="px-4 py-2 bg-blue-500 text-white rounded-md">
        テストログイン（情報を記憶）
      </button>
    </div>
  );
};

export default RecruitLoginPage;
