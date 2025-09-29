// pages/recruit/login.tsx
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { app } from '@/lib/firebase';

const RecruitLoginPage = () => {
  const router = useRouter();
  const auth = getAuth(app);

  useEffect(() => {
    // 既にログインしていればダッシュボードに飛ばす
    if (auth.currentUser) {
      router.replace('/recruit/dashboard');
    }
  }, [auth, router]);

  const handleLogin = async () => {
    try {
      // 仮ログイン：メールとパスワード固定（テスト用）
      await signInWithEmailAndPassword(auth, 'test@example.com', 'password');
      router.push('/recruit/dashboard');
    } catch (error) {
      console.error(error);
      alert('ログイン失敗');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <button onClick={handleLogin} className="px-4 py-2 bg-blue-500 text-white rounded-md">
        テストログイン
      </button>
    </div>
  );
};

export default RecruitLoginPage;
