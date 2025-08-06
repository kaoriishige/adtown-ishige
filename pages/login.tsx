import { NextPage } from 'next';
import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';

const LoginPage: NextPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 最新のユーザー情報を再読み込み
      await user.reload(); 

      // 最新の情報に更新された user オブジェクトで認証済みかチェック
      if (user.emailVerified) {
        // メール認証済みの場合、決済ページへリダイレクト
        router.push('/payment'); // ★ここを修正★
      } else {
        // メール認証がまだの場合
        await auth.signOut(); // ログインさせずにサインアウトさせる
        setError("メールアドレスの確認が完了していません。受信したメールをご確認ください。");
      }

    } catch (err: any) {
      console.error("ログインエラー:", err);
      setError("メールアドレスまたはパスワードが間違っています。");
      setLoading(false);
    }
    
    // ログイン処理が終わったら（成功・失敗問わず）ローディングを解除
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-center">ログイン</h1>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block mb-2 text-sm font-medium">メールアドレス</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium">パスワード</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:bg-gray-400"
          >
            {loading ? 'ログイン中...' : 'ログイン'}
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