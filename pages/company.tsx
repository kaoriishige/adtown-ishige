import React from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function CompanyPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
            <Head>
                <title>会社情報 | みんなのNasuアプリ</title>
                <meta name="description" content="株式会社adtownの会社情報" />
            </Head>

            <div className="max-w-4xl mx-auto px-6 py-20">
                {/* ヘッダー */}
                <div className="text-center mb-16">
                    <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-4 tracking-tight">
                        COMPANY
                    </h1>
                    <p className="text-slate-600 font-bold text-lg">会社情報</p>
                </div>

                {/* 会社情報カード */}
                <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-orange-600 to-orange-500 p-8 text-white">
                        <h2 className="text-3xl md:text-4xl font-black">株式会社adtown</h2>
                    </div>

                    <div className="p-10 md:p-16 space-y-8">
                        <div className="space-y-4">
                            <div className="flex items-start gap-4 pb-6 border-b border-slate-100">
                                <div className="w-32 font-black text-slate-500 text-sm uppercase tracking-wider">
                                    会社名
                                </div>
                                <div className="flex-1 font-bold text-slate-900 text-lg">
                                    株式会社adtown
                                </div>
                            </div>

                            <div className="flex items-start gap-4 pb-6 border-b border-slate-100">
                                <div className="w-32 font-black text-slate-500 text-sm uppercase tracking-wider">
                                    所在地
                                </div>
                                <div className="flex-1 font-bold text-slate-900 text-lg">
                                    〒329-2711<br />
                                    栃木県那須塩原市石林698-35
                                </div>
                            </div>

                            <div className="flex items-start gap-4 pb-6 border-b border-slate-100">
                                <div className="w-32 font-black text-slate-500 text-sm uppercase tracking-wider">
                                    電話番号
                                </div>
                                <div className="flex-1 font-bold text-slate-900 text-lg">
                                    <a href="tel:0287397577" className="hover:text-orange-600 transition-colors">
                                        0287-39-7577
                                    </a>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 pb-6 border-b border-slate-100">
                                <div className="w-32 font-black text-slate-500 text-sm uppercase tracking-wider">
                                    メール
                                </div>
                                <div className="flex-1 font-bold text-slate-900 text-lg">
                                    <a href="mailto:adtown@able.ocn.ne.jp" className="hover:text-orange-600 transition-colors">
                                        adtown@able.ocn.ne.jp
                                    </a>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-32 font-black text-slate-500 text-sm uppercase tracking-wider">
                                    事業内容
                                </div>
                                <div className="flex-1 font-bold text-slate-700 text-base leading-relaxed">
                                    地域情報誌の発行、WEB制作、YouTubeチャンネル運営、<br />
                                    AIアプリ開発・運営（みんなのNasuアプリ）
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 pt-8 border-t border-slate-200">
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
        </div>
    );
}
