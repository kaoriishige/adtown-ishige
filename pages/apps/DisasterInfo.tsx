import React, { useState } from 'react';
import Head from 'next/head';
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
        note: "那須町 役場ポータル（防災・緊急情報）"
    }
};

export default function DisasterInfoApp() {
    const [isGuideOpen, setIsGuideOpen] = useState(false);
    // 外部サイト表示管理用のステート
    const [viewingUrl, setViewingUrl] = useState(null);

    const handleGoCategories = () => {
        window.location.href = '/premium/dashboard';
    };

    // 外部サイト閲覧モードのレンダリング
    if (viewingUrl) {
        return (
            <div className="fixed inset-0 z-50 bg-white flex flex-col">
                <div className="bg-red-50 border-b border-red-200 p-3 flex items-center shadow-md">
                    <button
                        onClick={() => setViewingUrl(null)}
                        className="flex items-center gap-2 text-red-700 font-bold hover:bg-red-100 px-4 py-2 rounded-lg transition-colors border border-red-300 bg-white"
                    >
                        <ArrowLeft size={24} />
                        <span>アプリに戻る</span>
                    </button>
                    <div className="ml-4 text-xs text-red-600 font-medium flex-1 text-right">
                        那須地域 防災公式サイトを閲覧中
                    </div>
                </div>
                <iframe
                    src={viewingUrl}
                    className="flex-1 w-full border-none"
                    title="防災情報詳細"
                />
            </div>
        );
    }

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
                        <button
                            key={city}
                            onClick={() => setViewingUrl(data.link)}
                            className="w-full text-left block bg-white p-5 rounded-xl shadow-md border border-gray-200 transition transform hover:-translate-y-0.5 hover:shadow-lg"
                        >
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-red-500" />
                                    {city}
                                </h2>
                                <ExternalLink className="w-5 h-5 text-blue-500" />
                            </div>
                            <p className="text-sm text-gray-600 mt-2">{data.note}</p>
                        </button>
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
                                このアプリは、那須地域の各市町の**防災情報トップページ**をアプリ内で表示します。
                            </p>

                            <div className="border-t pt-3">
                                <h4 className="font-bold text-base mb-2 flex items-center gap-1"><MapPin size={18} className="text-red-500" /> 利用上の注意</h4>
                                <ul className="list-disc list-inside ml-4 space-y-1 text-gray-700">
                                    <li>左上の「← アプリに戻る」ボタンで、いつでもこの画面に戻ることができます。</li>
                                    <li>災害時は通信状況が悪化することがあります。重要な情報は事前にスクリーンショット等で保存することをお勧めします。</li>
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
                © 2026 みんなの那須アプリ
            </footer>
        </div>
    );
}