import React, { useState } from 'react';
import Head from 'next/head';
import { ArrowLeft, MapPin, ExternalLink, Gift, X, BookOpen, User } from 'lucide-react';

// --- 各市の子育て情報URL ---
const PARENTING_DATA = {
    "那須塩原市": {
        link: "https://www.city.nasushiobara.tochigi.jp/kosodate_kyoiku/index.html",
        note: "子育て・教育に関する情報トップページ"
    },
    "大田原市": {
        link: "https://www.city.ohtawara.tochigi.jp/lifeevent/child.html",
        note: "子育てに関する情報（出産、手当、保育園など）"
    },
    "那須町": {
        link: "https://www.town.nasu.lg.jp/0138/genre2-1-001.html",
        note: "子育て支援トップページ、各種助成金情報"
    }
};

export default function ParentingInfoApp() {
    const [isGuideOpen, setIsGuideOpen] = useState(false);
    // 外部サイト表示用のステート
    const [externalUrl, setExternalUrl] = useState(null);

    const handleGoCategories = () => {
        window.location.href = '/premium/dashboard';
    };

    // 外部サイトを開く
    const openExternalSite = (url) => {
        setExternalUrl(url);
    };

    // 外部サイトを閉じて一覧に戻る
    const closeExternalSite = () => {
        setExternalUrl(null);
    };

    // 外部サイト閲覧モードのレンダリング
    if (externalUrl) {
        return (
            <div className="fixed inset-0 z-50 bg-white flex flex-col">
                <div className="bg-white border-b p-3 flex items-center shadow-sm">
                    <button
                        onClick={closeExternalSite}
                        className="flex items-center gap-2 text-blue-600 font-bold hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors"
                    >
                        <ArrowLeft size={24} />
                        <span>アプリに戻る</span>
                    </button>
                    <div className="ml-4 text-xs text-gray-400 truncate flex-1 text-right">
                        外部サイトを閲覧中
                    </div>
                </div>
                <iframe
                    src={externalUrl}
                    className="flex-1 w-full border-none"
                    title="外部子育て情報"
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans pb-20">
            <Head><title>子育て支援情報ナビ</title></Head>

            {/* ヘッダー */}
            <header className="bg-white shadow-sm sticky top-0 z-10 p-4 border-b border-gray-200">
                <div className="max-w-xl mx-auto flex items-center justify-between">
                    <button onClick={handleGoCategories} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft size={20} className="text-gray-600" />
                    </button>

                    <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Gift className="w-6 h-6 text-pink-500" />
                        子育て支援情報ナビ
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

                <p className="text-gray-600 mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-sm">
                    お住まいの市町を選択してください。妊娠・出産、各種手当、保育園/幼稚園、医療など、子育てに関する行政情報へのリンクを提供します。
                </p>

                {/* 各市町のリンクボタン */}
                <section className="space-y-4">
                    {Object.entries(PARENTING_DATA).map(([city, data]) => (
                        <button
                            key={city}
                            onClick={() => openExternalSite(data.link)}
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

            {/* 使い方ガイドモーダル（省略なし） */}
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
                                このアプリは、那須地域にお住まいの方を対象に、各市町の公式サイトへ直接リンクしています。
                            </p>
                            <div className="border-t pt-3">
                                <h4 className="font-bold text-base mb-2 flex items-center gap-1"><User size={18} className="text-pink-500" /> 利用方法</h4>
                                <ul className="list-disc list-inside ml-4 space-y-1 text-gray-700">
                                    <li>お住まいの市町のボタンをクリックしてください。</li>
                                    <li>各自治体のサイトをアプリ内で表示します。</li>
                                    <li>左上の「← アプリに戻る」ボタンでいつでも戻れます。</li>
                                </ul>
                            </div>
                        </div>
                        <div className="p-4 border-t text-center">
                            <button onClick={() => setIsGuideOpen(false)} className="bg-pink-600 hover:bg-pink-700 text-white font-bold py-2 px-6 rounded-lg shadow-md">
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