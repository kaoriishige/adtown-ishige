import Head from 'next/head';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  getAuth,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged
} from 'firebase/auth';
import { app } from '@/lib/firebase';
import Link from 'next/link';

// --- 型定義 ---
type MessageContent = string | React.ReactNode;

// --- SVGアイコン ---
const EyeIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"></path><circle cx="12" cy="12" r="3"></circle></svg>);
const EyeOffIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-10-7-10-7a1.89 1.89 0 0 1 0-.66M22 12s-3 7-10 7a9.75 9.75 0 0 1-4.24-1.16"></path><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9.9 9.9a3 3 0 1 0 4.2 4.2"></path></svg>);

const LoginPage: React.FC = () => {
  const router = useRouter();
  const auth = getAuth(app);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginType, setLoginType] = useState('adver');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<MessageContent | null>(null);
  const [successMessage, setSuccessMessage] = useState<MessageContent | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isPasswordResetMode, setIsPasswordResetMode] = useState(false);

  // 認証状態管理
  const [authUser, setAuthUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // 認証状態の確認
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, [auth]);

  // --- 修正：勝手に飛ばす監視（onAuthStateChanged）を削除 ---
  useEffect(() => {
    const queryError = router.query.error as string;
    if (queryError) {
      if (queryError === 'permission_denied') {
        setError('アクセス権限がありません。ログインタイプを確認してください。');
      } else if (queryError === 'user_data_missing') {
        setError('ユーザー登録が見つかりません。新規登録を行ってください。');
      }
    }
  }, [router.query.error]);

  const handleStartPasswordReset = (e: React.MouseEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage('パスワード再設定メールを送信するには、メールアドレスを入力してください。');
    setIsPasswordResetMode(true);
  };

  const handleSendPasswordReset = async () => {
    if (!email) {
      setError('メールアドレスを入力してください。');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage(`再設定メールを ${email} に送信しました。`);
      setIsPasswordResetMode(false);
    } catch (err: any) {
      let message = 'メール送信に失敗しました。';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-email') {
        message = 'このメールアドレスは登録されていません。';
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailForget = (e: React.MouseEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(
      <div className="text-sm font-medium">
        メールアドレスをお忘れの場合：
        <div className="mt-1 font-bold text-indigo-700">adtown@able.ocn.ne.jp</div>
      </div>
    );
    setIsPasswordResetMode(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPasswordResetMode) {
      handleSendPasswordReset();
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await setPersistence(auth, browserLocalPersistence);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();

      const response = await fetch('/api/auth/sessionLogin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({ loginType }),
      });

      const data = await response.json();

      if (!response.ok) {
        setLoading(false);
        if (data.error === 'user_data_missing') {
          setError('このメールアドレスは登録されていません。');
        } else if (data.error === 'permission_denied') {
          setError('選択したパートナー種別の権限がありません。');
        } else {
          setError(data.error || '認証に失敗しました。');
        }
        return;
      }

      // --- 【修正】APIが勝手に返してくる premium/dashboard を無視して正しい場所へ飛ばす ---
      const targetPath = loginType === 'adver' ? '/partner/dashboard' : '/recruit/dashboard';
      router.push(targetPath);

    } catch (err: any) {
      setLoading(false);
      let message = 'メールアドレスまたはパスワードが正しくありません。';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        message = 'ログイン情報が正しくないか、登録されていません。';
      } else if (err.code === 'auth/too-many-requests') {
        message = '試行回数が上限を超えました。しばらく時間をおいてください。';
      }
      setError(message);
    }
  };

  // 認証状態がまだ確認中
  if (!authChecked) {
    return <div className="text-center py-40">Loading...</div>;
  }

  // すでにログイン済みなら、ダッシュボードへリダイレクト
  if (authUser) {
    const targetPath = loginType === 'adver' ? '/partner/dashboard' : '/recruit/dashboard';
    router.replace(targetPath);
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Head><title>パートナーログイン</title></Head>
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 text-center">パートナーログイン</h1>

        <div className="flex justify-center space-x-6">
          {['adver', 'recruit'].map((type) => (
            <label key={type} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                checked={loginType === type}
                onChange={() => setLoginType(type)}
                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm font-medium text-gray-700">
                {type === 'adver' ? '広告パートナー' : '求人パートナー'}
              </span>
            </label>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm text-center animate-pulse">{error}</div>}
          {successMessage && <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-sm text-center">{successMessage}</div>}

          <div>
            <label className="block text-sm font-medium text-gray-700">メールアドレス</label>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              placeholder="example@mail.com"
              className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm"
            />
          </div>

          {!isPasswordResetMode && (
            <div>
              <label className="block text-sm font-medium text-gray-700">パスワード</label>
              <div className="relative mt-1">
                <input
                  type={passwordVisible ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required
                  className="block w-full p-3 border border-gray-300 rounded-md pr-10"
                />
                <button type="button" onClick={() => setPasswordVisible(!passwordVisible)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500">
                  {passwordVisible ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>
          )}

          <div className="text-sm flex justify-center space-x-4">
            <button type="button" onClick={handleEmailForget} className="text-indigo-600 hover:underline">メール忘れ</button>
            <button type="button" onClick={handleStartPasswordReset} className="text-indigo-600 hover:underline">パスワード忘れ</button>
          </div>

          <button type="submit" disabled={loading} className="w-full py-3 bg-orange-500 text-white font-bold rounded-md disabled:bg-gray-400">
            {loading ? "処理中..." : (isPasswordResetMode ? '再設定メールを送信' : 'ログイン')}
          </button>
        </form>

        <div className="text-center text-sm mt-4 pt-4 border-t border-gray-100">
          <p className="text-gray-600">アカウントをお持ちでないですか？</p>
          <div className="flex justify-center space-x-4 mt-2">
            <Link href="/partner/signup" className="text-blue-600 font-medium hover:underline">広告パートナー登録</Link>
            <Link href="/recruit" className="text-blue-600 font-medium hover:underline">求人パートナー登録</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;