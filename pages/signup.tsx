import { NextPage } from 'next';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { createUserWithEmailAndPassword } from 'firebase/auth'; // signIn... は不要
import { auth } from '@/lib/firebase';
import Head from 'next/head';

const SignupPage: NextPage = () => {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [referrerId, setReferrerId] = useState<string | null>(null);

  useEffect(() => {
    const refId = sessionStorage.getItem('referrerId');
    if (refId) {
      setReferrerId(refId);
    }
  }, []);

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('パスワードが一致しません。');
      return;
    }
    if (password.length < 6) {
      setError('パスワードは6文字以上で入力してください。');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Firebase Authでユーザー作成（この時点でクライアントはログイン状態になる）
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. バックエンドAPIを呼び出し、Firestoreにユーザーデータを作成
      const createFreeUserResponse = await fetch('/api/auth/create-free-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          uid: user.uid,
          referrerId: referrerId,
        }),
      });

      if (!createFreeUserResponse.ok) {
        throw new Error('ユーザー情報の作成に失敗しました。');
      }

      // 3. セッションクッキーを作成するためのAPIを呼び出す
      const idToken = await user.getIdToken(); // userオブジェクトから直接取得
      const sessionResponse = await fetch('/api/auth/sessionLogin', {
          method: 'POST',
          headers: { Authorization: `Bearer ${idToken}` },
      });

      // 4. セッション作成が成功したことを確認してから、ページを移動
      if (sessionResponse.ok) {
        router.replace('/home'); // SPA遷移で/homeを正しく表示
      } else {
        throw new Error('セッションの作成に失敗しました。');
      }

    } catch (err: any) {
      let message = '登録中にエラーが発生しました。';
      if (err.code === 'auth/email-already-in-use') {
        message = 'このメールアドレスは既に使用されています。';
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>新規登録 - みんなの那須アプリ</title>
      </Head>
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
          <h1 className="text-3xl font-bold text-center">地域お守り無料プランに登録</h1>
          <p className="text-center text-gray-600">メールアドレスとパスワードだけで始められます。</p>
          
          {error && <p className="text-red-500 text-sm text-center bg-red-100 p-3 rounded-md">{error}</p>}

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block mb-1 text-sm font-medium">メールアドレス</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="w-full px-3 py-2 border rounded-md" 
                required 
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">パスワード (6文字以上)</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="w-full px-3 py-2 border rounded-md" 
                required 
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">パスワード (確認用)</label>
              <input 
                type="password" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                className="w-full px-3 py-2 border rounded-md" 
                required 
              />
            </div>
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-3 px-4 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400 font-bold"
            >
              {isLoading ? '処理中...' : '同意して無料で登録する'}
            </button>
          </form>

          <p className="text-sm text-center">
            すでにアカウントをお持ちですか？ <Link href="/login" className="text-blue-600 hover:underline">ログイン</Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default SignupPage;