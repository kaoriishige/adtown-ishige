import { useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { getAuth, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { FcGoogle } from 'react-icons/fc';
import { RiLoginBoxLine } from 'react-icons/ri';

const LoginPage: NextPage = () => {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const auth = getAuth(app);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            const idToken = await user.getIdToken(true); // トークンを強制的に更新

            const response = await fetch('/api/auth/sessionLogin', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}` 
                },
                body: JSON.stringify({ loginType: 'user' }),
                credentials: 'include', // Cookieを送受信するために必要
            });

            if (response.ok) {
                // Cookieがブラウザに反映されるのを少し待つ
                await new Promise((resolve) => setTimeout(resolve, 300));
                // ページを完全にリロードしてホームページへ
                window.location.href = '/home';
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'セッションの作成に失敗しました。');
            }
        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                setError('メールアドレスまたはパスワードが正しくありません。');
            } else {
                setError(err.message || 'ログインに失敗しました。時間をおいて再度お試しください。');
            }
            setIsLoading(false); // エラー時にローディングを解除
        }
    };

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setError(null);
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            const idToken = await user.getIdToken(true); // トークンを強制的に更新

            const response = await fetch('/api/auth/sessionLogin', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}` 
                },
                 body: JSON.stringify({ loginType: 'user' }),
                 credentials: 'include', // Cookieを送受信するために必要
            });

            if (response.ok) {
                // Cookieがブラウザに反映されるのを少し待つ
                await new Promise((resolve) => setTimeout(resolve, 300));
                // ページを完全にリロードしてホームページへ
                window.location.href = '/home';
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'サーバー側でセッションの作成に失敗しました。');
            }
        } catch (err: any) {
            console.error("Google Login Error:", err);
            switch (err.code) {
                case 'auth/popup-closed-by-user':
                    setError('ログインウィンドウが閉じられました。もう一度お試しください。');
                    break;
                case 'auth/popup-blocked':
                    setError('ブラウザによってポップアップがブロックされました。ポップアップを許可してから再度お試しください。');
                    break;
                default:
                    setError(err.message || 'Googleログインに失敗しました。時間をおいて再度お試しください。');
                    break;
            }
            setIsLoading(false); // エラー時にローディングを解除
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <Head>
                <title>ログイン - みんなの那須アプリ</title>
            </Head>
            <div className="w-full max-w-md">
                <div className="bg-white p-8 rounded-lg shadow-md">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-center">地域お守りプランにログイン</h1>
                        <p className="text-center text-gray-600 mt-2">登録したメールアドレスとパスワードでログインしてください。</p>
                    </div>

                    {error && (
                        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md">
                            <p>{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-6">
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
                            <label className="block mb-1 text-sm font-medium">パスワード</label>
                            <input 
                                type="password" 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                className="w-full px-3 py-2 border rounded-md" 
                                required 
                            />
                        </div>
                        
                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full py-3 px-4 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400 font-bold flex items-center justify-center"
                        >
                            {isLoading ? '処理中...' : (
                                <>
                                    <RiLoginBoxLine className="mr-2"/>
                                    ログインする
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6">
                        <div className="relative"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300" /></div><div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">または</span></div></div>
                        <div className="mt-6">
                            <button
                                onClick={handleGoogleLogin}
                                disabled={isLoading}
                                className="w-full flex items-center justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:bg-gray-100"
                            >
                                <FcGoogle className="text-2xl mr-3" />
                                Googleでログイン
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-6 text-center text-sm">
                    <p className="text-gray-600">
                        アカウントをお持ちでないですか？{' '}
                        <Link href="/users/signup" className="text-blue-600 hover:underline">新規登録はこちら</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;