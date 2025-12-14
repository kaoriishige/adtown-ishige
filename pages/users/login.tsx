// ファイル名: users/login.tsx
import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    GoogleAuthProvider, 
    signInWithPopup,
    onAuthStateChanged
} from 'firebase/auth';
// ★重要: あなたのプロジェクトのFirebase初期化ファイルのパスに合わせてください
import { app } from '@/lib/firebase'; 

// アイコンライブラリ (npm install react-icons が必要)
import { FcGoogle } from 'react-icons/fc';
import { RiLoginBoxLine, RiInformationLine } from 'react-icons/ri';

// --- SVGアイコンコンポーネント (パスワード表示切替用) ---
const EyeIcon = (props: React.SVGProps<SVGSVGElement>) => ( 
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"></path><circle cx="12" cy="12" r="3"></circle></svg> 
);
const EyeOffIcon = (props: React.SVGProps<SVGSVGElement>) => ( 
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-10-7-10-7a1.89 1.89 0 0 1 0-.66M22 12s-3 7-10 7a9.75 9.75 0 0 1-4.24-1.16"></path><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9.9 9.9a3 3 0 1 0 4.2 4.2"></path></svg> 
);

/**
 * Firebase Authのエラーコードを日本語メッセージに変換するヘルパー関数
 */
const translateFirebaseError = (err: any): string => {
    if (typeof err === 'object' && err !== null && 'code' in err) {
        switch (err.code) {
            case 'auth/user-not-found':
            case 'auth/wrong-password':
            case 'auth/invalid-credential':
                return 'メールアドレスまたはパスワードが正しくありません。';
            case 'auth/invalid-email':
                return 'メールアドレスの形式が正しくありません。';
            case 'auth/user-disabled':
                return 'このアカウントは無効になっています。運営にお問い合わせください。';
            case 'auth/too-many-requests':
                return '試行回数が多すぎます。時間をおいて再度お試しください。';
            case 'auth/popup-closed-by-user':
                return 'ログイン画面が閉じられました。もう一度お試しください。';
            case 'auth/popup-blocked':
                return 'ブラウザによってポップアップがブロックされました。設定で許可してください。';
            case 'auth/network-request-failed':
                return 'ネットワーク接続に問題があります。通信環境を確認してください。';
            default:
                return `エラーが発生しました: ${err.code}`;
        }
    }
    // エラーコードがない場合
    return err.message || '予期せぬエラーが発生しました。';
};

const LoginPage: NextPage = () => {
    const router = useRouter();
    // コンポーネント内で auth インスタンスを取得
    const auth = getAuth(app); 

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [passwordVisible, setPasswordVisible] = useState(false); 

    // 既にログイン済みならホームへリダイレクト
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                router.push('/home');
            }
        });
        return () => unsubscribe();
    }, [auth, router]);

    /**
     * ✅ サーバーサイドセッション作成処理（フリーズ対策済）
     * FirebaseのIDトークンをサーバーに送り、HttpOnly Cookieをセットしてもらう
     */
    const createSession = async (user: any) => {
        try {
            const idToken = await user.getIdToken(true);
            
            // 💡 10秒でタイムアウトさせるタイマーを設定
            const timeoutPromise = new Promise<Response>((_, reject) =>
                setTimeout(() => reject(new Error('サーバー応答タイムアウト（10秒）')), 10000)
            );

            // 実際の通信とタイマーを競合させる
            const fetchPromise = fetch('/api/auth/sessionLogin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`,
                },
                body: JSON.stringify({ loginType: 'user' }), 
            });

            // 競合処理 (Promise.race)
            const res = await Promise.race([fetchPromise, timeoutPromise]);

            // レスポンスの確認
            if (!(res instanceof Response) || !res.ok) {
                const data = res instanceof Response ? await res.json() : {};
                throw new Error(data.error || 'サーバーセッションの作成に失敗しました。');
            }
            
            // 成功したらホームへ
            router.push('/home');
        } catch (err: any) {
            console.error('Session Creation Error:', err);
            
            // エラーメッセージを分かりやすく表示
            if (err.message.includes('タイムアウト')) {
                setError('ネットワーク接続が不安定です。時間をおいて再試行してください。');
            } else {
                setError('ログイン処理中にサーバーエラーが発生しました。');
            }
            setIsLoading(false);
        }
    };

    /**
     * ✅ メール/パスワードログイン処理
     */
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            await createSession(userCredential.user);
        } catch (err: any) {
            console.error('Login Error:', err);
            setError(translateFirebaseError(err));
            setIsLoading(false);
        }
    };

    /**
     * ✅ Googleログイン処理
     * ※ signInWithPopup を使うことでスマホでのセッション切れ問題を回避
     */
    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setError(null);
        
        const provider = new GoogleAuthProvider();
        
        try {
            const result = await signInWithPopup(auth, provider);
            await createSession(result.user);
        } catch (err: any) {
            console.error('Google Login Error:', err);
            setError(translateFirebaseError(err));
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Head>
                <title>ログイン - みんなの那須アプリ</title>
            </Head>

            <div className="w-full max-w-md">
                <div className="bg-white p-8 rounded-xl shadow-2xl space-y-6">
                    <h1 className="text-3xl font-bold text-gray-900 text-center">
                        おかえりなさい
                    </h1>

                    {error && (
                        <div className="p-3 bg-red-50 border-l-4 border-red-400 text-red-700 rounded-r-lg text-sm flex items-start">
                            <RiInformationLine className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">メールアドレス</label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">パスワード</label>
                            <div className="relative mt-1">
                                <input
                                    id="password"
                                    type={passwordVisible ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setPasswordVisible(!passwordVisible)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                                    aria-label={passwordVisible ? "パスワードを非表示" : "パスワードを表示"}
                                >
                                    {passwordVisible ? <EyeOffIcon /> : <EyeIcon />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 bg-orange-500 text-white font-bold rounded-md hover:bg-orange-600 disabled:bg-gray-400 flex items-center justify-center transition duration-150"
                        >
                            {isLoading ? '処理中...' : (<><RiLoginBoxLine className="mr-2 text-xl" />ログインする</>)}
                        </button>
                    </form>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">または</span>
                        </div>
                    </div>

                    <button
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 transition duration-150"
                    >
                        <FcGoogle className="text-2xl mr-3" />
                        Googleでログイン
                    </button>

                    {/* 新規登録 / ヘルプリンク */}
                    <div className="text-sm text-center space-y-2 border-t pt-6 mt-6">
                        <p className="text-gray-600">
                            アカウントをお持ちでないですか？{' '}
                            <Link href="/users/signup" className="text-blue-600 hover:underline font-medium">
                                新規登録はこちら
                            </Link>
                        </p>
                        
                        <p className="text-gray-600">
                            <Link href="/users/reset-password" className="text-blue-600 hover:underline font-medium">
                                パスワードを忘れた方
                            </Link>
                        </p>
                        
                        {/* 修正箇所: ログインできない場合の連絡先をLINEに変更 */}
                        <div className="text-gray-600 text-xs mt-4">
                            <p className="mb-2">ログインできない場合は<strong className="text-green-600">LINE</strong>よりご連絡ください。</p>
                            <a 
                                href="https://lin.ee/8aXyUwD" 
                                className="inline-block"
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img 
                                    src="https://scdn.line-apps.com/n/line_add_friends/btn/ja.png" 
                                    alt="友だち追加" 
                                    height="36" 
                                    style={{ border: '0' }}
                                />
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;