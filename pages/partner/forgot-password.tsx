import { NextPage } from 'next';
import { useState } from 'react';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { app } from '@/lib/firebase';
import Link from 'next/link';

const PartnerForgotPasswordPage: NextPage = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    setError(null);
    const auth = getAuth(app);

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('パスワード再設定用のメールを送信しました。メールをご確認ください。');
    } catch (err: any) {
      setError('メールの送信に失敗しました。登録済みのメールアドレスかご確認ください。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center">パスワードをリセット</h1>
        <p className="text-center text-gray-600">ご登録のメールアドレスを入力してください。再設定用のリンクを送信します。</p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block mb-2 text-sm font-medium">メールアドレス</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-3 py-2 border rounded-md" />
          </div>
          {message && <p className="text-green-600 text-sm">{message}</p>}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={isLoading} className="w-full py-2 px-4 text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:bg-gray-400">
            {isLoading ? '送信中...' : '再設定メールを送信'}
          </button>
        </form>
        <div className="text-center">
          <Link href="/partner/login" className="text-blue-500 hover:underline">
            ログインページに戻る
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PartnerForgotPasswordPage;
