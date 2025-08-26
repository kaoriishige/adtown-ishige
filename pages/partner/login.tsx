import { NextPage } from 'next';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { getAuth, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { app } from '@/lib/firebase';

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

  const handleLoginSuccess = (role: string) => {
    if (role === 'partner') {
      router.push('/partner/dashboard');
    } else {
      setError('このアカウントはパートナーではありません。一般ユーザーとしてログインしてください。');
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      const auth = getAuth(app);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();
      
      const response = await fetch('/api/auth/sessionLogin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'ログインに失敗しました。');
      
      handleLoginSuccess(data.role);
      
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

      const response = await fetch('/api/auth/sessionLogin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Googleログインに失敗しました。');
      
      handleLoginSuccess(data.role);

    } catch (err: any) {
      setError('Googleログインに失敗しました。');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10 flex flex-col justify-center items-center">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-lg">
        <h1 className="text-2xl font-bold text-center mb-6">パートナーログイン</h1>
        {message && <p className="text-green-600 text-sm text-center">{message}</p>}
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        
        <button 
          onClick={handleGoogleLogin} 
          disabled={isLoading} 
          className="w-full flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 mb-4"
        >
          {/* Google Icon SVG */}
          <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v8.51h12.8c-.57 2.82-2.31 5.2-4.78 6.81l7.98 6.19C45.27 39.2 48 32.44 48 24c0-.73-.07-1.44-.19-2.14l-.83-1.31z"></path><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.98-6.19c-2.11 1.45-4.82 2.3-7.91 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path><path fill="none" d="M0 0h48v48H0z"></path></svg>
          Googleでログイン
        </button>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="flex-shrink mx-4 text-gray-400 text-sm">または</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-gray-700 font-medium mb-2">メールアドレス</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 border rounded-lg" required />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2">パスワード</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 border rounded-lg" required />
          </div>
          <div className="text-right text-sm">
            <Link href="/partner/forgot-password" className="text-blue-600 hover:underline">
              パスワードをお忘れですか？
            </Link>
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