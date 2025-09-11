import { NextPage } from 'next';
import { useState, useEffect } from 'react';
import Link from 'next/link';

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

interface Store {
    id: string;
    storeName: string;
    address: string;
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
                <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
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

                <div className="mt-8">
                    {isLoading ? (
                        <p className="text-center">検索中...</p>
                    ) : searched && stores.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {stores.map(store => (
                                // ▼▼▼ The link has been corrected here (/store/ -> /stores/) ▼▼▼
                                // ▼▼▼ 最終確認のためのコメント ▼▼▼
                                <Link key={store.id} href={`/stores/${store.id}`} legacyBehavior>
                                    <a className="block bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer">
                                        <h2 className="text-xl font-bold">{store.storeName}</h2>
                                        <p className="text-gray-600 mt-2">{store.address}</p>
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