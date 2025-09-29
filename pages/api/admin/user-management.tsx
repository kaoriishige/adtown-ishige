import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import { useState } from 'react';
import nookies from 'nookies';
import { adminAuth } from '../../../lib/firebase-admin';
import { RiUserSearchLine } from 'react-icons/ri';
import Link from 'next/link';

// --- 型定義 ---
interface UserData {
    uid: string;
    email: string;
    name?: string;
    points?: {
        balance: number;
        usableBalance: number;
    };
}

const UserManagementPage: NextPage = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState<UserData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const [pointsToAdd, setPointsToAdd] = useState<number>(0);
    const [reason, setReason] = useState('');

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
            const response = await fetch('/api/admin/find-users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: searchQuery }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || '検索に失敗しました。');
            if (data.users.length === 0) {
                setError('該当するユーザーが見つかりませんでした。');
            }
            setUsers(data.users);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // --- ポイント調整処理 ---
    const handleAdjustPoints = async () => {
        if (!selectedUser || pointsToAdd === 0 || !reason.trim()) {
            alert('ポイント数と理由を正しく入力してください。');
            return;
        }
        if (!confirm(`${selectedUser.email}に ${pointsToAdd} ポイントを ${pointsToAdd > 0 ? '付与' : '減算'} します。よろしいですか？`)) {
            return;
        }

        try {
            const response = await fetch('/api/admin/adjust-points', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid: selectedUser.uid, amount: pointsToAdd, reason }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'ポイントの操作に失敗しました。');
            
            alert('ポイントの操作が完了しました。');
            setSelectedUser(null);
            setPointsToAdd(0);
            setReason('');
            handleSearch(); // 最新の情報に更新
        } catch (err: any) {
            alert(`エラー: ${err.message}`);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <Head>
                <title>ユーザー管理</title>
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
                            <RiUserSearchLine className="mr-2" />
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
                                        <p className="text-sm text-gray-800 mt-2">
                                            保有ポイント: <span className="font-bold">{user.points?.balance?.toLocaleString() || 0} pt</span> / 
                                            利用可能: <span className="font-bold text-green-600">{user.points?.usableBalance?.toLocaleString() || 0} pt</span>
                                        </p>
                                    </div>
                                    <button onClick={() => setSelectedUser(user)} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm whitespace-nowrap">
                                        ポイント操作
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </main>

            {selectedUser && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4">ポイントの手動操作</h3>
                        <p className="text-sm mb-1">対象: <span className="font-semibold">{selectedUser.email}</span></p>
                        <p className="text-sm mb-4">現在の利用可能ポイント: <span className="font-semibold">{selectedUser.points?.usableBalance?.toLocaleString() || 0} pt</span></p>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700">操作ポイント数</label>
                            <input
                                type="number"
                                value={pointsToAdd}
                                onChange={(e) => setPointsToAdd(parseInt(e.target.value, 10) || 0)}
                                className="mt-1 p-2 w-full border border-gray-300 rounded-md"
                                placeholder="例: 500 (付与) or -100 (減算)"
                            />
                        </div>
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700">操作理由</label>
                            <input
                                type="text"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="mt-1 p-2 w-full border border-gray-300 rounded-md"
                                placeholder="例: キャンペーン特典の付与漏れ"
                            />
                        </div>
                        <div className="mt-6 flex justify-end gap-4">
                            <button onClick={() => setSelectedUser(null)} className="bg-gray-200 px-4 py-2 rounded-md hover:bg-gray-300">キャンセル</button>
                            <button onClick={handleAdjustPoints} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">確定</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
    try {
        const cookies = nookies.get(ctx);
        if (!cookies.token) {
            return { redirect: { destination: '/admin/login', permanent: false } };
        }
        const token = await adminAuth().verifySessionCookie(cookies.token, true);
        const user = await adminAuth().getUser(token.uid);
        if (user.customClaims?.role !== 'admin') {
             return { redirect: { destination: '/admin/login', permanent: false } };
        }
        return { props: {} };
    } catch (error) {
        return { redirect: { destination: '/admin/login', permanent: false } };
    }
};

export default UserManagementPage;