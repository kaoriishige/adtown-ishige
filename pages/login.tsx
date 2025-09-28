import { NextPage } from 'next';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { app, db } from '@/lib/firebase'; // Firebase初期化ファイル

const LoginPage: NextPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const auth = getAuth(app);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Firestoreからユーザーの役割（roles）情報を取得
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const userData = userDoc.data();
                const roles = userData.roles || [];

                const isPartner = roles.includes('partner');
                const isRecruit = roles.includes('recruit');
                const isUser = roles.includes('user');

                // 役割に応じてリダイレクト先を振り分ける
                if (isPartner && isRecruit) {
                    router.push('/select-service'); // 複数役割がある場合は選択ページへ
                } else if (isPartner) {
                    router.push('/partner/dashboard');
                } else if (isRecruit) {
                    router.push('/recruit/dashboard');
                } else if (isUser) {
                    router.push('/'); // 一般ユーザーはトップページへ
                } else {
                    router.push('/'); // どれにも当てはまらない場合
                }
            } else {
                // データベースに情報がない一般ユーザー
                router.push('/');
            }

        } catch (err: any) {
            setError('メールアドレスまたはパスワードが正しくありません。');
            console.error(err);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-center text-gray-800">ログイン</h2>
                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">メールアドレス</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">パスワード</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                        />
                    </div>
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    <div>
                        <button type="submit" className="w-full px-4 py-2 font-bold text-white bg-orange-500 rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500">
                            ログイン
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;





