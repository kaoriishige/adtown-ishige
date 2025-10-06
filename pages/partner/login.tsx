import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { app } from '@/lib/firebase';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loginType, setLoginType] = useState<'ad' | 'recruit'>('ad'); 
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const auth = getAuth(app);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            const idToken = await user.getIdToken();

            const response = await fetch('/api/auth/sessionLogin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken, loginType }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'セッションの作成に失敗しました。');
            }

            if (loginType === 'ad') {
                router.push('/partner/dashboard');
            } else {
                router.push('/recruit/dashboard');
            }

        } catch (error: any) {
            console.error("Login Error:", error);
            if (error.code === 'auth/invalid-credential' || error.message.includes('違います') || error.message.includes('登録されていません')) {
                setError(error.message || 'メールアドレスまたはパスワードが違います。');
            } else {
                setError('ログインに失敗しました。時間をおいて再度お試しください。');
            }
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-center mb-6">パートナーログイン</h2>
                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="flex justify-center space-x-4 mb-4 border-b pb-4">
                        <label className="flex items-center cursor-pointer">
                            <input
                                type="radio"
                                name="loginType"
                                value="ad"
                                checked={loginType === 'ad'}
                                onChange={() => setLoginType('ad')}
                                className="form-radio h-5 w-5 text-orange-600 focus:ring-orange-500"
                            />
                            <span className="ml-2 text-gray-700">広告パートナー</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                            <input
                                type="radio"
                                name="loginType"
                                value="recruit"
                                checked={loginType === 'recruit'}
                                onChange={() => setLoginType('recruit')}
                                className="form-radio h-5 w-5 text-orange-600 focus:ring-orange-500"
                            />
                            <span className="ml-2 text-gray-700">求人パートナー</span>
                        </label>
                    </div>

                    <div>
                        <label className="block text-gray-700">メールアドレス</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-orange-600"
                            autoComplete="email"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700">パスワード</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-orange-600"
                            autoComplete="current-password"
                        />
                    </div>
                    {error && <p className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-md">{error}</p>}
                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-orange-500 text-white py-2 rounded-md hover:bg-orange-600 disabled:bg-gray-400 transition-colors"
                        >
                            {isLoading ? 'ログイン中...' : 'ログイン'}
                        </button>
                    </div>
                </form>
                <div className="text-center mt-4">
                    <p className="text-sm text-gray-600">アカウントをお持ちでないですか？</p>
                    <Link href="/partner/signup" className="text-sm text-blue-600 hover:underline">
                        広告パートナー登録
                    </Link>
                    <span className="mx-2 text-gray-400">/</span>
                    <Link href="/recruit" className="text-sm text-blue-600 hover:underline">
                        AI求人パートナー登録
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;