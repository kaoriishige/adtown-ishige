import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router'; 
import Link from 'next/link'; 
import { Store, MapPin, ExternalLink, Sparkles, ArrowLeft } from 'lucide-react'; 

// 店舗データの型定義
type StoreInfo = {
    city: string;
    name: string;
    url: string;
};

// 提供された店舗情報
const storeData: StoreInfo[] = [
    { city: '那須塩原市・那須町', name: 'カワチ薬品 黒磯店', url: 'https://tokubai.co.jp/%E3%82%AB%E3%83%AF%E3%83%81%E8%96%AC%E5%93%81/76062' },
    { city: '那須塩原市・那須町', name: 'ウエルシア 那須塩原黒磯店', url: 'https://tokubai.co.jp/%E3%82%A6%E3%82%A8%E3%83%AB%E3%82%B7%E3%82%A2/297164' },
    { city: '那須塩原市・那須町', name: 'ドラッグストアコスモス 黒磯店', url: 'https://tokubai.co.jp/%E3%83%89%E3%83%A9%E3%83%83%E3%82%B0%E3%82%B9%E3%83%88%E3%82%A2%E3%82%B3%E3%82%B9%E3%83%A2%E3%82%B9/226216' },
    { city: '那須塩原市・那須町', name: 'ウエルシア 那須塩原黒磯幸町店', url: 'https://tokubai.co.jp/%E3%82%A6%E3%82%A8%E3%83%AB%E3%82%B7%E3%82%A2/297200' },
    { city: '那須塩原市・那須町', name: 'クスリのアオキ 上厚崎店', url: 'https://tokubai.co.jp/%E3%82%AF%E3%82%B9%E3%83%AA%E3%81%AE%E3%82%A2%E3%82%AA%E3%82%AD/170876' },
    { city: '那須塩原市・那須町', name: 'クスリのアオキ 豊住町店', url: 'https://tokubai.co.jp/%E3%82%AF%E3%82%B9%E3%83%AA%E3%81%AE%E3%82%A2%E3%82%AA%E3%82%AD/157018' },
    { city: '那須塩原市・那須町', name: 'カワチ薬品 那須塩原店', url: 'https://tokubai.co.jp/%E3%82%AB%E3%83%AF%E3%83%81%E8%96%AC%E5%93%81/264431' },
    { city: '那須塩原市・那須町', name: 'カワチ薬品 黒田原店', url: 'https://tokubai.co.jp/%E3%82%AB%E3%83%AF%E3%83%81%E8%96%AC%E5%93%81/264442' },
    { city: '那須塩原市・那須町', name: 'カワチ薬品 那須高原店', url: 'https://tokubai.co.jp/%E3%82%AB%E3%83%AF%E3%83%81%E8%96%AC%E5%93%81/76069' },
    { city: '那須塩原市・那須町', name: 'カワチ薬品 塩原関谷店', url: 'https://tokubai.co.jp/%E3%82%AB%E3%83%AF%E3%83%81%E8%96%AC%E5%93%81/264400' },
    { city: '那須塩原市・那須町', name: 'クスリのアオキ 一区町店', url: 'https://tokubai.co.jp/%E3%82%AF%E3%82%B9%E3%83%AA%E3%81%AE%E3%82%A2%E3%82%AA%E3%82%AD/286073' },
    { city: '那須塩原市・那須町', name: 'カワチ薬品 西那須野店', url: 'https://tokubai.co.jp/%E3%82%AB%E3%83%AF%E3%83%81%E8%96%AC%E5%93%81/76063' },
    { city: '那須塩原市・那須町', name: 'カワチ薬品 下永田店', url: 'https://tokubai.co.jp/%E3%82%AB%E3%83%AF%E3%83%81%E8%96%AC%E5%93%81/76065' },
    { city: '那須塩原市・那須町', name: 'ドラッグストアコスモス 下永田店', url: 'https://tokubai.co.jp/%E3%83%89%E3%83%A9%E3%83%83%E3%82%B0%E3%82%B9%E3%83%88%E3%82%A2%E3%82%B3%E3%82%B9%E3%83%A2%E3%82%B9/227745' },
    { city: '那須塩原市・那須町', name: 'ドラッグストアコスモス 西三島店', url: 'https://tokubai.co.jp/%E3%83%89%E3%83%A9%E3%83%83%E3%82%B0%E3%82%B9%E3%83%88%E3%82%A2%E3%82%B3%E3%82%B9%E3%83%A2%E3%82%B9/226601' },
    { city: '那須塩原市・那須町', name: 'クスリのアオキ 西那須野南町店', url: 'https://tokubai.co.jp/%E3%82%AF%E3%82%B9%E3%83%AA%E3%81%AE%E3%82%A2%E3%82%AA%E3%82%AD/127379' },
    { city: '那須塩原市・那須町', name: 'クスリのアオキ 太夫塚店', url: 'https://tokubai.co.jp/%E3%82%AF%E3%82%B9%E3%83%AA%E3%81%AE%E3%82%A2%E3%82%AA%E3%82%AD/174112' },
    { city: '那須塩原市・那須町', name: 'クスリのアオキ 三島店', url: 'https://tokubai.co.jp/%E3%82%AF%E3%82%B9%E3%83%AA%E3%81%AE%E3%82%A2%E3%82%AA%E3%82%AD/127133' },
    { city: '那須塩原市・那須町', name: 'ウエルシア 西那須野南郷屋店', url: 'https://tokubai.co.jp/%E3%82%A6%E3%82%A8%E3%83%AB%E3%82%B7%E3%82%A2/38515' },
    { city: '那須塩原市・那須町', name: 'サンドラッグ 西那須野店', url: 'https://tokubai.co.jp/%E3%82%B5%E3%83%B3%E3%83%89%E3%83%A9%E3%83%83%E3%82%B0/20881' },
    { city: '那須塩原市・那須町', name: 'カワチ薬品 大田原西店', url: 'https://tokubai.co.jp/%E3%82%AB%E3%83%AF%E3%83%81%E8%96%AC%E5%93%81/76064' },
    
    { city: '大田原市', name: 'サンドラッグ 大田原住吉店', url: 'https://tokubai.co.jp/%E3%82%B5%E3%83%B3%E3%83%89%E3%83%A9%E3%83%83%E3%82%B0/114992' },
    { city: '大田原市', name: 'クスリのアオキ 末広店', url: 'https://tokubai.co.jp/%E3%82%AF%E3%82%B9%E3%83%AA%E3%81%AE%E3%82%A2%E3%82%AA%E3%82%AD/174278' },
    { city: '大田原市', name: 'カワチ薬品 大田原南店', url: 'https://tokubai.co.jp/%E3%82%AB%E3%83%AF%E3%83%81%E8%96%AC%E5%93%81/76066' },
    { city: '大田原市', name: 'ウエルシア 大田原本町店', url: 'https://tokubai.co.jp/%E3%82%A6%E3%82%A8%E3%83%AB%E3%82%B7%E3%82%A2/38514' },
    { city: '大田原市', name: 'ドラッグストアコスモス 大田原住吉店', url: 'https://tokubai.co.jp/%E3%83%89%E3%83%A9%E3%83%83%E3%82%B0%E3%82%B9%E3%83%88%E3%82%A2%E3%82%B3%E3%82%B9%E3%83%A2%E3%82%B9/258702' },
    { city: '大田原市', name: 'クスリのアオキ 山の手店', url: 'https://tokubai.co.jp/%E3%82%AF%E3%82%B9%E3%83%AA%E3%81%AE%E3%82%A2%E3%82%AA%E3%82%AD/173728' },
    { city: '大田原市', name: 'ウエルシア アクロスプラザ大田原店', url: 'https://tokubai.co.jp/%E3%82%A6%E3%82%A8%E3%83%AB%E3%82%B7%E3%82%A2/297116' },
    { city: '大田原市', name: 'カワチ薬品 黒羽店', url: 'https://tokubai.co.jp/%E3%82%AB%E3%83%AF%E3%83%81%E8%96%AC%E5%93%81/76067' },
];

const groupedStores = storeData.reduce((acc: { [key: string]: StoreInfo[] }, store) => {
    if (!acc[store.city]) acc[store.city] = [];
    acc[store.city].push(store);
    return acc;
}, {});

const NasuFlyerApp = () => {
    const router = useRouter(); 

    // --- 別タブで開く関数 ---
    const openInNewTab = (url: string) => {
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
            <Head>
                <title>那須・大田原 ドラッグストアチラシ一覧</title>
            </Head>

            <header className="bg-white shadow-md sticky top-0 z-10 p-4 border-b border-gray-200">
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => router.back()} 
                            className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" /> 
                        </button>
                        <h1 className="text-xl font-extrabold text-blue-600 flex items-center gap-2">
                            <Store className="w-7 h-7" /> チラシNAVI
                        </h1>
                    </div>
                    
                    <Link 
                        href="/nasu/kondate" 
                        className="bg-green-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg hover:bg-green-700 transition flex items-center gap-2"
                    >
                        <Sparkles className="w-4 h-4" /> AI献立作成
                    </Link>
                </div>
            </header>
            
            <main className="max-w-3xl mx-auto p-4 pb-20">
                <div className="bg-blue-50 p-4 rounded-xl border-l-4 border-blue-500 mb-8 shadow-sm">
                    <p className="text-sm text-blue-800 font-bold">
                        店名を押すと新しいタブでチラシが開きます。確認後、この画面（タブ）に戻ってください。
                    </p>
                </div>

                {Object.entries(groupedStores).map(([city, stores]) => (
                    <section key={city} className="mb-10">
                        <h2 className="text-2xl font-extrabold text-gray-700 mb-5 flex items-center gap-3 border-b-4 border-blue-200 pb-2">
                            <MapPin className="w-6 h-6 text-blue-500" /> {city} エリア
                        </h2>
                        <div className="grid gap-4 sm:grid-cols-2">
                            {stores.map((store, index) => (
                                <button
                                    key={index}
                                    onClick={() => openInNewTab(store.url)} 
                                    className="block w-full text-left bg-white p-5 rounded-xl border border-gray-200 shadow hover:shadow-lg hover:border-blue-500 transition-all group"
                                >
                                    <div className="flex justify-between items-center">
                                        <span className="text-lg font-bold text-gray-800 group-hover:text-blue-600">
                                            {store.name}
                                        </span>
                                        <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </section>
                ))}
            </main>

            <footer className="bg-white border-t border-gray-200 py-6 text-center text-sm text-gray-500">
                <p>&copy; {new Date().getFullYear()} Flyer Navigator. | 情報元: トクバイ</p>
            </footer>
        </div>
    );
};

export default NasuFlyerApp;