import { NextPage, GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import nookies from 'nookies';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getAuth } from 'firebase/auth'; // クライアント側のFirebase Authをインポート

const ManageStoresPage: NextPage = () => {
    const [stores, setStores] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    // クライアント側で実行されるデータ取得関数
    const fetchStores = async () => {
        setLoading(true);
        setError(null);
        try {
            const auth = getAuth();
            const user = auth.currentUser;

            if (!user) {
                // ログインしていない場合はログインページにリダイレクト
                router.push('/admin/login');
                return;
            }

            const storesCollection = collection(db, 'stores');
            const storeSnapshot = await getDocs(storesCollection);
            const storesList = storeSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setStores(storesList);
        } catch (e) {
            console.error("Error fetching stores: ", e);
            setError("店舗情報の取得中にエラーが発生しました。");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteStore = async (storeId: string) => {
        if (window.confirm("この店舗を削除してもよろしいですか？")) {
            setLoading(true);
            try {
                const storeDoc = doc(db, 'stores', storeId);
                await deleteDoc(storeDoc);
                // 削除後、再度リストをフェッチ
                await fetchStores();
            } catch (e) {
                console.error("Error deleting store: ", e);
                setError("店舗の削除中にエラーが発生しました。");
            } finally {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        fetchStores();
    }, []);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (error) {
        return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <h1 className="text-3xl font-bold mb-6">店舗管理</h1>
            <ul className="bg-white rounded-lg shadow divide-y divide-gray-200">
                {stores.map(store => (
                    <li key={store.id} className="p-4 flex justify-between items-center">
                        <span>{store.storeName}</span>
                        <button onClick={() => handleDeleteStore(store.id)} className="text-red-500 hover:text-red-700">削除</button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

// サーバー側での認証チェックのみを行う
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

export default ManageStoresPage;