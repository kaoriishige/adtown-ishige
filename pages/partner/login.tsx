import Head from 'next/head';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  getAuth,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { app } from '@/lib/firebase';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

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

  const { user: authUser, loading: authLoading } = useAuth();

  // 遷移処理を共通化（スマホのCookie保存待ちを入れる）
  const handleFinalRedirect = (path: string) => {
    setLoading(true);
    // スマホのSafari等でCookie/Sessionが安定するまで1秒待機
    setTimeout(() => {
      window.location.assign(path);
    }, 1000);
  };

  useEffect(() => {
    if (!authLoading && authUser) {
      const targetPath = loginType === 'adver' ? '/partner/dashboard' : '/recruit/dashboard';

      setSuccessMessage(
        <div className="flex flex-col items-center">
          <p className="font-bold text-green-600 mb-4 text-base">ログイン済みです</p>
          <button
            onClick={(e) => {
              e.preventDefault();
              handleFinalRedirect(targetPath);
            }}
            className="w-full py-4 bg-indigo-600 text-white rounded-lg font-bold shadow-lg animate-pulse"
          >
            {loading ? "移動中..." : "ダッシュボードを開く"}
          </button>
        </div>
      );
    }
  }, [authLoading, authUser, loginType, loading]);

  useEffect(() => {
    const queryError = router.query.error as string;
    if (queryError) {
      if (queryError === 'permission_denied') {
        setError('アクセス権限がありません。');
      } else if (queryError === 'user_data_missing') {
        setError('ユーザー登録が見つかりません。');
      }
    }
  }, [router.query.error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPasswordResetMode) {
      setLoading(true);
      try {
        await sendPasswordResetEmail(auth, email);
        setSuccessMessage(`再設定メールを送信しました。`);
        setIsPasswordResetMode(false);
      } catch (err: any) {
        setError('メール送信に失敗しました。');
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // 永続性を明示的にセット
      await setPersistence(auth, browserLocalPersistence);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();

      const response = await fetch('/api/auth/sessionLogin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({ loginType }),
      });

      if (!response.ok) {
        const data = await response.json();
        setLoading(false);
        setError(data.error || '認証に失敗しました。');
        return;
      }

      // 成功時：自動で飛ばさず、ボタンを表示してユーザーに踏ませる（スマホのポップアップブロック対策）
      const targetPath = loginType === 'adver' ? '/partner/dashboard' : '/recruit/dashboard';
      setLoading(false);
      setSuccessMessage(
        <div className="flex flex-col items-center">
          <p className="font-bold text-green-600 mb-4 text-lg text-center">認証に成功しました！<br />下のボタンを押してください</p>
          <button
            type="button"
            onClick={() => handleFinalRedirect(targetPath)}
            className="w-full py-4 bg-indigo-700 text-white rounded-xl font-bold shadow-2xl"
          >
            ダッシュボードへ入る
          </button>
        </div>
      );

    } catch (err: any) {
      setLoading(false);
      setError('ログイン情報が正しくないか、登録されていません。');
    }
  };

  const handleStartPasswordReset = (e: React.MouseEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage('メールアドレスを入力してください。');
    setIsPasswordResetMode(true);
  };

  const handleEmailForget = (e: React.MouseEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(<div className="text-sm font-medium">メールアドレスをお忘れの場合：<br /><span className="font-bold text-indigo-700">adtown@able.ocn.ne.jp</span></div>);
    setIsPasswordResetMode(false);
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Head><title>Adtown パートナーログイン</title></Head>

      <div className="flex-grow flex items-center justify-center p-4">
        {authLoading ? (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-lg font-semibold text-gray-700">認証情報を確認中...</p>
          </div>
        ) : (
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-6">
            <h1 className="text-2xl font-bold text-gray-900 text-center">パートナーログイン</h1>

            {!authUser && (
              <div className="flex justify-center space-x-4 bg-gray-50 p-2 rounded-lg">
                {['adver', 'recruit'].map((type) => (
                  <label key={type} className={`flex-1 flex items-center justify-center py-2 rounded-md cursor-pointer transition-all ${loginType === type ? 'bg-white shadow-sm text-indigo-600 font-bold' : 'text-gray-500'}`}>
                    <input type="radio" checked={loginType === type} onChange={() => setLoginType(type)} className="hidden" />
                    <span className="text-sm">{type === 'adver' ? '広告' : '求人'}</span>
                  </label>
                ))}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded text-sm font-medium">{error}</div>}
              {successMessage && <div className="p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded text-sm">{successMessage}</div>}

              {!authUser && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">メールアドレス</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="example@mail.com" />
                  </div>

                  {!isPasswordResetMode && (
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">パスワード</label>
                      <div className="relative">
                        <input type={passwordVisible ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                        <button type="button" onClick={() => setPasswordVisible(!passwordVisible)} className="absolute right-3 top-3 text-gray-400">
                          {passwordVisible ? <EyeOffIcon /> : <EyeIcon />}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between text-xs text-indigo-600 font-medium px-1">
                    <button type="button" onClick={handleEmailForget} className="hover:underline">メール忘れ</button>
                    <button type="button" onClick={handleStartPasswordReset} className="hover:underline">パスワード忘れ</button>
                  </div>

                  <button type="submit" disabled={loading} className="w-full py-4 bg-orange-500 text-white font-bold rounded-xl shadow-lg active:scale-95 transition-transform disabled:bg-gray-300">
                    {loading ? "読み込み中..." : (isPasswordResetMode ? '再設定メールを送信' : 'ログインしてダッシュボードへ')}
                  </button>
                </>
              )}
            </form>

            {!authUser && (
              <div className="text-center pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400 mb-3">アカウントをお持ちでない方</p>
                <div className="grid grid-cols-2 gap-3">
                  <Link href="/partner/signup" className="text-xs py-2 border border-gray-200 rounded-lg font-bold text-gray-600 hover:bg-gray-50 text-center">広告登録</Link>
                  <Link href="/recruit" className="text-xs py-2 border border-gray-200 rounded-lg font-bold text-gray-600 hover:bg-gray-50 text-center">求人登録</Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
