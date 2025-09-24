// pages/login.tsx
import { NextPage } from 'next';
import { useState } from 'react';
import Link from 'next/link';
import {
  getAuth,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { app } from '@/lib/firebase';
import Head from 'next/head';
import { useRouter } from 'next/router';

const LoginPage: NextPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLoginSuccess = async (idToken: string) => {
    try {
      // 🔹 必ず /api/login を呼ぶ
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: idToken }),
        credentials: 'include', // ← これ必須
      });

      if (!response.ok) {
        throw new Error('セッション作成に失敗しました');
      }

      const { from } = router.query;
      router.replace((from as string) || '/home');
    } catch (err) {
      console.error('Login error:', err);
      setError('ログイン処理に失敗しました。');
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const auth = getAuth(app);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();
      await handleLoginSuccess(idToken);
    } catch {
      setError('メールアドレスまたはパスワードが正しくありません。');
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    const auth = getAuth(app);
    const provider = new GoogleAuthProvider();
    try {
      const userCredential = await signInWithPopup(auth, provider);
      const idToken = await userCredential.user.getIdToken();
      await handleLoginSuccess(idToken);
    } catch {
      setError('Googleログインに失敗しました。');
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>ログイン</title>
      </Head>
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
          <h1 className="text-3xl font-bold text-center">ログイン</h1>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button onClick={handleGoogleLogin} disabled={isLoading}>
            {isLoading ? 'ログイン中...' : 'Googleでログイン'}
          </button>
          <form onSubmit={handleEmailLogin} className="space-y-6">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="メールアドレス"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="パスワード"
            />
            <button type="submit" disabled={isLoading}>
              {isLoading ? 'ログイン中...' : 'ログイン'}
            </button>
          </form>
          <Link href="/signup">新規登録</Link>
        </div>
      </div>
    </>
  );
};

export default LoginPage;





