import { NextPage } from 'next';
import { useState, useEffect } from 'react';
import Link from 'next/link';

// カテゴリデータ (変更なし)
const categoryData = {
  "飲食関連": ["レストラン・食堂", "カフェ・喫茶店", "居酒屋・バー", "パン屋（ベーカリー）", "和菓子・洋菓子店", "ラーメン店", "そば・うどん店", "寿司屋"],
  "買い物関連": ["農産物直売所・青果店", "精肉店・鮮魚店", "個人経営の食料品店", "酒店", "ブティック・衣料品店", "雑貨店・民芸品店", "書店", "花屋", "お土産店"],
  "美容・健康関連": ["美容室・理容室", "ネイルサロン", "エステサロン", "リラクゼーション・マッサージ", "整体・整骨院・鍼灸院", "個人経営の薬局", "クリニック・歯科医院"],
  "住まい・暮らし関連": ["工務店・建築・リフォーム", "水道・電気工事", "不動産会社", "クリーニング店", "造園・植木屋", "便利屋"],
  "教育・習い事関連": ["学習塾・家庭教師", "ピアノ・音楽教室", "英会話教室", "書道・そろばん教室", "スポーツクラブ・道場", "パソコン教室", "料理教室"],
  "車・バイク関連": ["自動車販売店・自動車整備・修理工場", "ガソリンスタンド", "バイクショップ"],
  "観光・レジャー関連": ["ホテル・旅館・ペンション", "日帰り温泉施設", "観光施設・美術館・博物館", "体験工房（陶芸・ガラスなど）", "牧場・農園", "キャンプ場・グランピング施設", "ゴルフ場", "貸し別荘"],
  "ペット関連": ["動物病院", "トリミングサロン", "ペットホテル・ドッグラン"],
  "専門サービス関連": ["弁護士・税理士・行政書士などの士業", "デザイン・印刷会社", "写真館", "保険代理店", "カウンセリング", "コンサルティング"],
};
const mainCategories = Object.keys(categoryData);
const areas = ["那須塩原市", "大田原市", "那須町"];

// APIから受け取るデータの型
interface Store {
    id: string;
    storeName: string;
    address: string;
    galleryImageUrls?: string[];
    budgetDinner?: string;
    budgetLunch?: string;
}

const DealsSearchPage: NextPage = () => {
    const [mainCategory, setMainCategory] = useState('');
    const [subCategory, setSubCategory] = useState('');
    const [area, setArea] = useState('');
    const [subCategoryOptions, setSubCategoryOptions] = useState<string[]>([]);
    
    const [stores, setStores] = useState<Store[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (mainCategory) {
            // @ts-ignore
            setSubCategoryOptions(categoryData[mainCategory] || []);
            setSubCategory('');
        } else {
            setSubCategoryOptions([]);
        }
    }, [mainCategory]);

    const handleSearch = async () => {
        if (!mainCategory || !subCategory || !area) {
            setError("すべての項目を選択してください。");
            return;
        }
        setIsLoading(true);
        setSearched(true);
        setError(null);
        setStores([]);

        try {
            const response = await fetch(`/api/deals/search?mainCategory=${mainCategory}&subCategory=${subCategory}&area=${area}`);
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || "検索に失敗しました。");
            }
            setStores(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <header className="text-center py-6">
                <h1 className="text-2xl font-bold text-gray-800">お店を探す</h1>
            </header>
            <main className="max-w-4xl mx-auto">
                {/* ▼▼▼ 前回私が削除してしまった検索フィルター部分を元に戻しました ▼▼▼ */}
                <div className="bg-white p-6 rounded-lg shadow-md space-y-4 mb-8">
                    <select value={mainCategory} onChange={e => setMainCategory(e.target.value)} className="w-full p-2 border rounded">
                        <option value="">大分類を選択</option>
                        {mainCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    {mainCategory && (
                        <select value={subCategory} onChange={e => setSubCategory(e.target.value)} className="w-full p-2 border rounded">
                            <option value="">小分類を選択</option>
                            {subCategoryOptions.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                        </select>
                    )}
                    <select value={area} onChange={e => setArea(e.target.value)} className="w-full p-2 border rounded">
                        <option value="">エリアを選択</option>
                        {areas.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                    <button onClick={handleSearch} disabled={isLoading} className="w-full p-3 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 disabled:bg-blue-400">
                        {isLoading ? '検索中...' : 'この条件で探す'}
                    </button>
                    {error && <p className="text-red-500 text-center">{error}</p>}
                </div>

                {/* 検索結果の表示 */}
                <div className="mt-8">
                    {isLoading ? (
                        <p className="text-center">検索中...</p>
                    ) : searched && stores.length > 0 ? (
                        <div className="space-y-6">
                            {stores.map(store => (
                                <Link key={store.id} href={`/stores/${store.id}`} legacyBehavior>
                                    <a className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden block">
                                        {/* 画像セクション (3枚表示) */}
                                        <div className="flex bg-gray-200">
                                            {(store.galleryImageUrls && store.galleryImageUrls.length > 0) ? (
                                                store.galleryImageUrls.slice(0, 3).map((url, index) => (
                                                    <div key={index} className="w-1/3 h-40">
                                                        <img src={url} alt={`${store.storeName} ${index + 1}`} className="h-full w-full object-cover" />
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="w-full h-40 flex items-center justify-center">
                                                    <span className="text-gray-400 text-sm">NO IMAGE</span>
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* 情報セクション */}
                                        <div className="p-4">
                                            <h2 className="text-xl font-bold text-gray-800 truncate">{store.storeName}</h2>
                                            <div className="text-sm text-gray-500 my-2">
                                                <span>⭐ (口コミ評価は後ほど実装)</span>
                                            </div>
                                            <p className="text-xs text-gray-600 truncate">{store.address}</p>
                                            <div className="mt-4 border-t pt-2 text-sm text-gray-700">
                                                {store.budgetDinner && <p>夜: <span className="font-bold text-red-600">{store.budgetDinner}</span></p>}
                                                {store.budgetLunch && <p>昼: <span className="font-bold text-orange-600">{store.budgetLunch}</span></p>}
                                            </div>
                                        </div>
                                    </a>
                                </Link>
                            ))}
                        </div>
                    ) : searched && (
                        <p className="text-center bg-white p-8 rounded-lg shadow-md">この条件に合う店舗は見つかりませんでした。</p>
                    )}
                </div>
            </main>
        </div>
    );
};

export default DealsSearchPage;