import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import { useState, useEffect, useCallback } from 'react'; // useEffect, useCallback をインポート
import nookies from 'nookies';
import { adminAuth, adminDb } from '@/lib/firebase-admin'; 
import { RiUserSearchLine, RiDeleteBinLine } from 'react-icons/ri'; // RiDeleteBinLine を追加
import Link from 'next/link';
// import { firestore } from 'firebase-admin'; // 🚨 削除: クライアントコードでは不要

// --- 型定義 ---
interface UserData {
    uid: string;
    email: string;
    name?: string;
    createdAt?: string; // APIから取得するため追加
}

// 🚨 注意: confirm()/alert() は非推奨ですが、元のコードに合わせて宣言を残します。
declare function confirm(message?: string): boolean;
declare function alert(message?: string): void;

// メインコンポーネント
const UserManagementPage: NextPage = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState<UserData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState<string | null>(null); // 削除中のUIDを保持

    // --- ユーザー検索/初期リスト取得処理 ---
    const fetchUsers = useCallback(async (query = '') => {
        setIsLoading(true);
        setError(null);
        setUsers([]);

        try {
            // API呼び出し: /api/admin/find-users.ts
            const response = await fetch('/api/admin/find-users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: query.trim() }),
            });
            const data = await response.json();
            
            if (!response.ok) throw new Error(data.error || '検索に失敗しました。');

            if (data.users.length === 0 && query.trim()) {
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
    }, []);
    
    // 💡 初期表示時に直近のユーザーをロード
    useEffect(() => {
        // 検索クエリがない場合のみ実行
        if (!searchQuery) {
            fetchUsers('');
        }
    }, [fetchUsers, searchQuery]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchUsers(searchQuery);
    };

    // --- 退会処理 (アカウント削除) ---
    const handleDeleteUser = async (user: UserData) => {
        const confirmMsg = `ユーザー ${user.email} (UID: ${user.uid}) を完全に退会させます。この操作は元に戻せません。本当によろしいですか？`;
        
        if (!confirm(confirmMsg)) {
            return;
        }

        setIsDeleting(user.uid);
        setError(null);

        try {
            // API呼び出し: /api/admin/delete-user.ts 
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
                    {/* ユーザーリストのヘッダー */}
                    <div className="px-6 py-3 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:grid sm:grid-cols-3 md:grid-cols-4">
                        <span className="sm:col-span-1">名前 / Email</span>
                        <span className="hidden md:block md:col-span-1">UID</span>
                        <span className="sm:col-span-1 md:col-span-1 text-right">アクション</span>
                    </div>

                    <ul role="list" className="divide-y divide-gray-200">
                        {users.map((user) => (
                            <li key={user.uid} className="p-4 sm:p-6 hover:bg-gray-50 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 items-center">
                                {/* ユーザー情報 */}
                                <div className="sm:col-span-1 col-span-2">
                                    <p className="font-bold text-gray-800">{user.name || '名前未設定'}</p>
                                    <p className="text-sm text-gray-600 truncate">{user.email}</p>
                                </div>
                                {/* UID */}
                                <div className="hidden md:block md:col-span-1 text-xs text-gray-400 truncate">
                                    {user.uid}
                                </div>
                                {/* 作成日 (オプション) */}
                                <div className="hidden sm:block sm:col-span-1 text-xs text-gray-500">
                                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '作成日不明'}
                                </div>
                                {/* アクションボタン */}
                                <div className="sm:col-span-1 text-right col-span-2 sm:col-span-1">
                                    <button 
                                        onClick={() => handleDeleteUser(user)} 
                                        disabled={isDeleting === user.uid}
                                        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:bg-gray-400 text-sm whitespace-nowrap transition-colors"
                                    >
                                        {isDeleting === user.uid ? '処理中...' : '退会/削除'}
                                    </button>
                                </div>
                            </li>
                        ))}
                        {users.length === 0 && !error && !isLoading && (
                            <li className="p-6 text-center text-gray-500">検索クエリを入力するか、初期リストがロードされるまでお待ちください。</li>
                        )}
                        {isLoading && (
                            <li className="p-6 text-center text-gray-500 flex items-center justify-center">
                                {/* ローディングアニメーションを追加 */}
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                データを読み込み中...
                            </li>
                        )}
                    </ul>
                </div>
            </main>
        </div>
    );
};

// 🚨 認証保護を一時的にコメントアウト (UIの注意書きに従う)
/*
export const getServerSideProps: GetServerSideProps = async (ctx) => {
// ...
};
*/

export default UserManagementPage;



