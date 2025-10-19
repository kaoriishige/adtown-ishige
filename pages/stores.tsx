import { NextPage } from 'next';
import Head from 'next/head';
import dynamic from 'next/dynamic'; // 💡 新規インポート
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { RiMapPinLine, RiStoreLine, RiRefreshLine } from 'react-icons/ri';

// --- データ型定義 ---
interface Store {
    id: string;
    name: string;
    mainCategory: string;
    address: string;
    description: string;
}

// ----------------------------------------------------
// 🚨 対策: CSR (Client-Side Rendering) を強制するコンポーネント
// サーバーサイドでのレンダリングでエラーが出るため、
// dynamic import を使ってクライアント側でのみレンダリングする
// ----------------------------------------------------
const ClientSideStoresPage = () => {
    const [stores, setStores] = useState<Store[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStores = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Firestoreへの実際のAPIコールはここでは行いません
            const mockStores: Store[] = [
                { id: 's1', name: 'なっぴーベーカリー', mainCategory: '飲食関連', address: '那須塩原市○○', description: '美味しいパンです。' },
                { id: 's2', name: '高原の温泉宿', mainCategory: '観光・レジャー関連', address: '那須町△△', description: '日帰り温泉が人気です。' },
                { id: 's3', name: 'チーズ工房のカフェ', mainCategory: '飲食関連', address: '那須街道沿い', description: '自家製チーズが自慢。' },
            ];

            await new Promise(resolve => setTimeout(resolve, 50)); // 意図的な遅延
            setStores(mockStores);

        } catch (e: any) {
            console.error("Store fetch error:", e);
            setError('店舗データの読み込みに失敗しました。');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchStores();
    }, []);

    const handleRefresh = () => {
        fetchStores();
    };

    return (
        <>
            <header className="bg-white shadow-md sticky top-0 z-10">
                <div className="max-w-lg mx-auto p-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-800">加盟店一覧</h1>
                    <button onClick={handleRefresh} className="text-sm text-blue-600 hover:underline flex items-center">
                        <RiRefreshLine className="mr-1" /> 更新
                    </button>
                </div>
            </header>

            <main className="max-w-lg mx-auto p-4">
                {error && <div className="p-3 mb-4 bg-red-100 text-red-700 rounded-md">{error}</div>}
                
                {isLoading ? (
                    <div className="text-center p-8">読み込み中...</div>
                ) : (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600">現在 {stores.length} 店舗が登録されています。</p>
                        {stores.map(store => (
                            <Link 
                                key={store.id} 
                                href={`/stores/${store.id}`} // 詳細ページへのリンク
                                className="block bg-white rounded-lg shadow p-4 transition transform hover:shadow-lg hover:scale-[1.01]"
                            >
                                <div className="flex items-start">
                                    <RiStoreLine size={24} className="text-indigo-500 mr-3 flex-shrink-0" />
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">{store.name}</h2>
                                        <p className="text-sm text-gray-600 mt-1">{store.mainCategory}</p>
                                        <p className="flex items-center text-xs text-gray-500 mt-2">
                                            <RiMapPinLine className="mr-1" />
                                            {store.address}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </main>
        </>
    );
};


// 最終的なページコンポーネント (dynamic import でラップ)
const StoresPage: NextPage = () => (
    <div className="min-h-screen bg-gray-50">
        <Head>
            <title>{"加盟店一覧"}</title>
        </Head>
        <ClientSideStoresPage />
    </div>
);

export default StoresPage;