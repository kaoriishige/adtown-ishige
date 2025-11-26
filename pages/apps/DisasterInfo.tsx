import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeft, MapPin, ExternalLink, Shield, AlertTriangle, X, BookOpen } from 'lucide-react';

// --- 各市の防災情報URL ---
const DISASTER_DATA = {
    "那須塩原市": {
        link: "https://www.city.nasushiobara.tochigi.jp/bosai_bohan/bosai/index.html",
        note: "防災情報トップページ、ハザードマップ、避難所情報"
    },
    "大田原市": {
        link: "https://www.city.ohtawara.tochigi.jp/docs/2013082770929/",
        note: "防災・危機管理情報、各種計画、防災ガイド"
    },
    "那須町": {
        link: "https://www.town.nasu.lg.jp/index2.html",
        note: "那須町役場トップページ（緊急情報、防災・安全の確認）"
    }
};

export default function DisasterInfoApp() {
    const [isGuideOpen, setIsGuideOpen] = useState(false);

    const handleGoCategories = () => {
        window.location.href = '/apps/categories';
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans pb-20">
            <Head><title>地域防災情報ナビ</title></Head>

            {/* ヘッダー */}
            <header className="bg-white shadow-sm sticky top-0 z-10 p-4 border-b border-gray-200">
                <div className="max-w-xl mx-auto flex items-center justify-between">
                    <button onClick={handleGoCategories} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft size={20} className="text-gray-600" />
                    </button>
                    
                    <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Shield className="w-6 h-6 text-red-600" />
                        地域防災情報ナビ
                    </h1>
                    
                    <button 
                        onClick={() => setIsGuideOpen(true)} 
                        className="text-sm text-blue-600 hover:text-blue-800 border border-blue-600 hover:border-blue-800 rounded-full px-3 py-1 transition-colors flex items-center gap-1"
                    >
                        <BookOpen size={16} />使い方
                    </button>
                </div>
            </header>

            <main className="max-w-xl mx-auto p-4 sm:p-6">
                
                <p className="text-gray-600 mb-6 bg-yellow-50 p-4 rounded-xl shadow-sm border border-yellow-200 text-sm flex items-start gap-3">
                    <AlertTriangle size={20} className="text-yellow-700 flex-shrink-0" />
                    お住まいの市町の最新の防災情報（避難所、ハザードマップ、防災計画）は、必ず公式サイトでご確認ください。
                </p>

                {/* 各市町のリンクボタン */}
                <section className="space-y-4">
                    {Object.entries(DISASTER_DATA).map(([city, data]) => (
                        <a 
                            key={city}
                            href={data.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block bg-white p-5 rounded-xl shadow-md border border-gray-200 transition transform hover:-translate-y-0.5 hover:shadow-lg"
                        >
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-red-500" />
                                    {city}
                                </h2>
                                <ExternalLink className="w-5 h-5 text-blue-500" />
                            </div>
                            <p className="text-sm text-gray-600 mt-2">{data.note}</p>
                        </a>
                    ))}
                </section>
                
            </main>
            
            {/* 使い方ガイドモーダル */}
            {isGuideOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
                        <div className="p-4 border-b flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-800">使い方ガイド</h2>
                            <button onClick={() => setIsGuideOpen(false)} className="text-gray-500 hover:text-gray-800">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto text-sm">
                            <p className="text-gray-700">
                                このアプリは、那須地域の各市町の**防災情報トップページ**へ誘導します。
                            </p>

                            <div className="border-t pt-3">
                                <h4 className="font-bold text-base mb-2 flex items-center gap-1"><MapPin size={18} className="text-red-500"/> 利用上の注意</h4>
                                <ul className="list-disc list-inside ml-4 space-y-1 text-gray-700">
                                    <li>災害時は通信状況が悪化することがあります。</li>
                                    <li>防災情報は非常に重要であるため、常に公式サイトで最終確認を行ってください。</li>
                                </ul>
                            </div>
                        </div>
                        <div className="p-4 border-t text-center">
                            <button onClick={() => setIsGuideOpen(false)} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg shadow-md">
                                閉じる
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <footer className="text-center py-6 text-xs text-gray-400">
                © 2025 みんなの那須アプリ
            </footer>
        </div>
    );
}