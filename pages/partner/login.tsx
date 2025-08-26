import { NextPage } from 'next';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { app } from '@/lib/firebase';
import axios from 'axios';

const PartnerLoginPage: NextPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (router.query.status === 'partner_signup_success') {
      setMessage('登録が完了しました。ログインしてください。');
    }
  }, [router.query.status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      const auth = getAuth(app);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();
      
      // ▼▼▼ 修正箇所：credentials: 'include' を追加 ▼▼▼
      const response = await fetch('/api/auth/sessionLogin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('セッションの作成に失敗しました。');
      }
      
      router.push('/partner/dashboard');
      
    } catch (err: any) {
      setError('メールアドレスまたはパスワードが正しくありません。');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10 flex flex-col justify-center items-center">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-lg">
        <h1 className="text-2xl font-bold text-center mb-6">パートナーログイン</h1>
        <form onSubmit={handleSubmit} className="space-y-5">
          {message && <p className="text-green-600 text-sm text-center">{message}</p>}
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <div>
            <label className="block text-gray-700 font-medium mb-2">メールアドレス</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 border rounded-lg" required />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2">パスワード</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 border rounded-lg" required />
          </div>
          <button type="submit" disabled={isLoading} className="w-full py-3 mt-4 text-white bg-blue-600 rounded-lg">
            {isLoading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>
        <p className="text-sm text-center mt-6">
          アカウントをお持ちでないですか？ <Link href="/partner/signup" className="text-blue-600 hover:underline">新規登録</Link>
        </p>
      </div>
    </div>
  );
};

export default PartnerLoginPage;