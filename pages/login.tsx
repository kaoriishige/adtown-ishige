import { NextPage } from 'next';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { getAuth, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { app } from '@/lib/firebase';

const LoginPage: NextPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLoginSuccess = async (idToken: string) => {
    const response = await fetch('/api/auth/sessionLogin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'ログインに失敗しました。');
    
    if (data.role === 'admin') router.push('/admin/dashboard');
    else if (data.role === 'partner') router.push('/partner/dashboard');
    else router.push('/mypage');
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
    } catch (err: any) {
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
    } catch (err: any) {
      setError('Googleログインに失敗しました。');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-center">ログイン</h1>
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        <button onClick={handleGoogleLogin} disabled={isLoading} className="w-full flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
          <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v8.51h12.8c-.57 2.82-2.31 5.2-4.78 6.81l7.98 6.19C45.27 39.2 48 32.44 48 24c0-.73-.07-1.44-.19-2.14l-.83-1.31z"></path><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.98-6.19c-2.11 1.45-4.82 2.3-7.91 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path><path fill="none" d="M0 0h48v48H0z"></path></svg>
          Googleでログイン
        </button>
        <div className="relative flex py-2 items-center"><div className="flex-grow border-t border-gray-300"></div><span className="flex-shrink mx-4 text-gray-400 text-sm">または</span><div className="flex-grow border-t border-gray-300"></div></div>
        <form onSubmit={handleEmailLogin} className="space-y-6">
          {/* ★★★ ここのタイプミスを修正しました ★★★ */}
          <div><label className="block mb-2 text-sm font-medium">メールアドレス</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 border rounded-md" required /></div>
          <div><label className="block mb-2 text-sm font-medium">パスワード</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 border rounded-md" required /></div>
          <button type="submit" disabled={isLoading} className="w-full py-2 px-4 text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:bg-gray-400">{isLoading ? 'ログイン中...' : 'ログイン'}</button>
        </form>
        <div className="text-sm text-center"><Link href="/forgot-password" legacyBehavior><a>パスワードをお忘れですか？</a></Link></div>
        <p className="text-sm text-center">アカウントをお持ちでないですか？ <Link href="/signup" legacyBehavior><a>新規登録</a></Link></p>
      </div>
    </div>
  );
};

// getServerSidePropsを削除しました

export default LoginPage;
