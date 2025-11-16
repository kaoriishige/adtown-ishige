import { useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    GoogleAuthProvider, 
    signInWithPopup 
} from 'firebase/auth';
import { app } from '@/lib/firebase';
import { FcGoogle } from 'react-icons/fc';
import { RiLoginBoxLine } from 'react-icons/ri';

// --- SVGアイコン (パートナーログインから流用) ---
const EyeIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"></path><circle cx="12" cy="12" r="3"></circle></svg> );
const EyeOffIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-10-7-10-7a1.89 1.89 0 0 1 0-.66M22 12s-3 7-10 7a9.75 9.75 0 0 1-4.24-1.16"></path><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9.9 9.9a3 3 0 1 0 4.2 4.2"></path></svg> );

/**
 * Firebase Authのエラーコードを日本語に変換します。
 */
const translateFirebaseError = (err: any): string => {
    if (err.message && (err.message.includes('サーバー') || err.message.includes('失敗'))) {
         return err.message;
    }
    
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
            return 'ログインウィンドウが閉じられました。もう一度お試しください。';
        case 'auth/popup-blocked':
            return 'ブラウザによってポップアップがブロックされました。ポップアップを許可してください。';
        default:
            console.error('Unhandled Auth Error:', err);
            return 'ログインに失敗しました。不明なエラーが発生しました。';
    }
};

const LoginPage: NextPage = () => {
    const router = useRouter();
    const auth = getAuth(app);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [passwordVisible, setPasswordVisible] = useState(false); 

    // ✅ 通常ログイン処理
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            const idToken = await user.getIdToken(true);

            const res = await fetch('/api/auth/sessionLogin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`,
                },
                body: JSON.stringify({ loginType: 'user' }), 
                credentials: 'include',
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'サーバーでエラーが発生しました。');
            }

            await new Promise((r) => setTimeout(r, 500));
            window.location.href = '/home'; 
        } catch (err: any) {
            console.error(err);
            setError(translateFirebaseError(err)); 
            setIsLoading(false);
        }
    };

    // ✅ Googleログイン処理
    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setError(null);
        const provider = new GoogleAuthProvider();
        
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            const idToken = await user.getIdToken(true);

            const res = await fetch('/api/auth/sessionLogin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`,
                },
                body: JSON.stringify({ loginType: 'user' }), 
                credentials: 'include',
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'サーバーでセッション作成に失敗しました。');
            }

            await new Promise((r) => setTimeout(r, 500));
            window.location.href = '/home'; 
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
                        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">メールアドレス</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">パスワード</label>
                            <div className="relative mt-1">
                                <input
                                    type={passwordVisible ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setPasswordVisible(!passwordVisible)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                                >
                                    {passwordVisible ? <EyeOffIcon /> : <EyeIcon />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 bg-orange-500 text-white font-bold rounded-md hover:bg-orange-600 disabled:bg-gray-400 flex items-center justify-center"
                        >
                            {isLoading ? '処理中...' : (<><RiLoginBoxLine className="mr-2" />ログインする</>)}
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
                        className="w-full flex items-center justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:bg-gray-100"
                    >
                        <FcGoogle className="text-2xl mr-3" />
                        Googleでログイン
                    </button>

                    {/* 新規登録 / ヘルプリンク */}
                    <div className="text-sm text-center space-y-2 border-t pt-6 mt-6">
                        <p className="text-gray-600">
                            アカウントをお持ちでないですか？{' '}
                            <Link href="/users/signup" className="text-blue-600 hover:underline">
                                新規登録はこちら
                            </Link>
                        </p>
                        
                        {/* ★ 修正: 専用ページへのリンクに変更 */}
                        <p className="text-gray-600">
                            <Link href="/users/reset-password" className="text-blue-600 hover:underline">
                                パスワードを忘れた方
                            </Link>
                        </p>
                        
                        {/* ★ 修正: 文言変更 + mailto: リンク */}
                        <p className="text-gray-600">
                            メールアドレスを忘れた方は、通常お使いのメールで{' '}
                            <a 
                                href="mailto:adtown001@gmail.com" 
                                className="text-blue-600 hover:underline"
                            >
                                adtown001@gmail.com
                            </a>
                            {' '}までご連絡ください。
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;