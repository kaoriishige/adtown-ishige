import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import nookies from 'nookies';
import { getAdminAuth, getAdminDb } from '../../lib/firebase-admin';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, DocumentData } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { app } from '../../lib/firebase'; // Firebaseクライアントのappをインポート

// --- 型定義 ---
interface Treasure extends DocumentData {
    id: string;
    name: string;
    hint: string;
    latitude: number;
    longitude: number;
    points: number;
}

const ManageTreasurePage: NextPage = () => {
    const [treasures, setTreasures] = useState<Treasure[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTreasure, setEditingTreasure] = useState<Treasure | null>(null);

    // --- Firestoreからデータを取得 ---
    const fetchTreasures = async () => {
        setIsLoading(true);
        try {
            const db = getFirestore(app);
            const treasuresCollection = collection(db, 'treasures');
            const snapshot = await getDocs(treasuresCollection);
            const treasuresData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Treasure));
            setTreasures(treasuresData);
        } catch (error) {
            console.error("Error fetching treasures:", error);
            alert('お宝情報の取得に失敗しました。');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTreasures();
    }, []);

    // --- 新規追加・編集フォームの処理 ---
    const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get('name') as string,
            hint: formData.get('hint') as string,
            latitude: Number(formData.get('latitude')),
            longitude: Number(formData.get('longitude')),
            points: Number(formData.get('points')),
        };

        if (!data.name || !data.hint || isNaN(data.latitude) || isNaN(data.longitude) || isNaN(data.points)) {
            alert('すべての項目を正しく入力してください。');
            return;
        }

        try {
            const db = getFirestore(app);
            if (editingTreasure) {
                // 更新
                const treasureDoc = doc(db, 'treasures', editingTreasure.id);
                await updateDoc(treasureDoc, data);
            } else {
                // 新規追加
                await addDoc(collection(db, 'treasures'), data);
            }
            closeModal();
            fetchTreasures(); // リストを再読み込み
        } catch (error) {
            console.error("Error saving treasure:", error);
            alert('お宝情報の保存に失敗しました。');
        }
    };

    // --- 削除処理 ---
    const handleDelete = async (id: string) => {
        if (!confirm('このお宝を削除してもよろしいですか？')) return;
        try {
            const db = getFirestore(app);
            await deleteDoc(doc(db, 'treasures', id));
            fetchTreasures(); // リストを再読み込み
        } catch (error) {
            console.error("Error deleting treasure:", error);
            alert('お宝の削除に失敗しました。');
        }
    };

    // --- モーダルの制御 ---
    const openModal = (treasure: Treasure | null = null) => {
        setEditingTreasure(treasure);
        setIsModalOpen(true);
    };
    const closeModal = () => {
        setIsModalOpen(false);
        setEditingTreasure(null);
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <Head>
                <title>お宝さがし管理</title>
            </Head>
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <h1 className="text-xl font-bold text-gray-900">お宝さがし管理</h1>
                    <button
                        onClick={() => openModal()}
                        className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        新しいお宝を追加
                    </button>
                </div>
            </header>
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {isLoading ? (
                    <p className="text-center">読み込み中...</p>
                ) : (
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                        <ul role="list" className="divide-y divide-gray-200">
                            {treasures.map((treasure) => (
                                <li key={treasure.id} className="px-4 py-4 sm:px-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-lg font-medium text-blue-600 truncate">{treasure.name}</p>
                                            <p className="text-sm text-gray-500 mt-1">ヒント: {treasure.hint}</p>
                                            <p className="text-sm text-gray-500">座標: ({treasure.latitude}, {treasure.longitude})</p>
                                            <p className="text-sm text-gray-500">ポイント: {treasure.points} pt</p>
                                        </div>
                                        <div className="flex-shrink-0 ml-4 flex space-x-2">
                                            <button onClick={() => openModal(treasure)} className="text-indigo-600 hover:text-indigo-900">編集</button>
                                            <button onClick={() => handleDelete(treasure.id)} className="text-red-600 hover:text-red-900">削除</button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </main>

            {/* --- 追加・編集モーダル --- */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
                        <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                            {editingTreasure ? 'お宝を編集' : '新しいお宝を追加'}
                        </h3>
                        <form onSubmit={handleFormSubmit}>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">お宝の名前</label>
                                    <input type="text" name="name" id="name" defaultValue={editingTreasure?.name || ''} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                                </div>
                                <div>
                                    <label htmlFor="hint" className="block text-sm font-medium text-gray-700">ヒント</label>
                                    <textarea name="hint" id="hint" defaultValue={editingTreasure?.hint || ''} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"></textarea>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="latitude" className="block text-sm font-medium text-gray-700">緯度 (Latitude)</label>
                                        <input type="number" step="any" name="latitude" id="latitude" defaultValue={editingTreasure?.latitude || ''} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                                    </div>
                                    <div>
                                        <label htmlFor="longitude" className="block text-sm font-medium text-gray-700">経度 (Longitude)</label>
                                        <input type="number" step="any" name="longitude" id="longitude" defaultValue={editingTreasure?.longitude || ''} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="points" className="block text-sm font-medium text-gray-700">獲得ポイント</label>
                                    <input type="number" name="points" id="points" defaultValue={editingTreasure?.points || ''} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end space-x-2">
                                <button type="button" onClick={closeModal} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300">
                                    キャンセル
                                </button>
                                <button type="submit" className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700">
                                    保存
                                </button>
                            </div>
                        </form>
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
        const token = await getAdminAuth().verifySessionCookie(cookies.token, true);
        const user = await getAdminAuth().getUser(token.uid);
        if (user.customClaims?.role !== 'admin') {
             return { redirect: { destination: '/admin/login', permanent: false } };
        }
        return { props: {} };
    } catch (error) {
        return { redirect: { destination: '/admin/login', permanent: false } };
    }
};

export default ManageTreasurePage;