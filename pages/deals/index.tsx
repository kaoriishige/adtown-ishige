'use client';
import { NextPage } from 'next';
import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';

// カテゴリ型定義
type CategoryKey =
  | "飲食関連"
  | "買い物関連"
  | "美容・健康関連"
  | "住まい・暮らし関連"
  | "教育・習い事関連"
  | "車・バイク関連"
  | "観光・レジャー関連"
  | "ペット関連"
  | "専門サービス関連"
  | "その他";

// パートナー登録画面と一致させたカテゴリデータ
const categoryData: Record<CategoryKey, string[]> = {
  "飲食関連": ["レストラン・食堂", "カフェ・喫茶店", "居酒屋・バー", "パン屋（ベーカリー）", "和菓子・洋菓子店", "ラーメン店", "そば・うどん店", "寿司屋"],
  "買い物関連": ["農産物直売所・青果店", "精肉店・鮮魚店", "個人経営の食料品店", "酒店", "ブティック・衣料品店", "雑貨店・民芸品店", "書店", "花屋", "お土産店"],
  "美容・健康関連": ["美容室・理容室", "ネイルサロン", "エステサロン", "リラクゼーション・マッサージ", "整体・整骨院・鍼灸院", "個人経営の薬局", "クリニック・歯科医院"],
  "住まい・暮らし関連": ["工務店・建築・リフォーム", "水道・電気工事", "不動産会社", "クリーニング店", "造園・植木屋", "便利屋"],
  "教育・習い事関連": ["学習塾・家庭教師", "ピアノ・音楽教室", "英会話教室", "書道・そろばん教室", "スポーツクラブ・道場", "パソコン教室", "料理教室"],
  "車・バイク関連": ["自動車販売店・自動車整備・修理工場", "ガソリンスタンド", "バイクショップ"],
  "観光・レジャー関連": ["ホテル・旅館・ペンション", "日帰り温泉施設", "観光施設・美術館・博物館", "体験工房（陶芸・ガラスなど）", "牧場・農園", "キャンプ場・グランピング施設", "ゴルフ場", "貸し別荘"],
  "ペット関連": ["動物病院", "トリミングサロン", "ペットホテル・ドッグラン"],
  "専門サービス関連": ["弁護士・税理士・行政書士などの士業", "デザイン・印刷会社", "写真館", "保険代理店", "カウンセリング", "コンサルティング"],
  "その他": ["その他"],
};

const mainCategories = Object.keys(categoryData) as CategoryKey[];

const DealsCategoryPage: NextPage = () => {
  const router = useRouter();
  const [expandedCategory, setExpandedCategory] = useState<CategoryKey | null>(null);

  const handleCategoryClick = (category: CategoryKey) => {
    if (category === 'その他') {
      router.push(`/deals/select-area?main=${encodeURIComponent(category)}&sub=${encodeURIComponent('その他')}`);
      return;
    }
    setExpandedCategory(prev => (prev === category ? null : category));
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Head>
        <title>カテゴリ選択 - 地域のお店を探す</title>
      </Head>

      <header className="bg-white p-4 text-center sticky top-0 z-10 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800">地域のお店を探す</h1>
        <p className="text-gray-600 mt-1">カテゴリを選択してください</p>
      </header>

      <main className="p-4 max-w-4xl mx-auto">
        <div className="text-center my-4">
          <button
            onClick={() => router.push('/home')}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg text-sm"
          >
            ← ホームに戻る
          </button>
        </div>

        <div className="space-y-4">
          {mainCategories.map(mainCat => (
            <div key={mainCat}>
              <button
                onClick={() => handleCategoryClick(mainCat)}
                className="w-full p-5 bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 text-left flex justify-between items-center"
              >
                <span className="text-xl font-bold text-gray-800">{mainCat}</span>
                {mainCat !== 'その他' && (
                  <span
                    className={`transform transition-transform duration-300 ${
                      expandedCategory === mainCat ? 'rotate-180' : ''
                    }`}
                  >
                    ▼
                  </span>
                )}
              </button>

              {mainCat !== 'その他' && (
                <div
                  className={`overflow-hidden transition-all duration-500 ease-in-out ${
                    expandedCategory === mainCat ? 'max-h-96 mt-2' : 'max-h-0'
                  }`}
                >
                  <div className="p-4 bg-gray-100 rounded-b-lg grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {categoryData[mainCat].map((subCat) => (
                      <Link
                        key={subCat}
                        href={`/deals/select-area?main=${encodeURIComponent(mainCat)}&sub=${encodeURIComponent(subCat)}`}
                        className="block p-3 bg-white text-gray-700 rounded-md hover:bg-blue-500 hover:text-white transition-colors"
                      >
                        {subCat}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default DealsCategoryPage;
