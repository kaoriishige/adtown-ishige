import { NextPage } from 'next';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { app } from '@/lib/firebase'; // 絶対パスを使用

const LoginPage: NextPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- ★★★ ここを修正 ★★★ ---
  // 関数名をフォームのonSubmitに合わせて'handleLogin'に修正しました
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const auth = getAuth(app);
      // 1. Firebaseにサインイン
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();
      
      // 2. IDトークンをサーバーに送り、セッションCookieを作成させる
      //    これはパートナーログインと全く同じAPIを呼び出します
      const response = await fetch('/api/auth/sessionLogin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        throw new Error('セッションの作成に失敗しました。');
      }
      
      // 3. 成功したら一般ユーザー用のマイページへ移動
      router.push('/mypage');
      
    } catch (err: any) {
      setError('メールアドレスまたはパスワードが正しくありません。');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-center">ログイン</h1>
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
          <button type="submit" disabled={isLoading} className="w-full py-2 px-4 text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:bg-gray-400">
            {isLoading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>
        <p className="text-sm text-center">
          アカウントをお持ちでないですか？ <Link href="/signup" className="text-blue-500 hover:underline">新規登録</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
