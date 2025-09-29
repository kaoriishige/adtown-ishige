import { NextPage, GetServerSideProps } from 'next';
import { useState, useEffect } from 'react';
import nookies from 'nookies';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, DocumentData } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { useRouter } from 'next/router';

// トレジャーアイテムの型定義から'id'を削除
interface TreasureItem extends DocumentData {
    name: string;
    description: string;
    points: number;
    rarity: 'common' | 'rare' | 'epic';
    isActive: boolean;
}

const ManageTreasurePage: NextPage = () => {
    const router = useRouter();
    const [items, setItems] = useState<TreasureItem[]>([]);
    const [newItem, setNewItem] = useState({ name: '', description: '', points: 0, rarity: 'common', isActive: true });
    const [editingItem, setEditingItem] = useState<TreasureItem | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const firestore = getFirestore(app);

    const fetchItems = async () => {
        setLoading(true);
        setError(null);
        try {
            const itemsCollection = collection(firestore, 'treasures');
            const itemSnapshot = await getDocs(itemsCollection);
            // 'id'プロパティを正しく追加
            const itemList = itemSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as TreasureItem }));
            setItems(itemList);
        } catch (e) {
            console.error("Error fetching items: ", e);
            setError("アイテムの取得中にエラーが発生しました。");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, []);

    const handleCreateItem = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await addDoc(collection(firestore, 'treasures'), newItem);
            setNewItem({ name: '', description: '', points: 0, rarity: 'common', isActive: true });
            fetchItems();
        } catch (e) {
            console.error("Error adding item: ", e);
            setError("アイテムの追加中にエラーが発生しました。");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingItem) return;
        setLoading(true);
        setError(null);
        try {
            const itemDoc = doc(firestore, 'treasures', editingItem.id);
            await updateDoc(itemDoc, { ...editingItem });
            setEditingItem(null);
            fetchItems();
        } catch (e) {
            console.error("Error updating item: ", e);
            setError("アイテムの更新中にエラーが発生しました。");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteItem = async (id: string) => {
        if (window.confirm("このアイテムを削除してもよろしいですか？")) {
            setLoading(true);
            setError(null);
            try {
                await deleteDoc(doc(firestore, 'treasures', id));
                fetchItems();
            } catch (e) {
                console.error("Error deleting item: ", e);
                setError("アイテムの削除中にエラーが発生しました。");
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <h1 className="text-3xl font-bold mb-6">トレジャーアイテム管理</h1>
            <p className="text-sm text-gray-500 mb-4">このページは、アプリ内でユーザーが獲得できるトレジャーアイテムの作成、編集、削除を行うための管理画面です。</p>

            <div className="bg-white p-6 rounded-lg shadow mb-6">
                <h2 className="text-2xl font-semibold mb-4">{editingItem ? 'アイテムを編集' : '新しいアイテムを追加'}</h2>
                <form onSubmit={editingItem ? handleUpdateItem : handleCreateItem} className="space-y-4">
                    <div className="flex flex-col">
                        <label htmlFor="name" className="mb-1 text-sm font-medium text-gray-700">アイテム名</label>
                        <input
                            id="name"
                            type="text"
                            value={editingItem ? editingItem.name : newItem.name}
                            onChange={(e) => editingItem ? setEditingItem({...editingItem, name: e.target.value}) : setNewItem({...newItem, name: e.target.value})}
                            required
                            className="p-2 border rounded-md"
                        />
                    </div>
                    <div className="flex flex-col">
                        <label htmlFor="description" className="mb-1 text-sm font-medium text-gray-700">説明</label>
                        <textarea
                            id="description"
                            value={editingItem ? editingItem.description : newItem.description}
                            onChange={(e) => editingItem ? setEditingItem({...editingItem, description: e.target.value}) : setNewItem({...newItem, description: e.target.value})}
                            required
                            className="p-2 border rounded-md h-24"
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col">
                            <label htmlFor="points" className="mb-1 text-sm font-medium text-gray-700">獲得ポイント</label>
                            <input
                                id="points"
                                type="number"
                                value={editingItem ? editingItem.points : newItem.points}
                                onChange={(e) => editingItem ? setEditingItem({...editingItem, points: Number(e.target.value)}) : setNewItem({...newItem, points: Number(e.target.value)})}
                                required
                                min="0"
                                className="p-2 border rounded-md"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label htmlFor="rarity" className="mb-1 text-sm font-medium text-gray-700">レア度</label>
                            <select
                                id="rarity"
                                value={editingItem ? editingItem.rarity : newItem.rarity}
                                onChange={(e) => editingItem ? setEditingItem({...editingItem, rarity: e.target.value as 'common' | 'rare' | 'epic'}) : setNewItem({...newItem, rarity: e.target.value as 'common' | 'rare' | 'epic'})}
                                className="p-2 border rounded-md bg-white"
                            >
                                <option value="common">Common</option>
                                <option value="rare">Rare</option>
                                <option value="epic">Epic</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex items-center">
                        <input
                            id="isActive"
                            type="checkbox"
                            checked={editingItem ? editingItem.isActive : newItem.isActive}
                            onChange={(e) => editingItem ? setEditingItem({...editingItem, isActive: e.target.checked}) : setNewItem({...newItem, isActive: e.target.checked})}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="isActive" className="ml-2 text-sm font-medium text-gray-700">有効</label>
                    </div>
                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                    <button type="submit" disabled={loading} className="w-full bg-blue-500 text-white font-bold p-3 rounded-md hover:bg-blue-600 disabled:bg-gray-400">
                        {loading ? '処理中...' : (editingItem ? '更新' : '追加')}
                    </button>
                    {editingItem && (
                        <button type="button" onClick={() => setEditingItem(null)} className="w-full mt-2 bg-gray-500 text-white font-bold p-3 rounded-md hover:bg-gray-600">
                            キャンセル
                        </button>
                    )}
                </form>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-2xl font-semibold mb-4">既存アイテム一覧</h2>
                {loading ? (
                    <div className="text-center py-10">アイテム読み込み中...</div>
                ) : (
                    <ul className="divide-y divide-gray-200">
                        {items.map(item => (
                            <li key={item.id} className="py-4 flex justify-between items-center">
                                <div>
                                    <p className="text-lg font-medium">{item.name}</p>
                                    <p className="text-sm text-gray-500">ポイント: {item.points} | レア度: {item.rarity} | 状態: {item.isActive ? '有効' : '無効'}</p>
                                </div>
                                <div className="space-x-2">
                                    <button onClick={() => setEditingItem(item)} className="text-blue-500 hover:text-blue-600">編集</button>
                                    <button onClick={() => handleDeleteItem(item.id)} className="text-red-500 hover:text-red-600">削除</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
    try {
        const cookies = nookies.get(context);
        if (!cookies.token) {
            return { redirect: { destination: '/admin/login', permanent: false } };
        }
        
        const token = await adminAuth.verifyIdToken(cookies.token, true);

        const userDoc = await adminDb.collection('users').doc(token.uid).get();

        if (!userDoc.exists || !userDoc.data()?.roles?.includes('admin')) {
            return { redirect: { destination: '/admin/login', permanent: false } };
        }

        return {
            props: {},
        };
    } catch (error) {
        console.error('認証エラー:', error);
        return { redirect: { destination: '/admin/login', permanent: false } };
    }
};

export default ManageTreasurePage;