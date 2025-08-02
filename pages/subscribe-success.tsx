import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';

const SubscribeSuccessPage = () => {
  const router = useRouter();

  useEffect(() => {
    // ▼▼▼ ここからが修正箇所です ▼▼▼
    let redirected = false; // 二重にリダイレクトされるのを防ぐためのフラグ

    // 7秒後に強制的にリダイレクトするフォールバックタイマー
    const fallbackTimeout = setTimeout(() => {
      if (!redirected) {
        console.log('フォールバックタイマーによりリダイレクトします。');
        redirected = true;
        router.push('/mypage');
      }
    }, 7000); // 7秒

    // Firebaseのログイン状態を監視する
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // ユーザーがログイン状態になったことを確認できたら
      if (user && !redirected) {
        console.log('Firebaseの認証を検知してリダイレクトします。');
        redirected = true;
        clearTimeout(fallbackTimeout); // フォールバックタイマーを解除
        router.push('/mypage');
      }
    });

    // このページを離れるときに、監視とタイマーの両方を解除する
    return () => {
      unsubscribe();
      clearTimeout(fallbackTimeout);
    };
    // ▲▲▲ ここまで ▲▲▲
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center p-6">
        <h1 className="text-2xl font-bold mb-4">登録処理中...</h1>
        <p>決済が完了しました。マイページへ移動しますので、少々お待ちください。</p>
        {/* ローディングアニメーションなどをここに追加しても良い */}
        <div className="mt-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      </div>
    </div>
  );
};

export default SubscribeSuccessPage;