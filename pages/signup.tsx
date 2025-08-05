import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import Link from 'next/link';
import { doc, setDoc } from 'firebase/firestore';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

const SignupPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // 氏名とフリガナの入力値を管理するstate
  const [name, setName] = useState('');
  const [furigana, setFurigana] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [referrerId, setReferrerId] = useState<string | null>(null);

  useEffect(() => {
    const storedReferrerId = sessionStorage.getItem('referrerId');
    if (storedReferrerId) {
      setReferrerId(storedReferrerId);
    }
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Firestoreに保存するデータに氏名とフリガナを追加
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        name: name, // 氏名を追加
        furigana: furigana, // フリガナを追加
        subscriptionStatus: 'incomplete',
        createdAt: new Date(),
        referrerId: referrerId,
      });

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uid: user.uid }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '決済ページの作成に失敗しました。');
      }

      const { sessionId } = await response.json();

      const stripe = await stripePromise;
      if (stripe) {
        await stripe.redirectToCheckout({ sessionId });
      } else {
          throw new Error('Stripe.jsの読み込みに失敗しました。');
      }

    } catch (err: any) {
      let errorMessage = err.message || '登録に失敗しました。';
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'このメールアドレスは既に使用されています。';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'パスワードは6文字以上で入力してください。';
      }
      setError(errorMessage);
      setIsLoading(false);
      console.error(err);
    }
  };

  return (
    <div className="p-5 max-w-sm mx-auto my-10">
      <h1 className="text-3xl font-bold mb-6 text-center">新規登録</h1>
      <form onSubmit={handleSignup} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}
        
        {/* 氏名とフリガナの入力欄 */}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">氏名</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3" required />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">フリガナ</label>
          <input type="text" value={furigana} onChange={(e) => setFurigana(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3" required />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">メールアドレス</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3" required />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">パスワード</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3" required />
        </div>
        <div className="text-center">
          <button type="submit" disabled={isLoading} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400">
            {isLoading ? '処理中...' : '登録して支払いへ進む'}
          </button>
        </div>
      </form>
      
      <p className="text-center text-xs text-gray-500 mt-4">
        ※7日間の無料体験期間中にいつでも解約可能です。料金は一切かかりません。
      </p>

      <p className="text-center text-sm mt-4">
        すでにアカウントをお持ちですか？ <Link href="/login" className="text-blue-500 hover:underline">ログイン</Link>
      </p>
    </div>
  );
};

export default SignupPage;
