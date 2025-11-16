import { useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { RiMailSendLine } from 'react-icons/ri';

/**
 * パスワードリセット専用のエラー翻訳
 */
const translateResetError = (err: any): string => {
    switch (err.code) {
        case 'auth/user-not-found':
        case 'auth/invalid-email':
            return 'ご入力のメールアドレスは登録されていません。';
        case 'auth/too-many-requests':
            return '試行回数が多すぎます。時間をおいて再度お試しください。';
        default:
            return 'メールの送信に失敗しました。もう一度お試しください。';
    }
};

const ResetPasswordPage: NextPage = () => {
    const auth = getAuth(app);
    const [email, setEmail] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null); // 
    const [isLoading, setIsLoading] = useState(false);

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setMessage(null);
        
        if (!email) {
            setError('メールアドレスを入力してください。');
            return;
        }

        setIsLoading(true);
        try {
            await sendPasswordResetEmail(auth, email);
            setMessage('パスワードリセット用のメールを送信しました。受信トレイをご確認ください。');
            setEmail(''); // 成功したらフォームをクリア
        } catch (err: any) {
            console.error('Password Reset Error:', err);
            setError(translateResetError(err));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Head>
                <title>パスワードを忘れた方 - みんなの那須アプリ</title>
            </Head>

            <div className="w-full max-w-md">
                <div className="bg-white p-8 rounded-xl shadow-2xl space-y-6">
                    <h1 className="text-2xl font-bold text-gray-900 text-center">パスワードの再設定</h1>
                    <p className="text-center text-gray-600">
                        登録済みのメールアドレスを入力してください。パスワード再設定用のリンクを送信します。
                    </p>

                    {error && (
                        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm text-center">
                            {error}
                        </div>
                    )}
                    {message && (
                        <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-sm text-center">
                            {message}
                        </div>
                    )}

                    <form onSubmit={handlePasswordReset} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">メールアドレス</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                required
                                placeholder="user@example.com"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 bg-orange-500 text-white font-bold rounded-md hover:bg-orange-600 disabled:bg-gray-400 flex items-center justify-center"
                        >
                            {isLoading ? '送信中...' : (<><RiMailSendLine className="mr-2" />リセットメールを送信</>)}
                        </button>
                    </form>
                </div>

                <div className="mt-6 text-center text-sm">
                    <p className="text-gray-600">
                        <Link href="/users/login" className="text-blue-600 hover:underline">
                            ログインページに戻る
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordPage;