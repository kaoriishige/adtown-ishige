import { NextPage, GetServerSideProps } from 'next';
import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { app } from '@/lib/firebase';
import nookies from 'nookies';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

const AdminLoginPage: NextPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

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

      if (data.role === 'admin') {
        router.push('/admin'); // 管理メニューのトップへ
      } else {
        throw new Error('管理者アカウントではありません。');
      }
    } catch (err: any) {
      setError(err.message || 'メールアドレスまたはパスワードが正しくありません。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head><title>管理者ログイン</title></Head>
      <div className="flex items-center justify-center min-h-screen bg-gray-800">
        <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-xl">
          <h1 className="text-3xl font-bold text-center text-gray-900">管理者ログイン</h1>
          <form onSubmit={handleLogin} className="space-y-6">
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <div>
              <label className="block mb-2 text-sm font-medium">メールアドレス</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 border rounded-md" required />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium">パスワード</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 border rounded-md" required />
            </div>
            <button type="submit" disabled={isLoading} className="w-full py-2 px-4 text-white bg-gray-700 rounded-md hover:bg-gray-800 disabled:bg-gray-500">
              {isLoading ? 'ログイン中...' : 'ログイン'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

// --- ログイン済みの管理者をダッシュボードへ自動で移動させる機能 ---
export const getServerSideProps: GetServerSideProps = async (context) => {
    try {
        const cookies = nookies.get(context);
        const token = await adminAuth.verifyIdToken(cookies.token, true);
　　　　 const userDoc = await adminDb.collection('users').doc(token.uid).get();
        
        if (userDoc.exists && userDoc.data()?.role === 'admin') {
            return { redirect: { destination: '/admin', permanent: false } };
        }
    } catch (err) {
        // 未ログインの場合はページを表示
        return { props: {} as never };
    }
    return { props: {} as never };
};


export default AdminLoginPage;