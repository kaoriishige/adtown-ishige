// pages/area-search/[area].tsx

import { NextPage } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { RiArrowLeftLine, RiGridFill } from "react-icons/ri";

// ★★★ 最終版: 公式な大カテゴリリストの順序と内容に完全に一致 ★★★
const OFFICIAL_MAIN_CATEGORIES = [
    "飲食関連",
    "買い物関連",
    "美容・健康関連",
    "住まい・暮らし関連",
    "教育・習い事関連",
    "スポーツ関連",
    "車・バイク関連",
    "観光・レジャー関連",
    "ペット関連",
    "専門サービス関連",
    "その他"
];

// エリアごとのカテゴリリスト（全エリアで11種類すべてを表示）
const CATEGORY_DATA: { [key: string]: string[] } = {
    "那須塩原市": [...OFFICIAL_MAIN_CATEGORIES],
    "大田原市": [...OFFICIAL_MAIN_CATEGORIES],
    "那須町": [...OFFICIAL_MAIN_CATEGORIES],
    "その他": [...OFFICIAL_MAIN_CATEGORIES]
};
// ★★★ 修正ここまで ★★★

const AreaCategorySelectPage: NextPage = () => {
    const router = useRouter();
    const { area } = router.query; 

    if (!area || typeof area !== 'string') {
        return <div className="p-4 text-center text-red-500">エリアが指定されていません。</div>;
    }

    const unsortedCategories = CATEGORY_DATA[area] || [];
    
    // 順序合わせのロジック
    const mainCategories = unsortedCategories.sort((a, b) => 
        OFFICIAL_MAIN_CATEGORIES.indexOf(a) - OFFICIAL_MAIN_CATEGORIES.indexOf(b)
    );

    return (
        <>
            <Head>
                <title>{area} の大カテゴリ選択</title>
            </Head>
            <div className="max-w-xl mx-auto p-4">
                
                {/* 戻るボタン */}
                <button 
                    onClick={() => router.back()} 
                    className="p-2 rounded-full hover:bg-gray-100 mb-6 flex items-center text-gray-700 font-semibold"
                >
                    <RiArrowLeftLine className="w-5 h-5 mr-2" />
                    エリア選択に戻る
                </button>

                <h1 className="text-2xl font-bold text-gray-800 mb-6">
                    「{area}」で探す
                </h1>
                <p className="text-gray-600 mb-8">
                    🔍 検索したい大カテゴリを選択してください。
                </p>

                <div className="space-y-4">
                    {mainCategories.map((category) => (
                        <Link 
                            key={category} 
                            // ★★★ リンク先: 小カテゴリ選択・店舗一覧ページへ（正しい遷移） ★★★
                            href={`/area-search/sub-category-select?area=${area}&mainCategory=${category}`} 
                            legacyBehavior
                        >
                            <a className="flex items-center p-4 bg-white rounded-lg shadow-md border-l-4 border-indigo-500 hover:bg-indigo-50 transition-colors">
                                <RiGridFill className="w-6 h-6 mr-3 text-indigo-600" />
                                <span className="font-semibold text-lg">{category}</span>
                            </a>
                        </Link>
                    ))}
                </div>

                {mainCategories.length === 0 && (
                    <p className="text-center text-gray-500 mt-10">
                        このエリアには現在、カテゴリが登録されていません。
                    </p>
                )}
            </div>
        </>
    );
};

export default AreaCategorySelectPage;