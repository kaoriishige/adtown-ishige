// pages/subscribe.tsx
import { useState } from 'react';
import { useRouter } from 'next/router';
import { loadStripe } from '@stripe/stripe-js';
import Head from 'next/head';
import { getAuth } from 'firebase/auth';

const stripePromise = loadStripe(process.env.STRIPE_PUBLISHABLE_KEY!);

const SubscribePage = () => {
  const router = useRouter();
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async () => {
    setIsSubscribing(true);
    setError(null);

    try {
      const auth = getAuth();
      const idToken = await auth.currentUser?.getIdToken(true);

      if (!idToken) {
        setIsSubscribing(false);
        router.push('/login?from=/subscribe');
        return;
      }

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (response.status === 401) {
        setIsSubscribing(false);
        router.push('/login?from=/subscribe');
        return;
      }

      const data = await response.json();

      if (!data.url) {
        throw new Error('Stripe セッションURLが返されませんでした');
      }

      const stripe = await stripePromise;
      window.location.href = data.url;
    } catch (err) {
      console.error('Subscription failed:', err);
      setError('決済処理を開始できませんでした。時間をおいて再度お試しください。');
      setIsSubscribing(false);
    }
  };

  // 🔽 ここから下の return 文が変更箇所です 🔽
  return (
    <>
      <Head>
        <title>{"有料プランにアップグレード"}</title>
      </Head>
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-full max-w-sm p-8 space-y-6 bg-white rounded-2xl shadow-lg text-center">
          
          {/* ヘッダー */}
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              有料プランにアップグレード
            </h1>
            <p className="mt-2 text-sm text-gray-500">全ての機能が利用可能になります。</p>
          </div>

          {/* 価格表示 */}
          <div className="py-4">
            <span className="text-5xl font-extrabold text-gray-900">¥480</span>
            <span className="ml-1 text-xl font-medium text-gray-500">/ 月</span>
          </div>

          {/* エラーメッセージ表示 */}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          
          {/* アップグレードボタン */}
          <button
            onClick={handleSubscribe}
            disabled={isSubscribing}
            className="w-full px-6 py-3 text-lg font-semibold text-white bg-green-500 rounded-lg shadow-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 ease-in-out"
          >
            {isSubscribing ? '処理中...' : 'アップグレードする'}
          </button>
            
        </div>
      </div>
    </>
  );
  // 🔼 ここまでが変更箇所です 🔼
};

export default SubscribePage;



