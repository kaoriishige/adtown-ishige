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

// --- アイコン ---
const EyeIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"></path><circle cx="12" cy="12" r="3"></circle></svg>);
const EyeOffIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-10-7-10-7a1.89 1.89 0 0 1 0-.66M22 12s-3 7-10 7a9.75 9.75 0 0 1-4.24-1.16"></path><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9.9 9.9a3 3 0 1 0 4.2 4.2"></path></svg>);

const LoginPage: React.FC = () => {
  const router = useRouter();
  const auth = getAuth(app);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginType, setLoginType] = useState('adver');
  const [loading, setLoading] = useState(true); // 初期状態はチェック中
  const [error, setError] = useState<MessageContent | null>(null);
  const [successMessage, setSuccessMessage] = useState<MessageContent | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isPasswordResetMode, setIsPasswordResetMode] = useState(false);

  // --- 1. ログイン成功後のセッション作成と遷移 ---
  const handleLoginSuccess = async (user: any) => {
    try {
      const idToken = await user.getIdToken(true);
      const response = await fetch('/api/auth/sessionLogin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({ loginType }),
      });

      const data = await response.json();

      if (response.ok) {
        // スマホ対策： window.location.replace で強制遷移（履歴を残さずフリーズ回避）
        const targetPath = loginType === 'adver' ? '/partner/dashboard' : '/recruit/dashboard';
        window.location.replace(targetPath);
      } else {
        setLoading(false);
        // 日本語エラーメッセージの出し分け
        if (data.error === 'user_data_missing') {
          setError('このメールアドレスは登録されていません。');
        } else if (data.error === 'permission_denied') {
          setError('選択したパートナー種別の権限がありません。');
        } else {
          setError(data.error || '認証に失敗しました。');
        }
      }
    } catch (err) {
      setLoading(false);
      setError("サーバーとの通信に失敗しました。再度お試しください。");
    }
  };

  // --- 2. 認証状態の監視（他で動いているコードと同じ直通ロジック） ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await handleLoginSuccess(user);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [loginType]);

  // --- 3. ログイン・パスワード再設定送信処理 ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (isPasswordResetMode) {
      if (!email) {
        setError('メールアドレスを入力してください。');
        return;
      }
      setLoading(true);
      try {
        await sendPasswordResetEmail(auth, email);
        setSuccessMessage(`再設定メールを ${email} に送信しました。`);
        setIsPasswordResetMode(false);
      } catch (err: any) {
        let msg = 'メール送信に失敗しました。';
        if (err.code === 'auth/user-not-found') msg = 'このメールアドレスは登録されていません。';
        setError(msg);
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    try {
      await setPersistence(auth, browserLocalPersistence);
      await signInWithEmailAndPassword(auth, email, password);
      // signIn 成功後は onAuthStateChanged が検知して handleLoginSuccess が自動で走る
    } catch (err: any) {
      setLoading(false);
      let msg = 'メールアドレスまたはパスワードが正しくありません。';
      if (err.code === 'auth/too-many-requests') msg = '試行回数が上限を超えました。しばらく時間をおいてください。';
      setError(msg);
    }
  };

  // --- 4. メールアドレス忘れ対応 ---
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
  };

  // 読み込み中画面
  if (loading && !error && !successMessage) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
        <p className="text-gray-500 font-bold">ログイン状態を確認中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Head><title>パートナーログイン - Adtown</title></Head>

      <div className="flex-grow flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <h1 className="text-3xl font-bold text-gray-900 text-center">パートナーログイン</h1>

          {/* パートナー種別選択 */}
          <div className="flex justify-center space-x-4 bg-gray-50 p-2 rounded-xl">
            {['adver', 'recruit'].map((type) => (
              <label key={type} className={`flex-1 text-center py-2 rounded-lg cursor-pointer transition-all ${loginType === type ? 'bg-white shadow text-indigo-600 font-black' : 'text-gray-400'}`}>
                <input type="radio" checked={loginType === type} onChange={() => setLoginType(type)} className="hidden" />
                {type === 'adver' ? '広告パートナー' : '求人パートナー'}
              </label>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm animate-pulse">{error}</div>}
            {successMessage && <div className="p-4 bg-green-50 border-l-4 border-green-500 text-green-700 text-sm">{successMessage}</div>}

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">メールアドレス</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="example@mail.com" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 transition-all" />
            </div>

            {!isPasswordResetMode && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">パスワード</label>
                <div className="relative">
                  <input type={passwordVisible ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500" />
                  <button type="button" onClick={() => setPasswordVisible(!passwordVisible)} className="absolute right-3 top-3 text-gray-300">
                    {passwordVisible ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-between text-xs font-bold text-indigo-600">
              <button type="button" onClick={handleEmailForget} className="hover:underline">メールを忘れた</button>
              <button type="button" onClick={() => { setIsPasswordResetMode(!isPasswordResetMode); setError(null); }} className="hover:underline">
                {isPasswordResetMode ? "ログインに戻る" : "パスワードを忘れた"}
              </button>
            </div>

            <button type="submit" disabled={loading} className="w-full py-4 bg-orange-500 text-white font-black rounded-xl shadow-lg active:scale-95 transition-all disabled:bg-gray-300">
              {loading ? "処理中..." : (isPasswordResetMode ? '再設定メールを送信' : 'ログイン')}
            </button>
          </form>

          <div className="text-center pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-4 font-bold">アカウントをお持ちでない方</p>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/partner/signup" className="text-xs py-3 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 text-center">広告パートナー登録</Link>
              <Link href="/recruit" className="text-xs py-3 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 text-center">求人パートナー登録</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
