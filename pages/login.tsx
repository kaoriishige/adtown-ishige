import { useState } from 'react';
import { useRouter } from 'next/router';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../lib/firebase';
import Link from 'next/link';

const LoginPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    // ▼▼▼ デバッグ用の目印を追加 ▼▼▼
    console.log('1. ログイン処理を開始します。');
    console.log('入力されたメールアドレス:', email);

    try {
      console.log('2. Firebaseに認証情報を送信します...');
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      console.log('3. Firebase認証に成功しました。');
      
      // 認証情報をサーバーサイドのCookieに保存
      const token = await userCredential.user.getIdToken();
      console.log('4. Cookie保存APIを呼び出します...');
      await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      console.log('5. Cookie保存完了。マイページに移動します。');
      router.push('/mypage'); // Cookie保存後にマイページへ移動

    } catch (err: any) {
      console.log('6. 認証またはAPI呼び出しで失敗しました。エラー:', err); // エラー内容をコンソールに表示
      setError('メールアドレスまたはパスワードが間違っています。');
      console.error(err);

    } finally {
      console.log('7. ログイン処理を終了します。');
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    const email = prompt('パスワードをリセットしたいメールアドレスを入力してください。');
    if (email) {
      try {
        await sendPasswordResetEmail(auth, email);
        alert('パスワードリセット用のメールを送信しました。受信箱をご確認ください。');
      } catch (err) {
        alert('メールの送信に失敗しました。');
      }
    }
  };

  return (
    <div className="p-5 max-w-sm mx-auto my-10">
      <h1 className="text-3xl font-bold mb-6 text-center">ログイン</h1>
      <form onSubmit={handleLogin} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">メールアドレス</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3" required />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">パスワード</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3" required />
        </div>
        <div className="text-center">
          <button type="submit" disabled={isLoading} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400">
            {isLoading ? 'ログイン中...' : 'ログイン'}
          </button>
        </div>
        <div className="text-center mt-4">
          <a onClick={handlePasswordReset} className="text-xs text-blue-500 hover:underline cursor-pointer">
            パスワードをお忘れですか？
          </a>
        </div>
      </form>
      <p className="text-center text-sm">
        アカウントをお持ちでないですか？ <Link href="/signup" className="text-blue-500 hover:underline">新規登録</Link>
      </p>
    </div>
  );
};

export default LoginPage;
