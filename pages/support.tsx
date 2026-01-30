import React from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function SupportPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
            <Head>
                <title>サポート・お問い合わせ | みんなのNasuアプリ</title>
                <meta name="description" content="みんなのNasuアプリのサポート・お問い合わせ" />
            </Head>

            <div className="max-w-4xl mx-auto px-6 py-20">
                {/* ヘッダー */}
                <div className="text-center mb-16">
                    <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-4 tracking-tight">
                        SUPPORT
                    </h1>
                    <p className="text-slate-600 font-bold text-lg">サポート・お問い合わせ</p>
                </div>

                {/* コンテンツ */}
                <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 p-10 md:p-16">
                    <div className="space-y-12">
                        {/* LINEサポート */}
                        <div className="text-center">
                            <div className="inline-block bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-3 rounded-full mb-6">
                                <p className="font-black text-sm uppercase tracking-wider">おすすめ</p>
                            </div>
                            <h2 className="text-3xl font-black text-slate-900 mb-6">
                                LINEで簡単サポート
                            </h2>
                            <p className="text-slate-600 font-bold text-lg mb-8 leading-relaxed">
                                LINEでお気軽にお問い合わせください。<br />
                                運用に関する疑問に即回答いたします。
                            </p>
                            <div className="flex justify-center">
                                <a href="https://lin.ee/2D8mNgk" target="_blank" rel="noopener noreferrer">
                                    <img
                                        src="https://scdn.line-apps.com/n/line_add_friends/btn/ja.png"
                                        alt="友だち追加"
                                        height="36"
                                        className="hover:opacity-80 transition-opacity"
                                    />
                                </a>
                            </div>
                        </div>

                        <div className="border-t border-slate-200 pt-12">
                            <h2 className="text-2xl font-black text-slate-900 mb-8 text-center">
                                その他のお問い合わせ方法
                            </h2>

                            <div className="space-y-6">
                                {/* 電話 */}
                                <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0 w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center text-white text-2xl">
                                            📞
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-xl font-black text-slate-900 mb-2">電話</h3>
                                            <p className="text-slate-900 font-bold text-2xl mb-2">
                                                <a href="tel:0287397577" className="hover:text-orange-600 transition-colors">
                                                    0287-39-7577
                                                </a>
                                            </p>
                                            <p className="text-slate-600 font-bold text-sm">
                                                受付時間：平日 10:00〜17:00
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* メール */}
                                <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0 w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center text-white text-2xl">
                                            ✉️
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-xl font-black text-slate-900 mb-2">メール</h3>
                                            <p className="text-slate-900 font-bold text-xl mb-2">
                                                <a href="mailto:adtown@able.ocn.ne.jp" className="hover:text-orange-600 transition-colors break-all">
                                                    adtown@able.ocn.ne.jp
                                                </a>
                                            </p>
                                            <p className="text-slate-600 font-bold text-sm">
                                                24時間受付（返信は営業時間内）
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* 所在地 */}
                                <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0 w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center text-white text-2xl">
                                            📍
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-xl font-black text-slate-900 mb-2">所在地</h3>
                                            <p className="text-slate-900 font-bold text-lg leading-relaxed">
                                                〒329-2711<br />
                                                栃木県那須塩原市石林698-35<br />
                                                株式会社adtown
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-orange-50 rounded-2xl p-8 border-2 border-orange-100">
                            <h3 className="text-xl font-black text-orange-900 mb-4 flex items-center gap-2">
                                <span>💡</span>
                                よくあるご質問
                            </h3>
                            <p className="text-slate-700 font-bold leading-relaxed">
                                サービスに関するよくあるご質問は、広告パートナー募集ページのFAQセクションをご確認ください。
                            </p>
                        </div>
                    </div>

                    <div className="mt-12 pt-8 border-t border-slate-200 text-center">
                        <Link
                            href="/partner/signup"
                            className="inline-block bg-orange-600 hover:bg-orange-700 text-white font-black px-10 py-4 rounded-full transition-all shadow-xl"
                        >
                            広告パートナー募集ページへ戻る
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
