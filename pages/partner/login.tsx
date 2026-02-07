import Head from 'next/head';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  getAuth,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged,
  signOut
} from 'firebase/auth';
import { app } from '@/lib/firebase';
import Link from 'next/link';

// --- 型定義 ---
type MessageContent = string | React.ReactNode;

// --- アイコン (削らずすべて記述) ---
const EyeIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"></path><circle cx="12" cy="12" r="3"></circle></svg>);
const EyeOffIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-10-7-10-7a1.89 1.89 0 0 1 0-.66M22 12s-3 7-10 7a9.75 9.75 0 0 1-4.24-1.16"></path><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9.9 9.9a3 3 0 1 0 4.2 4.2"></path></svg>);
const AlertTriangle = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>);

const LoginPage: React.FC = () => {
  const auth = getAuth(app);
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginType, setLoginType] = useState('adver');
  const [loading, setLoading] = useState(true);
  const [authUser, setAuthUser] = useState<any>(null);
  const [error, setError] = useState<MessageContent | null>(null);
  const [successMessage, setSuccessMessage] = useState<MessageContent | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isPasswordResetMode, setIsPasswordResetMode] = useState(false);

  // --- API連携 (フリーズ防止ガード版) ---
  const handleLoginSuccess = async (user: any) => {
    setLoading(true);
    setError(null);
    try {
      const idToken = await user.getIdToken(true);
      const response = await fetch('/api/auth/sessionLogin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({ loginType }),
      });

      const data = await response.json();

      // 何が起きてもローディングを止める
      setLoading(false);

      if (response.ok) {
        // 成功: ダッシュボードへ (replaceで履歴に残さない)
        window.location.replace(data.redirect);
      } else {
        // 失敗: エラーを出してsignOut(ループ回避)
        let errMsg = data.error || '認証に失敗しました。';
        if (data.error === 'user_data_missing') errMsg = 'ユーザー登録が見つかりません。';
        setError(errMsg);
        await signOut(auth);
        setAuthUser(null);
      }
    } catch (err) {
      setLoading(false);
      setError("通信エラーが発生しました。");
      await signOut(auth);
    }
  };

  // --- 認証監視 (依存配列を空にして暴走を止める) ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthUser(user);
      if (user) {
        await handleLoginSuccess(user);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (isPasswordResetMode) {
      setLoading(true);
      try {
        await sendPasswordResetEmail(auth, email);
        setSuccessMessage(`再設定メールを送信しました: ${email}`);
        setIsPasswordResetMode(false);
      } catch (err: any) {
        setError('メール送信に失敗しました。アドレスを確認してください。');
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    try {
      await setPersistence(auth, browserLocalPersistence);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setLoading(false);
      setError('メールアドレスまたはパスワードが正しくありません。');
    }
  };

  const handleEmailForget = (e: React.MouseEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(<div className="text-sm font-medium">メールアドレスをお忘れの場合：<br /><span className="font-bold text-indigo-700">adtown@able.ocn.ne.jp</span></div>);
  }

  // ローディング画面
  if (loading && !error && !successMessage) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
        <p className="text-gray-500 font-black tracking-widest uppercase">Checking Auth Status...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Head>
        <title>パートナーログイン - Adtown</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      <div className="flex-grow flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-black text-gray-900">パートナーログイン</h1>
            <p className="text-gray-400 text-xs mt-2 uppercase font-bold tracking-tighter">Partner Portal Management</p>
          </div>

          {/* 種別切り替え：ログインしていない時だけ表示 */}
          {!authUser && (
            <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
              {['adver', 'recruit'].map((type) => (
                <button key={type} onClick={() => setLoginType(type)} className={`flex-1 py-3 rounded-lg text-sm font-black transition-all ${loginType === type ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400'}`}>
                  {type === 'adver' ? '広告パートナー' : '求人パートナー'}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-bold flex items-center gap-2 animate-pulse">
                <AlertTriangle /> {error}
              </div>
            )}
            {successMessage && (
              <div className="p-4 bg-green-50 border-l-4 border-green-500 text-green-700 text-xs font-bold">
                {successMessage}
              </div>
            )}

            {!authUser ? (
              <>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Email Address</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="example@mail.com" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 transition-all font-bold text-gray-700" />
                </div>

                {!isPasswordResetMode && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Password</label>
                    <div className="relative">
                      <input type={passwordVisible ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 transition-all font-bold text-gray-700" />
                      <button type="button" onClick={() => setPasswordVisible(!passwordVisible)} className="absolute right-4 top-4 text-gray-300">
                        {passwordVisible ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex justify-between px-1">
                  <button type="button" onClick={handleEmailForget} className="text-xs font-black text-indigo-600 hover:underline">メール忘れ</button>
                  <button type="button" onClick={() => { setIsPasswordResetMode(!isPasswordResetMode); setError(null); }} className="text-xs font-black text-indigo-600 hover:underline">
                    {isPasswordResetMode ? "ログインに戻る" : "パスワードを忘れた"}
                  </button>
                </div>

                <button type="submit" disabled={loading} className="w-full py-5 bg-orange-500 text-white font-black rounded-xl shadow-lg active:scale-95 transition-all disabled:bg-gray-200 uppercase tracking-widest">
                  {loading ? "Loading..." : (isPasswordResetMode ? 'Send Reset Mail' : 'Login')}
                </button>
              </>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-indigo-50 rounded-xl text-center">
                  <p className="text-xs font-black text-indigo-700">ログイン済み: {authUser.email}</p>
                </div>
                <button type="button" onClick={() => handleLoginSuccess(authUser)} className="w-full py-5 bg-indigo-600 text-white font-black rounded-xl shadow-lg active:scale-95 transition-all">
                  ダッシュボードを開く
                </button>
                <button type="button" onClick={() => signOut(auth)} className="w-full py-3 text-xs font-black text-gray-400 hover:text-gray-600 transition-all">
                  別のアカウントでログイン
                </button>
              </div>
            )}
          </form>

          <div className="text-center pt-6 border-t border-gray-100">
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-4">New Registration</p>
            <div className="grid grid-cols-2 gap-4">
              <Link href="/partner/signup" className="text-xs py-4 border border-gray-100 rounded-xl font-black text-gray-500 hover:bg-gray-50 text-center transition-all shadow-sm">広告パートナー</Link>
              <Link href="/recruit" className="text-xs py-4 border border-gray-100 rounded-xl font-black text-gray-500 hover:bg-gray-50 text-center transition-all shadow-sm">求人パートナー</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
