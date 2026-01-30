import React from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function SCTLPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
            <Head>
                <title>特定商取引法に基づく表記 | みんなのNasuアプリ</title>
                <meta name="description" content="みんなのNasuアプリの特定商取引法に基づく表記" />
            </Head>

            <div className="max-w-4xl mx-auto px-6 py-20">
                {/* ヘッダー */}
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-4 tracking-tight">
                        特定商取引法に基づく表記
                    </h1>
                    <p className="text-slate-600 font-bold text-lg">SCTL (Specified Commercial Transaction Law)</p>
                </div>

                {/* コンテンツ */}
                <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 p-10 md:p-16">
                    <div className="space-y-8">
                        <div className="pb-6 border-b border-slate-100">
                            <h2 className="text-lg font-black text-slate-500 mb-3 uppercase tracking-wider">
                                販売業者
                            </h2>
                            <p className="text-slate-900 font-bold text-xl">
                                株式会社adtown
                            </p>
                        </div>

                        <div className="pb-6 border-b border-slate-100">
                            <h2 className="text-lg font-black text-slate-500 mb-3 uppercase tracking-wider">
                                運営統括責任者
                            </h2>
                            <p className="text-slate-900 font-bold text-xl">
                                石下かをり
                            </p>
                        </div>

                        <div className="pb-6 border-b border-slate-100">
                            <h2 className="text-lg font-black text-slate-500 mb-3 uppercase tracking-wider">
                                所在地
                            </h2>
                            <p className="text-slate-900 font-bold text-xl">
                                〒329-2711<br />
                                栃木県那須塩原市石林698-35
                            </p>
                        </div>

                        <div className="pb-6 border-b border-slate-100">
                            <h2 className="text-lg font-black text-slate-500 mb-3 uppercase tracking-wider">
                                電話番号
                            </h2>
                            <p className="text-slate-900 font-bold text-xl">
                                <a href="tel:0287397577" className="hover:text-orange-600 transition-colors">
                                    0287-39-7577
                                </a>
                            </p>
                            <p className="text-slate-600 font-bold text-sm mt-2">
                                受付時間：平日 10:00〜17:00
                            </p>
                        </div>

                        <div className="pb-6 border-b border-slate-100">
                            <h2 className="text-lg font-black text-slate-500 mb-3 uppercase tracking-wider">
                                メールアドレス
                            </h2>
                            <p className="text-slate-900 font-bold text-xl">
                                <a href="mailto:adtown@able.ocn.ne.jp" className="hover:text-orange-600 transition-colors">
                                    adtown@able.ocn.ne.jp
                                </a>
                            </p>
                        </div>

                        <div className="pb-6 border-b border-slate-100">
                            <h2 className="text-lg font-black text-slate-500 mb-3 uppercase tracking-wider">
                                サービス名称
                            </h2>
                            <p className="text-slate-900 font-bold text-xl">
                                みんなのNasuアプリ 広告パートナープログラム
                            </p>
                        </div>

                        <div className="pb-6 border-b border-slate-100">
                            <h2 className="text-lg font-black text-slate-500 mb-3 uppercase tracking-wider">
                                販売価格
                            </h2>
                            <div className="text-slate-900 font-bold text-xl space-y-2">
                                <p>月額 5,500円（税込）</p>
                                <p className="text-slate-600 font-bold text-base">
                                    ※先行100社限定価格。通常価格は月額8,800円（税込）
                                </p>
                            </div>
                        </div>

                        <div className="pb-6 border-b border-slate-100">
                            <h2 className="text-lg font-black text-slate-500 mb-3 uppercase tracking-wider">
                                支払方法
                            </h2>
                            <div className="text-slate-900 font-bold text-xl space-y-2">
                                <p>・クレジットカード決済（Stripe）</p>
                                <p>・請求書払い（銀行振込）</p>
                            </div>
                        </div>

                        <div className="pb-6 border-b border-slate-100">
                            <h2 className="text-lg font-black text-slate-500 mb-3 uppercase tracking-wider">
                                支払時期
                            </h2>
                            <p className="text-slate-900 font-bold text-xl">
                                登録完了後、初回決済が行われます。以降、毎月自動更新となります。
                            </p>
                        </div>

                        <div className="pb-6 border-b border-slate-100">
                            <h2 className="text-lg font-black text-slate-500 mb-3 uppercase tracking-wider">
                                サービス提供時期
                            </h2>
                            <p className="text-slate-900 font-bold text-xl">
                                決済完了後、即時サービスをご利用いただけます。
                            </p>
                        </div>

                        <div className="pb-6 border-b border-slate-100">
                            <h2 className="text-lg font-black text-slate-500 mb-3 uppercase tracking-wider">
                                解約・返金について
                            </h2>
                            <div className="text-slate-900 font-bold text-xl space-y-3">
                                <p>管理画面からいつでも解約手続きが可能です。</p>
                                <p className="text-slate-700 font-bold text-base leading-relaxed">
                                    解約は次回更新日の前日までに行ってください。日割り計算による返金は行いません。解約後も、既に発生している紹介報酬は規約に基づき支払われます。
                                </p>
                            </div>
                        </div>

                        <div className="pb-6 border-b border-slate-100">
                            <h2 className="text-lg font-black text-slate-500 mb-3 uppercase tracking-wider">
                                紹介報酬について
                            </h2>
                            <div className="text-slate-900 font-bold text-xl space-y-3">
                                <p>紹介したユーザーの継続売上（税抜）の30%を毎月還元</p>
                                <p className="text-slate-700 font-bold text-base leading-relaxed">
                                    報酬は月末締め翌月15日に、指定の銀行口座に振込されます。詳細は利用規約をご確認ください。
                                </p>
                            </div>
                        </div>

                        <div>
                            <h2 className="text-lg font-black text-slate-500 mb-3 uppercase tracking-wider">
                                お問い合わせ
                            </h2>
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                                <p className="text-slate-900 font-bold text-base leading-relaxed">
                                    サービスに関するご質問は、上記メールアドレスまたは電話番号までお問い合わせください。<br />
                                    LINEサポートもご利用いただけます。
                                </p>
                            </div>
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
