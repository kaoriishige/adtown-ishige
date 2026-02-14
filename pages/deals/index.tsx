import { useState, useMemo } from 'react';
import type { NextPage, GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { db } from '@/lib/firebase'; // ★ 修正: 絶対パス @/lib/firebase に統一
import { collection, getDocs, query, orderBy, limit, DocumentData } from 'firebase/firestore';
import { RiSearchLine, RiMapPinLine, RiCoupon3Line, RiFilter2Line, RiShoppingBagLine, RiArrowRightSLine } from 'react-icons/ri';
import { IoSparklesSharp } from 'react-icons/io5';

// グローバル変数の型を宣言
declare const __app_id: string;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- 型定義 ---
interface Deal {
    id: string;
    storeId: string;
    storeName: string;
    mainCategory: string;
    type: 'お得情報' | 'クーポン';
    title: string;
    description: string;
    imageUrl?: string;
}

interface DealsPageProps {
    initialDeals: Deal[];
    error: string | null;
}

// カテゴリデータ (パートナープロファイルと共通)
const mainCategories = [
    '飲食関連', '買い物関連', '美容・健康関連', '住まい・暮らし関連',
    '教育・習い事関連', 'スポーツ関連', '車・バイク関連', '観光・レジャー関連',
    'ペット関連', '専門サービス関連', 'その他',
];

// ===============================
// サーバーサイドデータフェッチ
// ===================================
export const getServerSideProps: GetServerSideProps = async () => {
    let initialDeals: Deal[] = [];
    let error: string | null = null;
    const DEALS_LIMIT = 50; 

    try {
        const usersCollection = collection(db, 'artifacts', appId, 'users');
        const usersSnapshot = await getDocs(usersCollection);

        for (const userDoc of usersSnapshot.docs) {
            const storesRef = collection(db, 'artifacts', appId, 'users', userDoc.id, 'stores');
            const storesSnapshot = await getDocs(storesRef);

            if (storesSnapshot.empty) continue;

            for (const storeDoc of storesSnapshot.docs) {
                const storeData = storeDoc.data();
                const dealsRef = collection(storesRef, storeDoc.id, 'deals');
                const dealsQuery = query(dealsRef, orderBy("createdAt", "desc"), limit(5));
                const dealsSnapshot = await getDocs(dealsQuery);

                dealsSnapshot.docs.forEach(dealDoc => {
                    const dealData = dealDoc.data();
                    initialDeals.push({
                        id: dealDoc.id,
                        storeId: storeDoc.id,
                        storeName: storeData.storeName || '名称不明',
                        mainCategory: storeData.mainCategory || 'その他',
                        type: dealData.type,
                        title: dealData.title,
                        description: dealData.description,
                        imageUrl: dealData.imageUrl,
                    });
                });
            }
        }

        initialDeals = initialDeals.slice(0, DEALS_LIMIT);

    } catch (err: any) {
        console.error("DealsPage getServerSideProps error:", err);
        error = "データ読み込みに失敗しました。";
    }

    return {
        props: { initialDeals, error },
    };
};

// ===============================
// メインコンポーネント
// ===================================
const DealsPage: NextPage<DealsPageProps> = ({ initialDeals, error }) => {
    const router = useRouter();
    const initialCategory = router.query.category as string || 'すべて';
    
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(initialCategory);
    const [selectedDealType, setSelectedDealType] = useState('すべて');
    const dealTypes = ['すべて', 'お得情報', 'クーポン'];

    // フィルタリングロジック
    const filteredDeals = useMemo(() => {
        return initialDeals.filter(deal => {
            if (selectedCategory !== 'すべて' && deal.mainCategory !== selectedCategory) {
                return false;
            }
            if (selectedDealType !== 'すべて' && deal.type !== selectedDealType) {
                return false;
            }
            if (searchTerm.trim() === '') {
                return true;
            }

            const lowerSearchTerm = searchTerm.toLowerCase();
            return (
                deal.title.toLowerCase().includes(lowerSearchTerm) ||
                deal.storeName.toLowerCase().includes(lowerSearchTerm) ||
                deal.description.toLowerCase().includes(lowerSearchTerm)
            );
        });
    }, [initialDeals, searchTerm, selectedCategory, selectedDealType]);

    const getDealColor = (type: string) => {
        switch(type) {
            case 'クーポン': return 'bg-yellow-500';
            default: return 'bg-green-500';
        }
    };
    
    if (error) {
        return <div className="p-8 text-red-600">エラー: {error}</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Head>
                <title>お得＆クーポン情報一覧</title>
            </Head>

            <header className="bg-white shadow-md sticky top-0 z-10">
                <div className="max-w-xl mx-auto p-4">
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center mb-4">
                        <RiCoupon3Line className="text-orange-500 mr-2" /> お得＆クーポン情報一覧
                    </h1>
                    
                    {/* 検索バー */}
                    <div className="relative mb-4">
                        <RiSearchLine className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="店舗名、キーワードで検索..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                        />
                    </div>

                    {/* フードロス・レスキューへの導線 */}
                    <Link href="/rescue" legacyBehavior>
                        <a className="block mb-4 p-3 bg-gradient-to-r from-rose-500 to-orange-500 rounded-xl text-white shadow-lg transform hover:scale-[1.02] transition active:scale-95">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
                                        <RiShoppingBagLine className="text-xl text-yellow-300" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Food Loss Rescue</p>
                                        <p className="text-sm font-black">廃棄食料をレスキューしよう！</p>
                                    </div>
                                </div>
                                <RiArrowRightSLine className="text-2xl opacity-50" />
                            </div>
                        </a>
                    </Link>

                    {/* フィルターボタン */}
                    <div className="flex items-center space-x-2 overflow-x-auto pb-2">
                        <RiFilter2Line className="text-gray-500 flex-shrink-0" size={24} />
                        {/* カテゴリドロップダウン */}
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="flex-shrink-0 px-3 py-1 border border-gray-300 rounded-full text-sm appearance-none bg-white hover:bg-gray-100"
                        >
                            <option value="すべて">全カテゴリ</option>
                            {mainCategories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                        {/* 種別ドロップダウン */}
                        <select
                            value={selectedDealType}
                            onChange={(e) => setSelectedDealType(e.target.value)}
                            className="flex-shrink-0 px-3 py-1 border border-gray-300 rounded-full text-sm appearance-none bg-white hover:bg-gray-100"
                        >
                            {dealTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                        
                        {/* AIマッチングへの導線 */}
                        <Link href="/matching" legacyBehavior>
                            <a className="flex-shrink-0 px-3 py-1 text-sm font-bold bg-blue-500 text-white rounded-full hover:bg-blue-600 flex items-center">
                                <IoSparklesSharp className="mr-1" /> AIで探す
                            </a>
                        </Link>
                    </div>

                </div>
            </header>
            
            <main className="max-w-xl mx-auto p-4 space-y-4">

                {filteredDeals.length === 0 && (
                    <div className="text-center p-8 bg-white rounded-lg shadow-md mt-4">
                        <p className="text-lg text-gray-600">お探しの情報は見つかりませんでした。</p>
                    </div>
                )}

                {filteredDeals.map(deal => (
                    <Link href={`/stores/view/${deal.storeId}`} key={deal.id} legacyBehavior>
                        <a className="block bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-100">
                            <div className="flex p-4">
                                {deal.imageUrl && (
                                    <img src={deal.imageUrl} alt={deal.title} className="w-20 h-20 object-cover rounded-lg mr-4 flex-shrink-0" />
                                )}
                                <div className="min-w-0 flex-grow">
                                    <div className="flex justify-between items-start mb-1">
                                        <p className="text-xs text-gray-500 flex items-center">
                                            <RiMapPinLine className="mr-1" /> {deal.storeName}
                                        </p>
                                        <span className="text-xs bg-gray-100 text-gray-600 font-semibold px-2 py-0.5 rounded-full flex-shrink-0">
                                            {deal.mainCategory}
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className={`text-xs text-white font-semibold px-2 py-0.5 rounded-full ${getDealColor(deal.type)}`}>
                                            {deal.type}
                                        </span>
                                        <h2 className="text-lg font-bold text-gray-800 truncate">{deal.title}</h2>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{deal.description}</p>
                                </div>
                            </div>
                        </a>
                    </Link>
                ))}
            </main>
        </div>
    );
};

export default DealsPage;