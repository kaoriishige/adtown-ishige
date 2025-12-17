// pages/users/login.tsx (完全版 - ログイン状態記憶対応)

import React, { useState, useEffect, Fragment } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';

// 【修正点 A】永続化設定に必要なものをインポートに追加
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    signInWithPopup, 
    GoogleAuthProvider, 
    onAuthStateChanged,
    // ★ 1. 永続化に必要なインポートを追加
    setPersistence, 
    browserLocalPersistence,
} from 'firebase/auth';

import {
    initializeApp, 
    getApps, 
    getApp
} from 'firebase/app'; 

// --- アイコンライブラリ（lucide-reactまたは類似）からのインポートを仮定 ---
import { 
    AlertTriangle, 
    Key, 
    Loader2, 
    Eye, 
    EyeOff, 
} from 'lucide-react'; 

// --- Firebase の設定 ---
const firebaseConfig = {
    apiKey: "AIzaSyDtTt0fWthsU6Baq1fJwUx8CgSakoZnMXY",
    authDomain: "minna-no-nasu-app.firebaseapp.com",
    projectId: "minna-no-nasu-app",
    storageBucket: "minna-no-nasu-app.appspot.com",
    messagingSenderId: "885979930856",
    appId: "1:885979930856:web:13d1afd4206c91813e695d",
};

// サービス初期化ロジック
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// ------------------------------------------------
// UIコンポーネントの復元 (Eye/EyeOffアイコン, GoogleIcon)
// ------------------------------------------------
const EyeIcon = (props: React.SVGProps<SVGSVGElement>) => <Eye {...props} />;
const EyeOffIcon = (props: React.SVGProps<SVGSVGElement>) => <EyeOff {...props} />;
const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 24 24" fill="currentColor">
        <path d="M22 12c0-1.12-1.07-2.73-2.9-3.92H12v3.83h5.3c-.23 1.15-1.18 2.39-2.9 3.49l-.02.01h3.76c2.2-1.78 3.46-4.08 3.46-6.41z"/><path d="M12 21c-3.72 0-6.84-2.22-8.32-5.4l.02-.01H6.7c1.3 2.76 4.09 4.67 7.3 4.67 2.2 0 4.08-.75 5.44-2.05l-3.76-2.9z"/><path d="M3.68 9.53a8.88 8.88 0 0 1 0-3.06L7.44 3.7l-.02.01C5.83 5.09 4.7 7.15 4.7 9.5c0 1.25.26 2.45.75 3.52l-3.23 2.5z"/><path d="M12 3.67c1.88 0 3.53.64 4.88 1.99l3.47-3.47C18.66 1.48 15.53 0 12 0 8.04 0 4.54 2.1 2.87 5.25l3.54 2.73C6.73 6.13 9.17 4.67 12 4.67z"/>
    </svg>
);


// ------------------------------------------------
// エラーメッセージのハンドリング関数
// ------------------------------------------------
const getErrorMessage = (e: any): string => {
    if (typeof e === 'object' && e !== null && 'code' in e) {
        switch (e.code) {
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
                return `エラーが発生しました: ${e.code}`;
        }
    }
    return e.message || '予期せぬエラーが発生しました。';
};


// ------------------------------------------------
// メインコンポーネント
// ------------------------------------------------

const LoginPage: NextPage = () => {
    const router = useRouter();
    const firebaseAuth = auth;

    // 状態管理
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // ログイン状態の監視とリダイレクト
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
            if (user) {
                // 認証済みであればホームへリダイレクト
                router.push('/home');
            }
        });
        return () => {
            unsubscribe();
        };
    }, [firebaseAuth, router]);

    // サーバーセッション作成関数
    const createSession = async (user: any) => {
        // ... (既存のロジックは変更なし) ...
        try {
            const idToken = await user.getIdToken(true);
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("サーバー応答タイムアウト（10秒）")), 10000)
            );
            const sessionFetch = fetch("/api/auth/sessionLogin", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify({ loginType: "user" }),
            });
            const response = await Promise.race([sessionFetch, timeoutPromise]);

            if (!(response instanceof Response) || !response.ok) {
                const errorData = response instanceof Response ? await response.json() : {};
                throw new Error(errorData.error || "サーバーセッションの作成に失敗しました。");
            }
            router.push("/home");
        } catch (e: any) {
            console.error("Session Creation Error:", e);
            if (e.message.includes("タイムアウト")) {
                setError("ネットワーク接続が不安定です。時間をおいて再試行してください。");
            } else {
                setError("ログイン処理中にサーバーエラーが発生しました。");
            }
            setIsLoggingIn(false);
        }
    };

    // メール/パスワードログイン処理
    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoggingIn(true);
        setError(null);

        try {
            // ★ 2. メール/パスワードログインの前に永続化を設定
            await setPersistence(firebaseAuth, browserLocalPersistence); 
            
            const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
            await createSession(userCredential.user);
        } catch (e: any) {
            console.error("Login Error:", e);
            setError(getErrorMessage(e));
            setIsLoggingIn(false);
        }
    };

    // Googleログイン処理
    const handleGoogleLogin = async () => {
        setIsLoggingIn(true);
        setError(null);

        try {
            // ★ 3. Googleログインの前に永続化を設定
            await setPersistence(firebaseAuth, browserLocalPersistence);

            const result = await signInWithPopup(firebaseAuth, googleProvider);
            await createSession(result.user);
        } catch (e: any) {
            console.error("Google Login Error:", e);
            setError(getErrorMessage(e));
            setIsLoggingIn(false);
        }
    };

    // ------------------------------------------------
    // JSX (レンダリング)
    // ------------------------------------------------
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Head>
                <title>ログイン - みんなの那須アプリ</title>
            </Head>
            <div className="w-full max-w-md">
                <div className="bg-white p-8 rounded-xl shadow-2xl space-y-6">
                    <h1 className="text-3xl font-bold text-gray-900 text-center">おかえりなさい</h1>
                    
                    {/* エラーメッセージ表示 */}
                    {error && (
                        <div className="p-3 bg-red-50 border-l-4 border-red-400 text-red-700 rounded-r-lg text-sm flex items-start">
                            <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}
                    
                    {/* メール/パスワード フォーム */}
                    <form onSubmit={handleEmailLogin} className="space-y-4">
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
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                                    aria-label={showPassword ? "パスワードを非表示" : "パスワードを表示"}
                                >
                                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                                </button>
                            </div>
                        </div>

                        {/* ログインボタン */}
                        <button
                            type="submit"
                            disabled={isLoggingIn}
                            className="w-full py-3 bg-orange-500 text-white font-bold rounded-md hover:bg-orange-600 disabled:bg-gray-400 flex items-center justify-center transition duration-150"
                        >
                            {isLoggingIn ? (
                                <Fragment>
                                    <Loader2 className="mr-2 text-xl animate-spin" />
                                    処理中...
                                </Fragment>
                            ) : (
                                <Fragment>
                                    <Key className="mr-2 text-xl" />
                                    ログインする
                                </Fragment>
                            )}
                        </button>
                    </form>
                    
                    {/* 区切り線 */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">または</span>
                        </div>
                    </div>
                    
                    {/* Googleログインボタン */}
                    <button
                        onClick={handleGoogleLogin}
                        disabled={isLoggingIn}
                        className="w-full flex items-center justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 transition duration-150"
                    >
                        <GoogleIcon className="text-2xl mr-3" />
                        Googleでログイン
                    </button>
                    
                    {/* リンクとLINE連絡先 */}
                    <div className="text-sm text-center space-y-2 border-t pt-6 mt-6">
                        <p className="text-gray-600">
                            アカウントをお持ちでないですか？{" "}
                            <Link href="/users/signup" className="text-blue-600 hover:underline font-medium">
                                新規登録はこちら
                            </Link>
                        </p>
                        <p className="text-gray-600">
                            <Link href="/users/reset-password" className="text-blue-600 hover:underline font-medium">
                                パスワードを忘れた方
                            </Link>
                        </p>
                        <div className="text-gray-600 text-xs mt-4">
                            <p className="mb-2">
                                ログインできない場合は<strong className="text-green-600">LINE</strong>よりご連絡ください。
                            </p>
                            <a href="https://lin.ee/8aXyUwD" className="inline-block">
                                <img src="https://scdn.line-apps.com/n/line_add_friends/btn/ja.png" alt="友だち追加" height="36" style={{ border: "0" }} />
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;

