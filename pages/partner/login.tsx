import Head from 'next/head';
import React, { useState, useEffect, useRef } from 'react'; // ← ★useRef追加
import { useRouter } from 'next/router';
import {
  getAuth,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged,
  signOut,
  User
} from 'firebase/auth';
import { app } from '@/lib/firebase';
import Link from 'next/link';

/* ===== アイコン類はあなたのコードそのまま（省略なし） ===== */
const EyeIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"></path><circle cx="12" cy="12" r="3"></circle></svg>);
const EyeOffIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-10-7-10-7a1.89 1.89 0 0 1 0-.66M22 12s-3 7-10 7a9.75 9.75 0 0 1-4.24-1.16"></path><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9.9 9.9a3 3 0 1 0 4.2 4.2"></path></svg>);
const AlertTriangle = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>);

type MessageContent = string | React.ReactNode;

const LoginPage: React.FC = () => {
  const auth = getAuth(app);
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginType, setLoginType] = useState<'adver' | 'recruit'>('adver');
  const [loading, setLoading] = useState(true);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [error, setError] = useState<MessageContent | null>(null);
  const [successMessage, setSuccessMessage] = useState<MessageContent | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isPasswordResetMode, setIsPasswordResetMode] = useState(false);

  // ★★★ 超重要：二重実行を防ぐフラグ（スマホ固まりの原因対策）★★★
  const didLoginRef = useRef(false);

  // ---------- fetch に「5秒タイムアウト」 ----------
  const fetchWithTimeout = async (url: string, options: RequestInit, timeoutMs = 5000) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  };

  // ---------- ログイン後処理 ----------
  const handleLoginSuccess = async (user: User) => {
    setLoading(true);
    setError(null);

    try {
      const idToken = await user.getIdToken(true);

      const response = await fetchWithTimeout('/api/auth/sessionLogin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ loginType }),
      }, 5000);

      let data: any = {};
      try { data = await response.json(); } catch { }

      setLoading(false);

      if (response.ok && data.redirect) {
        window.location.replace(data.redirect); // ← スマホ最安定
        return;
      }

      const msg = data.error || '認証に失敗しました。';
      setError(msg);
      await signOut(auth);
      setAuthUser(null);
      didLoginRef.current = false; // ← 失敗時はリセット

    } catch (err: any) {
      setLoading(false);

      if (err.name === 'AbortError') {
        setError('通信がタイムアウトしました。電波状況を確認してください。');
      } else {
        setError('通信エラーが発生しました。');
      }

      await signOut(auth);
      setAuthUser(null);
      didLoginRef.current = false; // ← リセット
    }
  };

  // ---------- 認証監視（★暴走しない版） ----------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);

      if (!user) {
        setLoading(false);
        didLoginRef.current = false; // ← ログアウト時はリセット
        return;
      }

      // ★★★ ここが“スマホ固まり”を止める本丸 ★★★
      if (didLoginRef.current) return;

      didLoginRef.current = true;   // ← 1回だけ許可
      handleLoginSuccess(user);
    });

    return () => unsubscribe();
  }, []);

  // ---------- ログイン送信 ----------
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
      } catch {
        setError('メール送信に失敗しました。');
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    try {
      await setPersistence(auth, browserLocalPersistence);
      await signInWithEmailAndPassword(auth, email, password);
      // → 続きは onAuthStateChanged が担当
    } catch {
      setLoading(false);
      setError('メールアドレスまたはパスワードが正しくありません。');
    }
  };

  const handleEmailForget = (e: React.MouseEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(
      <div className="text-sm font-medium">
        メールアドレスをお忘れの場合：<br />
        <span className="font-bold text-indigo-700">adtown@able.ocn.ne.jp</span>
      </div>
    );
  };

  // ---------- ローディング ----------
  if (loading && !error && !successMessage) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
        <p className="text-gray-500 font-black">ログイン状態を確認中...</p>
      </div>
    );
  }

  /* ===== 以下UI部分はあなたのコードをそのまま維持（変更なし） ===== */
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
          </div>

          {!authUser && (
            <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
              {(['adver', 'recruit'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setLoginType(type)}
                  className={`flex-1 py-3 rounded-lg text-sm font-black transition-all ${loginType === type
                    ? 'bg-white shadow-sm text-indigo-600'
                    : 'text-gray-400'
                    }`}
                >
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
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="example@mail.com"
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl"
                />

                {!isPasswordResetMode && (
                  <div className="relative">
                    <input
                      type={passwordVisible ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => setPasswordVisible(!passwordVisible)}
                      className="absolute right-4 top-4 text-gray-300"
                    >
                      {passwordVisible ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                )}

                <div className="flex justify-between px-1">
                  <button
                    type="button"
                    onClick={handleEmailForget}
                    className="text-xs font-black text-indigo-600 hover:underline"
                  >
                    メール忘れ
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsPasswordResetMode(!isPasswordResetMode);
                      setError(null);
                    }}
                    className="text-xs font-black text-indigo-600 hover:underline"
                  >
                    {isPasswordResetMode ? "ログインに戻る" : "パスワードを忘れた"}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-5 bg-orange-500 text-white font-black rounded-xl"
                >
                  {loading
                    ? "Loading..."
                    : isPasswordResetMode
                      ? "Send Reset Mail"
                      : "Login"}
                </button>
              </>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-indigo-50 rounded-xl text-center">
                  <p className="text-xs font-black text-indigo-700">
                    ログイン済み: {authUser.email}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleLoginSuccess(authUser)}
                  className="w-full py-5 bg-indigo-600 text-white font-black rounded-xl"
                >
                  ダッシュボードを開く
                </button>

                <button
                  type="button"
                  onClick={() => signOut(auth)}
                  className="w-full py-3 text-xs font-black text-gray-400"
                >
                  別のアカウントでログイン
                </button>
              </div>
            )}
          </form>

          <div className="text-center pt-6 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-4">
              <Link
                href="/partner/signup"
                className="text-xs py-4 border border-gray-100 rounded-xl font-black text-gray-500 text-center"
              >
                広告パートナー
              </Link>
              <Link
                href="/recruit"
                className="text-xs py-4 border border-gray-100 rounded-xl font-black text-gray-500 text-center"
              >
                求人パートナー
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LoginPage;


