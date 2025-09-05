import { NextPage } from 'next';
import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase'; // firebaseのパスは環境に合わせてください

// Stripe.jsをロード
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// フォームの本体コンポーネント
const SignupForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();

  // フォームの状態管理
  const [step, setStep] = useState(1); // 1: ユーザー情報入力, 2: 支払い情報入力
  const [name, setName] = useState('');
  const [furigana, setFurigana] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ステップ1から2へ進む処理
  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError('パスワードが一致しません。');
      return;
    }
    if (password.length < 6) {
      setError('パスワードは6文字以上で入力してください。');
      return;
    }
    setStep(2);
  };

  // 最終的な登録処理
  const handleFinalSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setIsLoading(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
        setError("カード情報コンポーネントが見つかりません。");
        setIsLoading(false);
        return;
    }

    try {
      // 1. StripeでPaymentMethodを作成
      const { error: paymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: name,
          email: email,
        },
      });
      if (paymentMethodError) throw paymentMethodError;

      // 2. Firebaseでユーザーアカウントを作成
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // 3. トライアル開始APIを呼び出し
      const res = await fetch('/api/create-trial-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, 
          furigana, 
          email: user.email, 
          uid: user.uid,
          paymentMethodId: paymentMethod.id // 作成したPaymentMethodのIDを渡す
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'サブスクリプションの作成に失敗しました。');
      }
      
      alert('登録が完了しました！ログインページへ移動します。');
      router.push('/login');

    } catch (err: any) {
      let message = '登録中にエラーが発生しました。';
      if (err.code === 'auth/email-already-in-use') {
        message = 'このメールアドレスは既に使用されています。';
      } else if (err.message) {
        message = err.message;
      }
      setError(message);
      setStep(1);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-center">新規登録</h1>
        <p className="text-center text-gray-600">7日間の無料トライアルを開始します。</p>
        {error && <p className="text-red-500 text-sm text-center bg-red-100 p-3 rounded-md">{error}</p>}

        {step === 1 && (
          <form onSubmit={handleNextStep} className="space-y-4">
            <div><label className="block mb-1 text-sm font-medium">氏名</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border rounded-md" required /></div>
            <div><label className="block mb-1 text-sm font-medium">フリガナ</label><input type="text" value={furigana} onChange={(e) => setFurigana(e.target.value)} className="w-full px-3 py-2 border rounded-md" required /></div>
            <div><label className="block mb-1 text-sm font-medium">メールアドレス</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 border rounded-md" required /></div>
            <div><label className="block mb-1 text-sm font-medium">パスワード (6文字以上)</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 border rounded-md" required /></div>
            <div><label className="block mb-1 text-sm font-medium">パスワード (確認用)</label><input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-3 py-2 border rounded-md" required /></div>
            <button type="submit" className="w-full py-2 px-4 text-white bg-blue-500 rounded-md hover:bg-blue-600">支払い情報の入力へ</button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleFinalSubmit} className="space-y-4">
            <div className="p-4 border rounded-md bg-gray-50 text-sm">
                <p><strong>氏名:</strong> {name}</p>
                <p><strong>メールアドレス:</strong> {email}</p>
                <button type="button" onClick={() => { setStep(1); setError(null); }} className="text-blue-600 hover:underline text-xs mt-1">修正する</button>
            </div>
            <div>
                <label className="block mb-1 text-sm font-medium">カード情報</label>
                <div className="p-3 border rounded-md">
                    <CardElement options={{ 
                        style: { base: { fontSize: '16px' }},
                        hidePostalCode: true 
                    }} />
                </div>
            </div>
            <button type="submit" disabled={!stripe || isLoading} className="w-full py-2 px-4 text-white bg-green-500 rounded-md hover:bg-green-600 disabled:bg-gray-400">
              {isLoading ? '処理中...' : '7日間無料で登録する'}
            </button>
          </form>
        )}

        <p className="text-sm text-center">すでにアカウントをお持ちですか？ <Link href="/login" className="text-blue-600 hover:underline">ログイン</Link></p>
      </div>
    </div>
  );
};

// ページ全体をStripe Elementsでラップ
const SignupPage: NextPage = () => {
  return (
    <Elements stripe={stripePromise}>
      <SignupForm />
    </Elements>
  );
};

export default SignupPage;