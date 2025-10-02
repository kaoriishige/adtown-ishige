import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const LoginPage = () => {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            // 1. Firebase Authでクライアント側のログインを実行
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // 2. IDトークンを取得
            const idToken = await user.getIdToken();

            // 3. IDトークンをサーバーに送り、セッションを作成
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken }),
            });

            const data = await response.json();

            if (response.ok) {
                // 4. サーバーから指定されたページにリダイレクト
                router.push(data.redirectTo || '/');
            } else {
                throw new Error(data.error || 'ログインに失敗しました。');
            }
        } catch (err: any) {
            let message = 'メールアドレスまたはパスワードが違います。';
            if(err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password'){
                 message = 'メールアドレスまたはパスワードが違います。';
            }
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                <h1 className="text-2xl font-bold text-center text-gray-800">ログイン</h1>
                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-700">メールアドレス</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-2 border rounded-lg focus:ring-orange-500 focus:border-orange-500"
                        />
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-700">パスワード</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-4 py-2 border rounded-lg focus:ring-orange-500 focus:border-orange-500"
                        />
                    </div>
                    {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                    <div>
                        <button type="submit" disabled={isLoading} className="w-full py-3 text-white bg-orange-500 rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors">
                            {isLoading ? 'ログイン中...' : 'ログイン'}
                        </button>
                    </div>
                </form>
                <p className="text-sm text-center text-gray-600">
                    アカウントをお持ちでないですか？<br/>
                    <Link href="/partner/signup" className="font-medium text-blue-600 hover:underline">広告パートナー登録</Link>
                    {' / '}
                    <Link href="/recruit" className="font-medium text-blue-600 hover:underline">AI求人パートナー登録</Link>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;




