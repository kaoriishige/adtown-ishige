import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import Link from 'next/link';
import Head from 'next/head';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const SubscribePage = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    setIsSubscribing(true);
    setError(null);
    try {
      const token = await user.getIdToken();
      // サーバーサイドでStripe Checkoutセッションを作成するAPIを呼び出す
      const response = await axios.post(
        '/api/stripe-create-checkout-session',
        {}, // bodyは空でOK
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { sessionId } = response.data;
      const stripe = await stripePromise;
      if (stripe && sessionId) {
        await stripe.redirectToCheckout({ sessionId });
      } else {
        throw new Error('Stripeのセッション開始に失敗しました。');
      }
    } catch (err) {
      console.error('Subscription failed:', err);
      setError('決済処理を開始できませんでした。時間をおいて再度お試しください。');
      setIsSubscribing(false);
    }
  };

  if (loading) {
    return (
        <div className="flex justify-center items-center min-h-screen">
            <div>読み込み中...</div>
        </div>
    );
  }

  return (
    <>
        <Head>
            <title>有料プランにアップグレード</title>
        </Head>
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 text-center">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">有料プランにアップグレード</h1>
                <p className="text-gray-600 mb-6">
                    チラシ比較、限定クーポン、フードロス情報など、全ての節約機能が利用可能になります。
                </p>
                <div className="my-8 p-6 bg-blue-50 rounded-lg">
                    <p className="text-xl font-semibold text-gray-700">月額</p>
                    <p className="text-5xl font-black text-blue-600">480<span className="text-2xl font-bold">円</span></p>
                </div>
                
                {error && <p className="text-red-500 mb-4">{error}</p>}

                <button
                    onClick={handleSubscribe}
                    disabled={isSubscribing}
                    className="w-full bg-green-500 text-white px-6 py-4 rounded-lg font-bold text-xl hover:bg-green-600 disabled:bg-gray-400 transition transform hover:scale-105"
                >
                    {isSubscribing ? '処理中...' : '月額480円でアップグレードする'}
                </button>
                <div className="mt-6">
                    <Link href="/home" className="text-sm text-gray-500 hover:text-blue-600">
                        今はしない
                    </Link>
                </div>
            </div>
        </div>
    </>
  );
};

export default SubscribePage;


