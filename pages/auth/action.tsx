// pages/auth/action.tsx

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { applyActionCode, getAuth } from 'firebase/auth';
import { auth } from '../../lib/firebase'; // あなたのFirebaseクライアント設定

const AuthActionPage = () => {
  const router = useRouter();
  const { mode, oobCode } = router.query;

  useEffect(() => {
    const handleAuthAction = async () => {
      if (!mode || !oobCode) {
        // パラメータがない場合はエラー
        console.error('Missing mode or oobCode');
        router.push('/error'); // エラーページへリダイレクト
        return;
      }

      switch (mode) {
        case 'verifyEmail':
          try {
            await applyActionCode(auth, oobCode as string);
            alert('メールアドレスの確認が完了しました！');
            // 認証完了後、決済ページへリダイレクト
            router.push('/payment');
          } catch (error) {
            console.error('メール認証エラー:', error);
            alert('メール認証に失敗しました。リンクの有効期限が切れている可能性があります。');
            router.push('/login');
          }
          break;
        // 他のアクション（パスワードリセットなど）はここに追加
        default:
          console.error('Unsupported action mode:', mode);
          router.push('/error');
          break;
      }
    };
    
    if (router.isReady) {
      handleAuthAction();
    }
  }, [router, mode, oobCode]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 text-center bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold">処理中です...</h1>
        <p className="mt-4">メールアドレスの確認を行っています。</p>
      </div>
    </div>
  );
};

export default AuthActionPage;