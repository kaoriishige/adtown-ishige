import { useState, useMemo, FC } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FaArrowLeft, FaSearch, FaTag, FaMapMarkerAlt, FaFilter } from 'react-icons/fa';

// 仮定: カテゴリデータはlib/categoryDataからインポートされる
// ★ FIX 2307: パスの深さを修正 ( '../../../' -> '../../' または環境に応じて修正が必要です)
import { categoryData, mainCategories } from '../../lib/categoryData'; 

// エリアのリスト
const AREA_OPTIONS = ['那須塩原市', '大田原市', '那須町', 'その他'];

// *******************************************************
// メインの検索フォームコンポーネント
// *******************************************************
const SearchKeywordsPage: FC = () => {
    const router = useRouter();
    const [keyword, setKeyword] = useState('サクセス研究社'); 
    const [mainCategory, setMainCategory] = useState('専門サービス関連'); 
    const [subCategory, setSubCategory] = useState('コンサルティング');
    const [area, setArea] = useState('那須塩原市'); 
    
    // カテゴリデータのメモ化
    const subCategoryOptions: string[] = useMemo(() => {
        // categoryDataの型が 'any' でないことを想定し、キーの存在を確認
        const data = categoryData[mainCategory as keyof typeof categoryData];
        if (mainCategory && Array.isArray(data)) {
            // TypeScriptの互換性のため、安全にstring[]として扱う
            return data as string[]; 
        }
        return [];
    }, [mainCategory]);

    // 検索実行ハンドラを修正
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        
        // 検索クエリを作成
        const queryParams = new URLSearchParams();
        if (keyword) queryParams.set('q', keyword);
        if (mainCategory) queryParams.set('main', mainCategory);
        if (subCategory) queryParams.set('sub', subCategory);
        if (area) queryParams.set('area', area);

        // 検索結果ページへ遷移 (例: /search-results?q=...)
        // デバッグ用のアラートを削除し、router.pushで遷移を確定させます。
        router.push(`/search-results?${queryParams.toString()}`);
    };

    return (
        <>
            <Head>
                <title>キーワード＆カテゴリ検索 | Minna no Nasu</title>
            </Head>

            <div className="container mx-auto p-4 md:p-8 max-w-4xl">
                <Link href="/search-dashboard" passHref legacyBehavior>
                    <a className="text-gray-600 hover:text-indigo-600 flex items-center mb-8">
                        <FaArrowLeft className="mr-2 w-4 h-4" />
                        検索ダッシュボードに戻る
                    </a>
                </Link>

                <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
                    <FaSearch className="mr-3 text-red-500 w-6 h-6" />
                    詳細な条件検索
                </h1>
                <p className="text-gray-600 mb-10">キーワード、カテゴリ、エリアを組み合わせて最適な店舗を絞り込みます。</p>

                <form onSubmit={handleSearch} className="space-y-8 p-6 bg-white rounded-xl shadow-lg border-t-4 border-red-500">
                    
                    {/* 1. キーワード検索 */}
                    <div className="space-y-2">
                        <label className="font-bold text-lg text-gray-700 flex items-center">
                            <FaFilter className="mr-2 w-4 h-4 text-red-500"/>
                            キーワード検索
                        </label>
                        <input
                            type="text"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            placeholder="例: オーガニック、駐車場完備、ショートカット"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 text-gray-800"
                        />
                        <p className="text-sm text-gray-500">店舗名、紹介文、強みなどから幅広く検索します。</p>
                    </div>

                    {/* 2. カテゴリ絞り込み */}
                    <div className="space-y-2 border-t pt-6">
                        <label className="font-bold text-lg text-gray-700 flex items-center">
                            <FaTag className="mr-2 w-4 h-4 text-red-500"/>
                            カテゴリで絞り込む
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* 大分類 */}
                            <div>
                                <select 
                                    value={mainCategory} 
                                    onChange={e => { setMainCategory(e.target.value); setSubCategory(''); }}
                                    className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-red-400"
                                >
                                    <option value="">大分類（すべて）</option>
                                    {/* ★ FIX 7006: catにstring型を明示 */}
                                    {mainCategories.map((cat: string) => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                            
                            {/* 小分類 */}
                            <div>
                                <select 
                                    value={subCategory} 
                                    onChange={e => setSubCategory(e.target.value)}
                                    disabled={!mainCategory}
                                    className="w-full p-3 border border-gray-300 rounded-lg bg-white disabled:bg-gray-100 focus:ring-2 focus:ring-red-400"
                                >
                                    <option value="">小分類（すべて）</option>
                                    {subCategoryOptions.map((sub: string) => <option key={sub} value={sub}>{sub}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* 3. エリア絞り込み */}
                    <div className="space-y-3 border-t pt-6">
                        <label className="font-bold text-lg text-gray-700 flex items-center mb-3">
                            <FaMapMarkerAlt className="mr-2 w-4 h-4 text-red-500"/>
                            エリアで絞り込む
                        </label>
                        <div className="flex flex-wrap gap-3">
                            {AREA_OPTIONS.map((opt: string) => (
                                <button
                                    key={opt}
                                    type="button"
                                    onClick={() => setArea(opt === area ? '' : opt)}
                                    className={`px-4 py-2 rounded-full border transition ${
                                        area === opt 
                                            ? 'bg-red-500 text-white border-red-600 shadow-md' 
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300'
                                    }`}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 検索ボタン */}
                    <button 
                        type="submit" 
                        className="w-full py-4 bg-red-600 text-white text-xl font-bold rounded-lg shadow-xl hover:bg-red-700 transition transform hover:scale-[1.01]"
                    >
                        条件に合った店舗を検索する
                    </button>
                </form>

            </div>
        </>
    );
};

export default SearchKeywordsPage;