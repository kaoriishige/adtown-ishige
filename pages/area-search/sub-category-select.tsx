// pages/area-search/sub-category-select.tsx

import { NextPage } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { RiArrowLeftLine, RiStoreLine, RiCoupon3Line } from "react-icons/ri";

// ★ ダミーデータ: 店舗リスト 
interface Store {
    id: string;
    storeName: string;
    description: string;
    area: string;
    mainCategory: string;
    subCategory: string;
}

const DUMMY_STORES: Store[] = [
    { id: 'DOkAkzjVFJEk1A3PEOCw', storeName: 'サクセス研究社コンサルティング', description: 'AIとコンサルティングを融合した課題解決サービスを提供。', area: '那須塩原市', mainCategory: '専門サービス関連', subCategory: 'コンサルティング' },
    { id: '2', storeName: '丸山食堂', description: '地元食材を使ったイタリアンが人気。', area: '那須塩塩原市', mainCategory: '飲食関連', subCategory: 'レストラン・食堂' },
    { id: '3', storeName: 'アニマル病院', description: 'ペットの緊急治療に対応します。', area: '那須塩原市', mainCategory: 'ペット関連', subCategory: '動物病院' },
    { id: '4', storeName: 'おしゃれ美容室', description: 'ショートカットと透明感カラーが得意。', area: '那須町', mainCategory: '美容・健康関連', subCategory: '美容室' },
    { id: '5', storeName: '学習塾アップ', description: '徹底した個別指導の学習塾です。', area: '那須塩原市', mainCategory: '教育・習い事関連', subCategory: '学習塾・家庭教師' },
];

// ★★★ 修正: ご提示の画像に完全に合わせた公式小カテゴリリスト ★★★
const SUB_CATEGORY_DATA: { [key: string]: string[] } = {
    // 飲食関連
    "飲食関連": ["レストラン・食堂", "カフェ・喫茶店", "居酒屋", "バー", "パン屋（ベーカリー）", "和菓子・洋菓子店", "ラーメン店", "そば・うどん店", "寿司屋", "惣菜・仕出し・ケータリング", "テイクアウト専門店", "その他"],
    
    // 買い物関連
    "買い物関連": ["農産物直売所", "鮮魚店", "雑貨店・民芸品店", "花屋", "お土産品店", "リサイクルショップ", "道の駅・特産品店", "その他"],
    
    // 美容・健康関連
    "美容・健康関連": ["美容室", "ネイルサロン", "エステサロン", "リラクゼーション", "マッサージ", "整体・整骨院・鍼灸院", "カイロプラクティック", "クリニック・歯科医院", "薬局・ドラッグストア", "その他"],
    
    // 住まい・暮らし関連
    "住まい・暮らし関連": ["工務店・建築・リフォーム", "リフォーム専門店", "水道・電気工事業", "不動産会社", "造園・植木屋", "ハウスクリーニング", "家電修理・メンテナンス", "便利屋", "その他"],
    
    // 教育・習い事関連
    "教育・習い事関連": ["学習塾・家庭教師", "ピアノ・音楽教室", "英会話教室", "書道・そろばん教室", "ダンス教室", "スポーツクラブ・道場", "パソコン教室", "料理教室", "学童保育", "その他"],
    
    // スポーツ関連
    "スポーツ関連": ["スポーツ施設・ジム", "ゴルフ練習場", "フィットネス・ヨガ", "スポーツ用品店", "武道・格闘技道場", "その他"],
    
    // 車・バイク関連
    "車・バイク関連": ["自動車販売（新車・中古）", "自動車整備・修理工場", "ガソリンスタンド", "カー用品店", "バイクショップ", "その他"],
    
    // 観光・レジャー関連
    "観光・レジャー関連": ["ホテル・旅館・ペンション", "日帰り温泉施設", "観光施設・美術館・博物館", "体験工房（陶芸・ガラスなど）", "牧場・農園", "キャンプ場・グランピング施設", "ゴルフ場", "貸し別荘", "乗馬・アクティビティ体験", "釣り堀・アウトドア体験", "観光ガイド・地域案内", "その他"],
    
    // ペット関連
    "ペット関連": ["動物病院", "トリミングサロン", "ペットホテル・ドッグラン", "ブリーダー", "動物カフェ", "その他"],
    
    // 専門サービス関連
    "専門サービス関連": ["弁護士・税理士・行政書士などの士業", "デザイン・印刷会社", "写真館", "Web制作・動画制作", "翻訳・通訳サービス", "保険代理店", "カウンセリング", "コンサルティング", "その他"],
    
    // その他
    "その他": ["イベント", "NPO", "地域活動"]
};
// ★★★ 修正ここまで ★★★

const SubCategorySelectPage: NextPage = () => {
    const router = useRouter();
    const { area, mainCategory, subCategory } = router.query; 

    const currentArea = typeof area === 'string' ? area : '';
    const currentMainCategory = typeof mainCategory === 'string' ? mainCategory : '';
    const currentSubCategory = typeof subCategory === 'string' ? subCategory : '';

    const subCategories = SUB_CATEGORY_DATA[currentMainCategory] || [];

    // 現在の絞り込み条件に一致する店舗
    const filteredStores = DUMMY_STORES.filter(store => 
        store.area === currentArea && 
        store.mainCategory === currentMainCategory &&
        (!currentSubCategory || store.subCategory === currentSubCategory)
    );

    // 小カテゴリが選択されている場合のみ店舗一覧を表示する
    const shouldShowStoreList = !!currentSubCategory; 


    return (
        <>
            <Head>
                <title>{currentArea} の店舗一覧</title>
            </Head>
            <div className="max-w-xl mx-auto p-4">
                
                {/* 戻るボタン */}
                <button 
                    onClick={() => router.back()} 
                    className="p-2 rounded-full hover:bg-gray-100 mb-6 flex items-center text-gray-700 font-semibold"
                >
                    <RiArrowLeftLine className="w-5 h-5 mr-2" />
                    {currentSubCategory ? '絞り込みを解除' : '大カテゴリ選択'}に戻る
                </button>

                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                    {currentArea} / {currentMainCategory}
                    {currentSubCategory && ` / ${currentSubCategory}`}
                </h1>
                <p className="text-gray-600 mb-6">
                    {currentSubCategory ? '以下の店舗が絞り込まれました。' : '小カテゴリで絞り込んでください。'}
                </p>

                {/* 🔽 小カテゴリ絞り込みボタン (サブカテゴリがある場合のみ表示) 🔽 */}
                {subCategories.length > 0 && (
                    <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="font-semibold text-blue-800 mb-3 flex items-center">
                            <RiCoupon3Line className="mr-2 w-5 h-5" /> 小カテゴリでさらに絞り込む
                        </p>
                        <div className="flex flex-wrap gap-3">
                            {subCategories.map((subCat) => {
                                const isActive = currentSubCategory === subCat;
                                return (
                                    <Link
                                        key={subCat}
                                        // リンク: クリックで同じページにクエリを追加 (選択済みの場合は解除)
                                        href={`/area-search/sub-category-select?area=${currentArea}&mainCategory=${currentMainCategory}&subCategory=${isActive ? '' : subCat}`}
                                        legacyBehavior
                                    >
                                        <a className={`px-3 py-1 text-sm rounded-full transition-colors ${
                                            isActive 
                                                ? 'bg-indigo-600 text-white font-bold' 
                                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                                        }`}>
                                            {subCat}
                                        </a>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                )}
                
                {/* 🔽 店舗一覧 (小カテゴリ選択後のみ表示) 🔽 */}
                {shouldShowStoreList && (
                    <div className="space-y-4">
                        {filteredStores.map((store) => (
                            <Link 
                                key={store.id} 
                                // ★ 最終リンク先: ランディングページ（/stores/view/ストアID）
                                href={`/stores/view/${store.id}`} 
                                legacyBehavior
                            >
                                <a className="flex flex-col p-4 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow border-l-4 border-green-500">
                                    <span className="text-xs text-gray-500 font-medium mb-1">
                                        {store.mainCategory} {store.subCategory && ` / ${store.subCategory}`}
                                    </span>
                                    <h3 className="font-bold text-xl text-gray-800 flex items-center">
                                        <RiStoreLine className="w-5 h-5 mr-2 text-green-600" />
                                        {store.storeName}
                                    </h3>
                                    <p className="text-sm text-gray-600 mt-1 truncate">
                                        {store.description}
                                    </p>
                                </a>
                            </Link>
                        ))}

                        {filteredStores.length === 0 && (
                            <p className="text-center text-gray-500 mt-10 p-4 border rounded-lg bg-white">
                                該当する店舗は見つかりませんでした。
                            </p>
                        )}
                    </div>
                )}
            </div>
        </>
    );
};

export default SubCategorySelectPage;