import { NextPage } from 'next';
import { useState } from 'react';
import Link from 'next/link';
import { loadStripe } from '@stripe/stripe-js';

// Stripeの公開キーで初期化
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

const PartnerSignupPage: NextPage = () => {
  const [storeName, setStoreName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  // ★★★ 追加(1): 確認用メールアドレスの状態を追加 ★★★
  const [confirmEmail, setConfirmEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // ★★★ 追加(2): メールアドレスが一致するかどうかをチェック ★★★
    if (email !== confirmEmail) {
      setError('メールアドレスが一致しません。');
      setIsLoading(false);
      return;
    }

    try {
      localStorage.setItem('signupEmail', email);
      localStorage.setItem('signupPassword', password);

      const response = await fetch('/api/partner/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeName, contactPerson, email, password }),
      });

      const session = await response.json();

      if (response.ok) {
        const stripe = await stripePromise;
        if (stripe) {
          await stripe.redirectToCheckout({ sessionId: session.sessionId });
        }
      } else {
        localStorage.removeItem('signupEmail');
        localStorage.removeItem('signupPassword');
        setError(session.error || '不明なエラーが発生しました。');
      }
    } catch (err) {
      localStorage.removeItem('signupEmail');
      localStorage.removeItem('signupPassword');
      setError('予期せぬエラーが発生しました。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center text-gray-800">
          パートナー登録
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="storeName" className="block text-sm font-medium text-gray-700">店舗名・企業名</label>
            <input id="storeName" name="storeName" type="text" required value={storeName} onChange={(e) => setStoreName(e.target.value)} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm" />
          </div>
          <div>
            <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700">ご担当者名</label>
            <input id="contactPerson" name="contactPerson" type="text" required value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm" />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">メールアドレス</label>
            <input id="email" name="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm" />
          </div>
          
          {/* ★★★ 追加(3): 確認用メールアドレスの入力欄 ★★★ */}
          <div>
            <label htmlFor="confirmEmail" className="block text-sm font-medium text-gray-700">メールアドレス（確認用）</label>
            <input id="confirmEmail" name="confirmEmail" type="email" required value={confirmEmail} onChange={(e) => setConfirmEmail(e.target.value)} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm" placeholder="もう一度入力してください" />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">パスワード（6文字以上）</label>
            <input id="password" name="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm" />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          
          <div>
            <button type="submit" disabled={isLoading} className="w-full px-4 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400">
              {isLoading ? '処理中...' : '登録して決済に進む'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PartnerSignupPage;