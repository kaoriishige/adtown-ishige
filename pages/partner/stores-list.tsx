import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, DocumentData } from 'firebase/firestore';
import { FiMapPin, FiStar, FiChevronRight } from 'react-icons/fi';
import Image from 'next/image';

// --- 型定義 ---
interface Store extends DocumentData {
    // id: string; <--- ❌ この行を削除します。ドキュメントIDは doc.id から取得します。
    storeName: string;
    description: string;
    mainCategory: string;
    subCategory: string;
    area: string; // 那須塩原市, 那須町, 大田原市 など
    imageUrl: string;
    rating: number;
    reviewCount: number;
}

// --- ダミーデータ (実際はFirestoreから取得) ---
const DUMMY_CATEGORIES = [
    { name: 'すべて', icon: '🌍' },
    { name: '飲食関連', icon: '🍽️' },
    { name: '買い物関連', icon: '🛍️' },
    { name: '美容・健康', icon: '🧘' },
    { name: '専門サービス', icon: '💼' },
    { name: '観光・レジャー', icon: '🏞️' },
];

const StoresListPage: NextPage = () => { // コンポーネント名も変更
    const [stores, setStores] = useState<Store[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('すべて');
    const [searchTerm, setSearchTerm] = useState('');

    const fetchStores = async () => {
        setLoading(true);
        try {
            let storesQuery = collection(db, 'stores');
            let q = query(storesQuery);

            if (selectedCategory !== 'すべて') {
                q = query(q, where('mainCategory', '==', selectedCategory));
            }
            if (searchTerm) {
                // 実際にはFirestoreで部分一致検索はできないため、ダミーで実装
                // 本番ではElasticsearchやAlgoliaなどの外部検索サービスが必要
            }

            const querySnapshot = await getDocs(q);
            const storesList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data() as Store,
            }));

            // クライアントサイドでのフィルタリング（Firestoreの制限を回避）
            const filteredStores = storesList.filter(store => 
                store.storeName.includes(searchTerm) || store.description.includes(searchTerm)
            );
            
            setStores(filteredStores);
        } catch (error) {
            console.error("Error fetching stores: ", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // コンポーネントがマウントされたとき、およびカテゴリ/検索語が変わったときに実行
        fetchStores();
    }, [selectedCategory, searchTerm]); // fetchStoresを依存配列に追加してエラー回避

    return (
        <div className="min-h-screen bg-gray-50">
            <Head>
                <title>みんなの店舗一覧</title>
            </Head>

            {/* ヘッダーと検索 */}
            <header className="bg-white shadow sticky top-0 z-10">
                <div className="max-w-4xl mx-auto p-4">
                    <h1 className="text-2xl font-bold mb-3">お店を探す</h1>
                    <input
                        type="text"
                        placeholder="キーワードで検索 (例: ラーメン, 美容室)"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg shadow-inner"
                    />
                </div>
                {/* カテゴリタブ */}
                <div className="overflow-x-auto border-b bg-white">
                    <div className="flex max-w-4xl mx-auto px-4 space-x-4">
                        {DUMMY_CATEGORIES.map(cat => (
                            <button
                                key={cat.name}
                                onClick={() => setSelectedCategory(cat.name)}
                                className={`flex-shrink-0 py-2 border-b-2 font-medium transition-colors ${
                                    selectedCategory === cat.name
                                        ? 'border-indigo-600 text-indigo-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                {cat.icon} {cat.name}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {/* 店舗リスト */}
            <main className="max-w-4xl mx-auto p-4 pt-6">
                {loading ? (
                    <div className="text-center py-10 text-gray-500">店舗を読み込み中...</div>
                ) : (
                    <div className="space-y-4">
                        {stores.length === 0 ? (
                            <div className="text-center py-10 text-gray-500">該当する店舗は見つかりませんでした。</div>
                        ) : (
                            stores.map(store => (
                                <Link key={store.id} href={`/stores/${store.id}`} className="block bg-white rounded-xl shadow hover:shadow-lg transition-shadow overflow-hidden">
                                    <div className="flex">
                                        {/* 画像エリア */}
                                        <div className="w-24 h-24 flex-shrink-0 relative">
                                            <Image
                                                src={store.imageUrl || `https://placehold.co/100x100/A0B3DB/ffffff?text=${encodeURIComponent(store.storeName.substring(0, 1))}`}
                                                alt={store.storeName}
                                                fill
                                                style={{ objectFit: 'cover' }}
                                                sizes="100px"
                                                className="transition-transform duration-300 hover:scale-105"
                                                onError={(e) => { e.currentTarget.src = `https://placehold.co/100x100/A0B3DB/ffffff?text=${encodeURIComponent(store.storeName.substring(0, 1))}`; }}
                                            />
                                        </div>
                                        {/* 詳細エリア */}
                                        <div className="p-3 flex-grow">
                                            <h2 className="text-lg font-bold text-gray-900 line-clamp-1">{store.storeName}</h2>
                                            <p className="text-xs text-gray-500 mt-1 flex items-center">
                                                <FiMapPin className="mr-1 h-3 w-3" />
                                                {store.area} | {store.subCategory}
                                            </p>
                                            <div className="flex items-center mt-1 text-sm text-yellow-500">
                                                <FiStar className="h-4 w-4 mr-1" fill="currentColor" />
                                                <span className="font-semibold">{store.rating.toFixed(1)}</span>
                                                <span className="text-gray-400 ml-2">({store.reviewCount}件)</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center p-3 text-gray-400">
                                            <FiChevronRight className="h-5 w-5" />
                                        </div>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                )}
            </main>

            {/* フッターなど省略 */}
        </div>
    );
};

export default StoresListPage;