// pages/subscribe-success.tsx

import { useEffect } from 'react';
import { useRouter } from 'next/router';
// Firebaseの認証関連のインポートは不要になるので削除します
// import { onAuthStateChanged } from 'firebase/auth';
// import { auth } from '../lib/firebase';

const SubscribeSuccessPage = () => {
  const router = useRouter();

  useEffect(() => {
    // 5秒後にログインページへリダイレクトするタイマーを設定
    const timer = setTimeout(() => {
      router.push('/login'); // リダイレクト先を '/login' に変更
    }, 5000); // 5秒

    // このページを離れるときにタイマーを解除する
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">ありがとうございます！</h1>
        <p className="mb-6">決済とユーザー登録が完了しました。</p>
        
        {/* ローディングアニメーション */}
        <div className="my-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        </div>

        <p>ログインページへ移動します。少々お待ちください...</p>
      </div>
    </div>
  );
};

export default SubscribeSuccessPage;