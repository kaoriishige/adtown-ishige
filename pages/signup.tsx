import { NextPage } from 'next';
import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { loadStripe } from '@stripe/stripe-js';

const SignUpPage: NextPage = () => {
  const [name, setName] = useState('');
  const [kana, setKana] = useState('');
  const [email, setEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (email !== confirmEmail) {
      setError('メールアドレスが一致しません。');
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await fetch('/api/user/create-doc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email,
          name: name,
          kana: kana,
        }),
      });

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.uid }),
      });

      const session = await response.json();
      if (session.error) {
        throw new Error(session.error.message || '決済セッションの作成に失敗しました。');
      }

      const stripe = await stripePromise;
      if (stripe) {
        await stripe.redirectToCheckout({ sessionId: session.sessionId });
      } else {
        throw new Error("Stripe.jsの読み込みに失敗しました。");
      }

    } catch (err: any) {
      console.error("サインアップ処理のエラー:", err);
      if (err.code === 'auth/email-already-in-use') {
        setError('このメールアドレスは既に使用されています。');
      } else if (err.code === 'auth/weak-password') {
        setError('パスワードは6文字以上で設定してください。');
      } else {
        setError(err.message || '登録に失敗しました。');
      }
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-center">新規登録</h1>
        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium">氏名</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border rounded-md" placeholder="山田 太郎" required />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium">フリガナ</label>
            <input type="text" value={kana} onChange={(e) => setKana(e.target.value)} className="w-full px-3 py-2 border rounded-md" placeholder="ヤマダ タロウ" required />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium">メールアドレス</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 border rounded-md" placeholder="email@example.com" required />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium">メールアドレス（確認用）</label>
            <input type="email" value={confirmEmail} onChange={(e) => setConfirmEmail(e.target.value)} className="w-full px-3 py-2 border rounded-md" placeholder="もう一度入力してください" required />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium">パスワード (6文字以上)</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 border rounded-md" required minLength={6} />
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button type="submit" disabled={loading} className="w-full py-2 px-4 text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:bg-gray-400">
            {loading ? '処理中...' : '登録して決済に進む'}
          </button>
        </form>
        <p className="text-sm text-center">
          すでにアカウントをお持ちですか？ <Link href="/login" className="text-blue-500 hover:underline">ログイン</Link>
        </p>
      </div>
    </div>
  );
};

export default SignUpPage;