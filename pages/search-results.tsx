// pages/search-results.tsx

import { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useEffect, FC } from "react";
import { FaArrowLeft, FaSearch, FaMapMarkerAlt, FaTag, FaStore, FaSpinner } from "react-icons/fa";

// 仮の店舗データ型
interface StoreResult {
    id: string; // 実際のFirestoreドキュメントIDに対応
    name: string;
    catchphrase: string;
    mainCategory: string;
    area: string;
    imageUrl: string;
}

// ★★★ 修正済み: 実際のFirestore IDを使用 (DOkAkzjVFJEk1A3PEOCw) ★★★
const ACTUAL_STORE_ID = "DOkAkzjVFJEk1A3PEOCw"; 

const DUMMY_RESULTS: StoreResult[] = [
    { 
        id: ACTUAL_STORE_ID, // 実際のIDを使用
        name: "サクセス研究社コンサルティング", 
        catchphrase: "AIとコンサルティングを融合した課題解決", 
        mainCategory: "専門サービス関連", 
        area: "那須塩原市", 
        imageUrl: "https://via.placeholder.com/150/6366f1/FFFFFF?text=AI" 
    },
    { id: "store2", name: "那須町オーガニックカフェ", catchphrase: "地元野菜を使ったヘルシーランチ", mainCategory: "飲食関連", area: "那須町", imageUrl: "https://via.placeholder.com/150/10b981/FFFFFF?text=Cafe" },
    { id: "store3", name: "大田原カット専門美容室", catchphrase: "予約不要！短時間でスタイリッシュに", mainCategory: "美容・健康関連", area: "大田原市", imageUrl: "https://via.placeholder.com/150/ef4444/FFFFFF?text=Beauty" },
];

const SearchResultsPage: NextPage = () => {
    const router = useRouter();
    const { q, main, sub, area } = router.query;

    const [loading, setLoading] = useState(true);
    const [results, setResults] = useState<StoreResult[]>([]);
    
    // 検索条件を文字列化 (表示用)
    const searchParams = [q, main, sub, area].filter(Boolean).map(s => s as string);
    const formattedSearch = searchParams.join(' / ');

    // ★★★ 検索実行ロジック (ダミー) ★★★
    useEffect(() => {
        if (!router.isReady) return;

        setLoading(true);
        
        // 実際にはここでFirebaseのクエリを実行しますが、ここではダミーフィルタリングを行います
        setTimeout(() => {
            const queryQ = q ? (q as string).toLowerCase() : '';
            const queryArea = area ? (area as string) : '';
            
            const filtered = DUMMY_RESULTS.filter(store => 
                // キーワードマッチング
                (queryQ 
                    ? store.name.toLowerCase().includes(queryQ) || store.catchphrase.toLowerCase().includes(queryQ) 
                    : true
                ) &&
                // エリアマッチング
                (queryArea ? store.area === queryArea : true)
                // (main/subカテゴリのロジックは省略)
            );

            setResults(filtered);
            setLoading(false);
        }, 800); 
    }, [router.isReady, q, main, sub, area]); 

    // --- コンポーネント定義 ---
    
    const ResultCard: FC<{ store: StoreResult }> = ({ store }) => (
        <Link href={`/stores/view/${store.id}`} passHref legacyBehavior>
            <a className="flex bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition transform hover:translate-y-[-2px] border-l-4 border-indigo-400">
                <img 
                    src={store.imageUrl} 
                    alt={store.name} 
                    className="w-24 h-24 object-cover rounded-lg flex-shrink-0 mr-4"
                />
                <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-gray-800 truncate">{store.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{store.catchphrase}</p>
                    <div className="flex items-center text-xs text-gray-500 mt-2 space-x-3">
                        <span className="flex items-center"><FaTag className="mr-1" /> {store.mainCategory}</span>
                        <span className="flex items-center"><FaMapMarkerAlt className="mr-1" /> {store.area}</span>
                    </div>
                </div>
            </a>
        </Link>
    );

    // --- レンダリング ---
    
    return (
        <>
            <Head>
                <title>検索結果 | {formattedSearch || '全店舗'} | Minna no Nasu</title>
            </Head>

            <div className="container mx-auto p-4 md:p-8 max-w-4xl">
                <Link href="/search-dashboard/keywords" passHref legacyBehavior>
                    <a className="text-indigo-600 hover:underline flex items-center mb-8">
                        <FaArrowLeft className="mr-2 w-4 h-4" />
                        検索条件の変更に戻る
                    </a>
                </Link>

                <h1 className="text-3xl font-bold text-gray-800 mb-4 flex items-center">
                    <FaStore className="mr-3 text-red-500 w-6 h-6" />
                    検索結果
                </h1>
                
                {/* 検索条件の表示 */}
                <div className="p-4 bg-gray-100 rounded-lg mb-8 border-l-4 border-red-500">
                    <p className="font-semibold text-gray-700 text-sm">現在の条件:</p>
                    <p className="text-lg font-mono text-gray-800 break-words">{formattedSearch || "条件なし (全店舗)"}</p>
                </div>
                
                {/* 結果の表示 */}
                {loading ? (
                    <div className="text-center py-20 text-gray-600">
                        <FaSpinner className="animate-spin w-8 h-8 mx-auto text-red-500 mb-3" />
                        検索中...
                    </div>
                ) : (
                    <>
                        <h2 className="text-xl font-bold text-gray-800 mb-6">
                            {results.length} 件の店舗が見つかりました
                        </h2>
                        <div className="space-y-6">
                            {results.length > 0 ? (
                                results.map(store => <ResultCard key={store.id} store={store} />)
                            ) : (
                                <div className="p-10 text-center bg-white rounded-xl shadow-md text-gray-700">
                                    <p className="font-semibold">お探しの条件に合う店舗は見つかりませんでした。</p>
                                    <p className="text-sm mt-2">キーワードやカテゴリを変更して再度検索してください。</p>
                                </div>
                            )}
                        </div>
                    </>
                )}

            </div>
        </>
    );
};

export default SearchResultsPage;