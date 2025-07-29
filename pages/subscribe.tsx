import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';

// ★重要：あなたのStripeのパブリッシャブルキーに置き換えてください
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const SubscribePage = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isSubscribing, setIsSubscribing] = useState(false);

  const handleSubscribe = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    setIsSubscribing(true);
    try {
      const token = await user.getIdToken();
      // サーバーサイドでStripe Checkoutセッションを作成するAPIを呼び出す
      const response = await axios.post(
        '/api/stripe-create-checkout-session',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { sessionId } = response.data;
      const stripe = await stripePromise;
      if (stripe) {
        await stripe.redirectToCheckout({ sessionId });
      }
    } catch (error) {
      console.error('Subscription failed:', error);
      setIsSubscribing(false);
    }
  };

  if (loading) {
    return <div>読み込み中...</div>;
  }

  return (
    <div className="container mx-auto p-4 text-center">
      <h1 className="text-3xl font-bold mb-4">サービスに登録</h1>
      <p className="mb-6">月額980円で全ての機能が使い放題。最初の7日間は無料です。</p>
      <button
        onClick={handleSubscribe}
        disabled={isSubscribing}
        className="bg-green-500 text-white px-6 py-3 rounded-lg font-bold text-xl hover:bg-green-600 disabled:bg-gray-400"
      >
        {isSubscribing ? '処理中...' : '7日間の無料体験を始める'}
      </button>
    </div>
  );
};

export default SubscribePage;


