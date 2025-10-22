import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import { useState } from 'react';
import nookies from 'nookies';
import { adminAuth, adminDb } from '@/lib/firebase-admin'; // 正しいインポートに修正
import { RiUserSearchLine } from 'react-icons/ri';
import Link from 'next/link';
import { firestore } from 'firebase-admin'; // firestore型を使うためにインポート

// --- 型定義 ---
interface UserData {
    uid: string;
    email: string;
    name?: string;
    // points フィールドは非使用のため削除済み
}

const UserManagementPage: NextPage = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState<UserData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState<string | null>(null); // 削除中のUIDを保持

    // --- ユーザー検索処理 ---
    const handleSearch = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!searchQuery.trim()) {
            alert('メールアドレスまたはユーザーIDを入力してください。');
            return;
        }
        setIsLoading(true);
        setError(null);
        setUsers([]);

        try {
            // NOTE: 実際のAPI呼び出しのパスはプロジェクトに合わせてください
            const response = await fetch('/api/admin/find-users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: searchQuery }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || '検索に失敗しました。');

            if (data.users.length === 0) {
                setError('該当するユーザーが見つかりませんでした。');
            } else {
                setError(null);
            }
            setUsers(data.users as UserData[]);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // --- 退会処理 (アカウント削除) ---
    const handleDeleteUser = async (user: UserData) => {
        // NOTE: confirm() はカスタムモーダルに置き換えるべきです
        const confirmMsg = `ユーザー ${user.email} (UID: ${user.uid}) を完全に退会させます。この操作は元に戻せません。本当によろしいですか？`;
        
        if (!confirm(confirmMsg)) {
            return;
        }

        setIsDeleting(user.uid);
        setError(null);

        try {
            // API呼び出し: /api/admin/delete-user.ts (Canvasで作成済み)
            const response = await fetch('/api/admin/delete-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid: user.uid }),
            });
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || '退会処理に失敗しました。');
            }

            alert(`ユーザー ${user.email} の退会処理を完了しました。`);
            
            // 検索結果から削除されたユーザーを即座に除去
            setUsers(prevUsers => prevUsers.filter(u => u.uid !== user.uid));
            
        } catch (err: any) {
            console.error('User deletion error:', err);
            // alert(`退会処理中にエラーが発生しました: ${err.message}`); // alertは使わない
            setError(`退会処理エラー: ${err.message}`);
        } finally {
            setIsDeleting(null);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <Head>
                <title>{"ユーザー管理"}</title>
            </Head>
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <h1 className="text-xl font-bold text-gray-900">ユーザー管理</h1>
                    <Link href="/admin" className="text-sm text-blue-600 hover:underline">
                        管理メニューに戻る
                    </Link>
                </div>
            </header>
            
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="bg-red-100 p-4 rounded-md text-center mb-6">
                    <p className="text-red-600">
                        <strong>注意：</strong> 現在、このページの認証は一時的に解除されています。<br/>開発が完了したら、必ず認証処理を元に戻してください。
                    </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow mb-6">
                    <form onSubmit={handleSearch} className="flex gap-4">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="メールアドレスまたはユーザーIDで検索"
                            className="flex-grow p-2 border border-gray-300 rounded-md"
                        />
                        <button type="submit" disabled={isLoading} className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 flex items-center">
                            <RiUserSearchLine className="mr-2 h-5 w-5" />
                            {isLoading ? '検索中...' : '検索'}
                        </button>
                    </form>
                </div>

                {error && <p className="text-red-500 text-center py-4">{error}</p>}
                
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <ul role="list" className="divide-y divide-gray-200">
                        {users.map((user) => (
                            <li key={user.uid} className="p-4 sm:p-6 hover:bg-gray-50">
                                <div className="flex items-center justify-between flex-wrap gap-4">
                                    <div className="flex-grow">
                                        <p className="font-bold text-gray-800">{user.name || '名前未設定'}</p>
                                        <p className="text-sm text-gray-600">{user.email}</p>
                                        <p className="text-xs text-gray-400 mt-1">UID: {user.uid}</p>
                                    </div>
                                    <button 
                                        onClick={() => handleDeleteUser(user)} 
                                        disabled={isDeleting === user.uid}
                                        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:bg-gray-400 text-sm whitespace-nowrap"
                                    >
                                        {isDeleting === user.uid ? '退会処理中...' : '退会/削除'}
                                    </button>
                                </div>
                            </li>
                        ))}
                        {users.length === 0 && !error && !isLoading && (
                            <li className="p-6 text-center text-gray-500">検索クエリを入力してユーザーを検索してください。</li>
                        )}
                    </ul>
                </div>
            </main>
        </div>
    );
};

// --- ▼▼▼ 認証保護を一時的にコメントアウト ▼▼▼ ---
/*
export const getServerSideProps: GetServerSideProps = async (ctx) => {
    try {
        const cookies = nookies.get(ctx);
        if (!cookies.token) {
            return { redirect: { destination: '/admin/login', permanent: false } };
        }
        // 修正1: adminAuthをadminAuthに修正 (これは以前のコードのコメントアウト内のため、そのまま維持)
        const token = await adminAuth.verifySessionCookie(cookies.token, true); 
        
        // 修正2: adminDbをadminDbに修正 (これも以前のコードのコメントアウト内のため、そのまま維持)
        const userDoc = await adminDb.collection('users').doc(token.uid).get();
        if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
            return { redirect: { destination: '/admin/login', permanent: false } };
        }
        return { props: {} };
    } catch (error) {
        return { redirect: { destination: '/admin/login', permanent: false } };
    }
};
*/
// --- ▲▲▲ ここまで ▲▲▲ ---

export default UserManagementPage;



