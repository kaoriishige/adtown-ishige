import React from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
            <Head>
                <title>プライバシーポリシー | みんなのNasuアプリ</title>
                <meta name="description" content="みんなのNasuアプリのプライバシーポリシー" />
            </Head>

            <div className="max-w-4xl mx-auto px-6 py-20">
                {/* ヘッダー */}
                <div className="text-center mb-16">
                    <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-4 tracking-tight">
                        PRIVACY POLICY
                    </h1>
                    <p className="text-slate-600 font-bold text-lg">プライバシーポリシー</p>
                </div>

                {/* コンテンツ */}
                <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 p-10 md:p-16">
                    <div className="prose prose-slate max-w-none">
                        <p className="text-slate-600 font-bold leading-relaxed mb-8">
                            株式会社adtown（以下「当社」といいます）は、「みんなのNasuアプリ」（以下「本サービス」といいます）の提供にあたり、ユーザーの個人情報の保護に努めます。本プライバシーポリシーは、当社が取得する個人情報の取扱いについて定めるものです。
                        </p>

                        <section className="mb-10">
                            <h2 className="text-2xl font-black text-slate-900 mb-4 border-l-8 border-orange-600 pl-4">
                                第1条（個人情報の定義）
                            </h2>
                            <p className="text-slate-700 font-bold leading-relaxed">
                                本ポリシーにおいて「個人情報」とは、個人情報保護法に定める「個人情報」を指し、生存する個人に関する情報であって、当該情報に含まれる氏名、メールアドレス、電話番号、その他の記述等により特定の個人を識別できる情報を指します。
                            </p>
                        </section>

                        <section className="mb-10">
                            <h2 className="text-2xl font-black text-slate-900 mb-4 border-l-8 border-orange-600 pl-4">
                                第2条（個人情報の収集方法）
                            </h2>
                            <p className="text-slate-700 font-bold leading-relaxed mb-4">
                                当社は、ユーザーが本サービスを利用する際に、以下の個人情報を収集することがあります：
                            </p>
                            <ul className="list-disc list-inside space-y-2 text-slate-700 font-bold ml-4">
                                <li>氏名、メールアドレス、電話番号</li>
                                <li>店舗名、企業名、所在地（パートナー登録時）</li>
                                <li>サービス利用履歴、閲覧履歴</li>
                                <li>位置情報（ユーザーの同意がある場合）</li>
                                <li>決済情報（クレジットカード情報等）</li>
                            </ul>
                        </section>

                        <section className="mb-10">
                            <h2 className="text-2xl font-black text-slate-900 mb-4 border-l-8 border-orange-600 pl-4">
                                第3条（個人情報の利用目的）
                            </h2>
                            <p className="text-slate-700 font-bold leading-relaxed mb-4">
                                当社は、収集した個人情報を以下の目的で利用します：
                            </p>
                            <ul className="list-disc list-inside space-y-2 text-slate-700 font-bold ml-4">
                                <li>本サービスの提供、運営、改善</li>
                                <li>ユーザーサポート、お問い合わせへの対応</li>
                                <li>AIマッチング機能による最適な情報の提供</li>
                                <li>決済処理、請求書発行</li>
                                <li>紹介報酬の計算および支払い</li>
                                <li>利用規約違反の調査、対応</li>
                                <li>新機能、キャンペーン等のご案内</li>
                            </ul>
                        </section>

                        <section className="mb-10">
                            <h2 className="text-2xl font-black text-slate-900 mb-4 border-l-8 border-orange-600 pl-4">
                                第4条（個人情報の第三者提供）
                            </h2>
                            <p className="text-slate-700 font-bold leading-relaxed">
                                当社は、以下の場合を除き、ユーザーの同意なく個人情報を第三者に提供しません：
                            </p>
                            <ul className="list-disc list-inside space-y-2 text-slate-700 font-bold ml-4 mt-4">
                                <li>法令に基づく場合</li>
                                <li>人の生命、身体または財産の保護のために必要がある場合</li>
                                <li>決済代行業者（Stripe等）への提供が必要な場合</li>
                                <li>業務委託先への提供が必要な場合（適切な管理を行います）</li>
                            </ul>
                        </section>

                        <section className="mb-10">
                            <h2 className="text-2xl font-black text-slate-900 mb-4 border-l-8 border-orange-600 pl-4">
                                第5条（個人情報の開示・訂正・削除）
                            </h2>
                            <p className="text-slate-700 font-bold leading-relaxed">
                                ユーザーは、当社に対して、個人情報の開示、訂正、削除を請求することができます。請求があった場合、当社は速やかに対応いたします。お問い合わせは、本ページ記載の連絡先までご連絡ください。
                            </p>
                        </section>

                        <section className="mb-10">
                            <h2 className="text-2xl font-black text-slate-900 mb-4 border-l-8 border-orange-600 pl-4">
                                第6条（プライバシーポリシーの変更）
                            </h2>
                            <p className="text-slate-700 font-bold leading-relaxed">
                                当社は、法令の変更等に伴い、本ポリシーを変更することがあります。変更後のプライバシーポリシーは、本ページに掲載した時点で効力を生じるものとします。
                            </p>
                        </section>

                        <section className="mb-10 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                            <h2 className="text-2xl font-black text-slate-900 mb-4">
                                お問い合わせ窓口
                            </h2>
                            <div className="space-y-2 text-slate-700 font-bold">
                                <p>株式会社adtown</p>
                                <p>〒329-2711 栃木県那須塩原市石林698-35</p>
                                <p>TEL: <a href="tel:0287397577" className="text-orange-600 hover:underline">0287-39-7577</a></p>
                                <p>Mail: <a href="mailto:adtown@able.ocn.ne.jp" className="text-orange-600 hover:underline">adtown@able.ocn.ne.jp</a></p>
                            </div>
                        </section>

                        <p className="text-right text-slate-500 font-bold text-sm mt-12">
                            制定日：2026年1月30日
                        </p>
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
