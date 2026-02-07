import Head from 'next/head';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged
} from 'firebase/auth';
import Link from 'next/link';

// --- Firebase設定 (環境変数から取得) ---
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

// --- SVGアイコン (省略なし) ---
const EyeIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"></path><circle cx="12" cy="12" r="3"></circle></svg>);
const EyeOffIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-10-7-10-7a1.89 1.89 0 0 1 0-.66M22 12s-3 7-10 7a9.75 9.75 0 0 1-4.24-1.16"></path><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9.9 9.9a3 3 0 1 0 4.2 4.2"></path></svg>);

const LoginPage: React.FC = () => {
  const router = useRouter();

  // 状態管理
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginType, setLoginType] = useState('adver');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | React.ReactNode | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | React.ReactNode | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isPasswordResetMode, setIsPasswordResetMode] = useState(false);

  // --- ログイン成功後のセッション作成処理 ---
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
        // エラー詳細を日本語化
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
      setError("サーバーとの通信に失敗しました。");
    }
  };

  // --- 認証状態の監視 (タイムアウト付き) ---
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) setLoading(false);
    }, 6000); // 6秒応答がなければ強制的にフォーム表示

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      clearTimeout(timeout);
      if (user) {
        await handleLoginSuccess(user);
      } else {
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, [loginType]);

  // --- 送信処理 (ログイン & パスワードリセット) ---
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
        if (err.code === 'auth/user-not-found') msg = 'このアドレスは登録されていません。';
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
      // signIn後は onAuthStateChanged が検知し handleLoginSuccess が動く
    } catch (err: any) {
      setLoading(false);
      let msg = 'メールアドレスまたはパスワードが正しくありません。';
      if (err.code === 'auth/too-many-requests') msg = '試行回数が上限を超えました。しばらくお待ちください。';
      setError(msg);
    }
  };

  // メールアドレス忘れ案内
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

  // ローディング表示
  if (loading && !error && !successMessage) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
        <p className="text-gray-500 font-bold">ログイン状態を確認中...</p>
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
            <p className="text-gray-400 text-sm mt-2">管理画面へ移動します</p>
          </div>

          {/* 種別切り替え */}
          {!authUser && (
            <div className="flex justify-center space-x-4 bg-gray-50 p-2 rounded-xl border border-gray-100">
              {['adver', 'recruit'].map((type) => (
                <label key={type} className={`flex-1 text-center py-2 rounded-lg cursor-pointer transition-all ${loginType === type ? 'bg-white shadow-sm text-indigo-600 font-black' : 'text-gray-400'}`}>
                  <input type="radio" checked={loginType === type} onChange={() => setLoginType(type)} className="hidden" />
                  {type === 'adver' ? '広告' : '求人'}
                </label>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-bold animate-pulse">{error}</div>}
            {successMessage && <div className="p-4 bg-green-50 border-l-4 border-green-500 text-green-700 text-sm">{successMessage}</div>}

            <div className="space-y-1">
              <label className="text-xs font-black text-gray-500 uppercase ml-1">メールアドレス</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="example@mail.com" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 transition-all font-medium" />
            </div>

            {!isPasswordResetMode && (
              <div className="space-y-1">
                <label className="text-xs font-black text-gray-500 uppercase ml-1">パスワード</label>
                <div className="relative">
                  <input type={passwordVisible ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 transition-all font-medium" />
                  <button type="button" onClick={() => setPasswordVisible(!passwordVisible)} className="absolute right-4 top-4 text-gray-300">
                    {passwordVisible ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-between px-1">
              <button type="button" onClick={handleEmailForget} className="text-xs font-bold text-indigo-600 hover:underline">メール忘れ</button>
              <button type="button" onClick={() => { setIsPasswordResetMode(!isPasswordResetMode); setError(null); }} className="text-xs font-bold text-indigo-600 hover:underline">
                {isPasswordResetMode ? "ログインへ戻る" : "パスワード忘れ"}
              </button>
            </div>

            <button type="submit" disabled={loading} className="w-full py-4 bg-orange-500 text-white font-black rounded-xl shadow-lg active:scale-95 transition-all disabled:bg-gray-200">
              {loading ? "読み込み中..." : (isPasswordResetMode ? '再設定メールを送信' : 'ログイン')}
            </button>
          </form>

          <div className="text-center pt-4 border-t border-gray-100 space-y-3">
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest text-center">New Account?</p>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/partner/signup" className="text-xs py-3 border border-gray-100 rounded-xl font-black text-gray-500 hover:bg-gray-50 text-center transition-all">広告登録</Link>
              <Link href="/recruit" className="text-xs py-3 border border-gray-100 rounded-xl font-black text-gray-500 hover:bg-gray-50 text-center transition-all">求人登録</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 修正： useAuth への依存を消したので authUser の有無でUIを制御するための回避策
const authUser = auth.currentUser;

export default LoginPage;
