import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { getAuth, signInWithCustomToken } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { NextPage } from 'next';

const SubscribeSuccessPage: NextPage = () => {
  const router = useRouter();
  const { session_id } = router.query;

  useEffect(() => {
    const handleLogin = async () => {
      if (!session_id) {
        console.error("No session ID found.");
        return;
      }
      
      try {
        // バックエンドAPIにセッションIDを送り、Firebaseカスタムトークンを取得
        const response = await fetch('/api/auth/get-custom-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: session_id }),
        });

        if (!response.ok) {
          throw new Error('Failed to get custom token.');
        }

        const { customToken } = await response.json();
        const auth = getAuth(app);
        
        // カスタムトークンでFirebaseにログイン
        await signInWithCustomToken(auth, customToken);
        
        // ログイン成功！パートナーダッシュボードにリダイレクト
        router.push('/partner/dashboard');

      } catch (error) {
        console.error("Login failed after subscription:", error);
        // エラー発生時はログインページへリダイレクト
        router.push('/partner/login?error=auth_failed');
      }
    };

    if (session_id) {
      handleLogin();
    }

  }, [session_id, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center p-8">
        <h1 className="text-3xl font-bold text-orange-600 animate-pulse">
          お申し込み処理中...
        </h1>
        <p className="mt-4 text-gray-700">
          自動的に管理ページに移動します。しばらくお待ちください。
        </p>
      </div>
    </div>
  );
};

export default SubscribeSuccessPage;