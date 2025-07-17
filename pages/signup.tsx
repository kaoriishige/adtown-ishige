import { useState, useEffect } from 'react'; // useEffect をインポート
import { useRouter } from 'next/router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import Link from 'next/link';
import { doc, setDoc } from 'firebase/firestore';
import { loadStripe } from '@stripe/stripe-js';

// Stripe.jsを初期化
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

const SignupPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [referrerId, setReferrerId] = useState<string | null>(null); // 紹介者IDを保存するstate

  // ▼▼ ここから追加 ▼▼
  // ページが読み込まれた時に、URLから紹介者IDを取得する
  useEffect(() => {
    if (router.isReady) {
      const { ref } = router.query;
      if (typeof ref === 'string') {
        setReferrerId(ref);
      }
    }
  }, [router.isReady, router.query]);
  // ▲▲ ここまで追加 ▲▲

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // 1. Firebaseにユーザーを登録
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Firestoreにユーザー情報を保存
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        email: user.email,
        subscriptionStatus: 'incomplete',
        createdAt: new Date(),
        // ▼▼ 紹介者IDを保存するフィールドを追加 ▼▼
        referrerId: referrerId, // URLにrefパラメータがあればそのID、なければnullが保存される
      });

      // 3. 作成したAPIを呼び出し、Stripeの決済ページを生成
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        // ▼▼ ユーザーIDをAPIに渡す処理を追加 ▼▼
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uid: user.uid }), // ユーザー自身のIDを渡す
      });
      // ▲▲ ここまで修正 ▲▲
      
      const { sessionId } = await response.json();

      // 4. Stripeの決済ページにリダイレクト
      const stripe = await stripePromise;
      if (stripe) {
        stripe.redirectToCheckout({ sessionId });
      }

    } catch (err: any) {
      let errorMessage = '登録に失敗しました。';
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
      <p className="text-center text-sm">
        すでにアカウントをお持ちですか？ <Link href="/login" className="text-blue-500 hover:underline">ログイン</Link>
      </p>
    </div>
  );
};

export default SignupPage;

