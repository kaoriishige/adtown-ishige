// pages/recruit/subscribe.tsx

import Link from 'next/link';
import Image from 'next/image';
import { NextPage, GetServerSideProps } from 'next';
import { useState, useEffect, useRef } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import React from 'react';
import Head from 'next/head';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { parseCookies } from 'nookies';

// --- SVGアイコン ---
const UsersIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg> );
const XCircleIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg> );
const PhoneIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81 .7A2 2 0 0 1 22 16.92z"></path></svg> );
const MessageCircleIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg> );
const UserCheckIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><polyline points="17 11 19 13 23 9"></polyline></svg> );
const ChevronDownIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="6 9 12 15 18 9"></polyline></svg> );
const ZapIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg> );
const DownloadIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
);

interface UserData {
    companyName: string;
    address: string;
    contactPerson: string;
    phoneNumber: string;
    email: string;
}

interface RecruitSubscribePageProps {
    userData: UserData | null;
}

const FAQItem = ({ question, children }: { question: string, children: React.ReactNode }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (<div className="border-b"><button onClick={() => setIsOpen(!isOpen)} className="w-full text-left py-5 flex justify-between items-center hover:bg-gray-50 transition-colors"><span className="text-lg font-medium text-gray-800 pr-2">{question}</span><ChevronDownIcon className={`w-6 h-6 text-orange-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} /></button>{isOpen && ( <div className="pb-5 pt-2 px-2 text-gray-600 bg-gray-50">{children}</div> )}</div>);
};

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) : null;

const RecruitSubscribePage: NextPage<RecruitSubscribePageProps> = ({ userData }) => {
    const [agreed, setAgreed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [stripeError, setStripeError] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    const [isInvoiceProcessing, setIsInvoiceProcessing] = useState(false);
    const [invoiceDownloadSuccess, setInvoiceDownloadSuccess] = useState(false);

    const registrationFormRef = useRef<HTMLDivElement>(null);

    useEffect(() => { 
        if (!stripePromise) { 
            console.error("Stripe key missing"); 
            setStripeError(true); 
        } 
    }, []);

    const scrollToForm = () => {
        // ここを修正: `scrollIntoView`を正しいキャメルケースで記述
        registrationFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    /**
     * 【請求書払い】ユーザー情報を使ってStripeで請求書を作成し、PDFをダウンロードさせる処理
     */
    const handleCreateInvoice = async () => {
        setError(null);
        if (!agreed) {
            setError('請求書PDFをダウンロードするには、利用規約に同意してください。');
            scrollToForm();
            return;
        }

        setIsInvoiceProcessing(true);
        setInvoiceDownloadSuccess(false);

        try {
            // ログイン済みユーザーのUIDをサーバーに送信
            const response = await fetch('/api/partner/create-invoice', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: userData?.email,
                    serviceType: 'recruit',
                }),
            });
            const data = await response.json();
            
            if (!response.ok || !data.pdfUrl) {
                throw new Error(data.error || '請求書の作成に失敗しました。');
            }

            // 成功：PDFダウンロードURLを使ってダウンロードを開始
            const link = document.createElement('a');
            link.href = data.pdfUrl;
            link.setAttribute('download', `invoice_${userData?.companyName || 'invoice'}_${Date.now()}.pdf`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setInvoiceDownloadSuccess(true);
            setError(null);
        } catch (err: any) {
            console.error('請求書ダウンロードエラー:', err);
            setError(err.message || '請求書の自動生成に失敗しました。サイト管理者にお問い合わせください。');
            setInvoiceDownloadSuccess(false);
        } finally {
            setIsInvoiceProcessing(false);
        }
    };


    /**
     * 【クレカ決済】ユーザー情報を使ってStripe Checkoutセッションを作成
     */
    const handleSubmit = async () => {
        setError(null);
        if (!agreed) {
            setError('クレジットカード決済へ進むには、利用規約に同意してください。');
            scrollToForm();
            return;
        }
        if (!stripePromise) { setStripeError(true); return; }

        setIsLoading(true);
        try {
            const response = await fetch('/api/auth/register-and-subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    serviceType: 'recruit',
                    companyName: userData?.companyName, 
                    address: userData?.address, 
                    contactPerson: userData?.contactPerson, 
                    phoneNumber: userData?.phoneNumber, 
                    email: userData?.email, 
                }),
            });
            
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'サーバーでエラーが発生しました。');
            }

            const { sessionId } = data;
            
            if (sessionId) {
                const stripe = await stripePromise;
                if (stripe) {
                    const { error } = await stripe.redirectToCheckout({ sessionId });
                    if (error) throw new Error(error.message ?? 'Stripeリダイレクトエラー');
                } else throw new Error('Stripeの初期化に失敗');
            } else {
                throw new Error('決済セッションの作成に失敗');
            }
        } catch (err: any) {
            setError(err.message || '不明なエラーが発生');
            setIsLoading(false);
        }
    };

    const getButtonText = () => {
        if (isLoading) return '処理中...';
        if (stripeError) return '決済設定エラー';
        return '月額プランに登録して求人を掲載する';
    };

    const getInvoiceButtonText = () => {
        if (isInvoiceProcessing) return '登録・請求書を作成中...';
        if (invoiceDownloadSuccess) return 'ダウンロード完了！再発行';
        return '請求書PDFをダウンロードして登録';
    };

    if (!userData) {
        return (
            <div className="bg-gray-50 min-h-screen flex items-center justify-center">
                <div className="text-center p-8 bg-white rounded-lg shadow-lg">
                    <p className="text-xl font-bold text-red-600">エラー：ログインが必要です。</p>
                    <p className="mt-4 text-gray-600">広告パートナーとしてログインしてからこのページにアクセスしてください。</p>
                    <Link href="/partner/login" className="mt-6 inline-block bg-orange-500 text-white font-bold py-2 px-6 rounded-full hover:bg-orange-600 transition duration-300">ログインページへ</Link>
                </div>
            </div>
        );
    }
    
    return (
        <div className="bg-gray-50 text-gray-800 font-sans">
            <Head>
                <title>AI求人サービス お申し込み</title>
            </Head>
            <header className="bg-white shadow-md sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-800">AIマッチング求人</h1>
                    <button onClick={scrollToForm} className="bg-orange-500 text-white font-bold py-2 px-6 rounded-full hover:bg-orange-600 transition duration-300 shadow-lg">
                        今すぐ申し込む
                    </button>
                </div>
            </header>
            <main className="container mx-auto px-6">
                <section className="text-center py-16 md:py-24">
                    <p className="text-orange-500 font-semibold">地域の企業を応援する広告代理店 株式会社adtownからのご提案【高い求人広告費を払い続けるのは、もうやめにしませんか？】</p>
                    <h2 className="text-4xl md:text-5xl font-extrabold mt-4 leading-tight">
                        月額3,300円で、<br />
                        <span className="text-orange-600">理想の人材が見つかるまで。</span>
                    </h2>
                    <p className="mt-6 text-lg text-gray-600 max-w-3xl mx-auto">
                        求人広告の高騰、応募が来ない、理想の人材と出会えない…。そんな採用の<strong className="font-bold">「痛み」</strong>を、最先端のマッチングAIが根本から解決。必要な時にいつでも始められ、採用が決まればいつでも停止できる、新しい採用の形をご提案します。
                    </p>
                    <div className="mt-8">
                        <button onClick={scrollToForm} className="bg-gradient-to-r from-orange-500 to-red-500 text-white font-extrabold py-4 px-10 rounded-full text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300">
                            サービスに申し込む
                        </button>
                        <p className="mt-2 text-sm text-gray-500">いつでもキャンセル可能・成功報酬なし。</p>
                    </div>
                </section>
                
                <section className="py-16 bg-white rounded-2xl shadow-lg">
                    <div className="text-center">
                        <h2 className="text-3xl font-extrabold text-gray-800">こんな「採用の悩み」ありませんか？</h2>
                        <p className="mt-4 text-gray-600 max-w-2xl mx-auto">一つでも当てはまれば、AIマッチングが解決します。</p>
                    </div>
                    <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                        <div className="p-6 text-center"><XCircleIcon className="w-12 h-12 mx-auto text-red-500" /><h3 className="mt-4 text-xl font-bold">コストが高い</h3><p className="mt-2 text-gray-600">多額の広告費を払っても、良い人材からの応募があるとは限らない。</p></div>
                        <div className="p-6 text-center"><UsersIcon className="w-12 h-12 mx-auto text-red-500" /><h3 className="mt-4 text-xl font-bold">応募が来ない</h3><p className="mt-2 text-gray-600">そもそも求人を見てもらえず、応募が全く集まらない。</p></div>
                        <div className="p-6 text-center"><UserCheckIcon className="w-12 h-12 mx-auto text-red-500" /><h3 className="mt-4 text-xl font-bold">ミスマッチが多い</h3><p className="mt-2 text-gray-600">応募は来るが、求めるスキルや人柄と合わず、採用に至らない。</p></div>
                    </div>
                </section>
                <section className="mt-24">
                    <div className="text-center"><ZapIcon className="w-12 h-12 mx-auto text-orange-500"/><h2 className="mt-4 text-3xl font-extrabold text-gray-800">その悩み、AIが解決します。</h2><p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">従来の「待ち」の求人とは違い、AIが貴社に最適な人材を「探し出し」ます。<br/>採用活動が驚くほどシンプルに変わる、その仕組みをご覧ください。</p></div>
                    <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        <div className="text-center p-6 bg-white rounded-lg shadow-lg"><div className="bg-orange-500 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">1</div><h4 className="text-xl font-bold">カンタン求人作成</h4><p className="mt-2 text-gray-600">求めるスキルや人物像を数分で入力。AIが貴社のニーズを深く学習し、最適な人材像を定義します。</p></div>
                        <div className="text-center p-6 bg-white rounded-lg shadow-lg"><div className="bg-orange-500 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">2</div><h4 className="text-xl font-bold">AIが候補者を自動提案</h4><p className="mt-2 text-gray-600">AIが地域の求職者データベースから、貴社にマッチする可能性の高い人材を自動でリストアップ。待っているだけで、会いたい人材の情報が届きます。</p></div>
                        <div className="text-center p-6 bg-white rounded-lg shadow-lg"><div className="bg-orange-500 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">3</div><h4 className="text-xl font-bold">いつでも更新を停止</h4><p className="mt-2 text-gray-600">採用が決まればいつでも次回の更新を停止。必要な期間だけ利用でき、無駄なコストはかかりません。</p></div>
                    </div>
                </section>
                <section className="mt-24 text-center">
                    <h3 className="text-2xl font-bold text-gray-700">すでに那須地域の多くの企業様が、新しい採用の形を始めています</h3>
                    <div className="mt-8 flex flex-wrap justify-center items-center gap-x-8 gap-y-6 opacity-80">
                        {['/images/partner-adtown.png', '/images/partner-aquas.png', '/images/partner-aurevoir.png', '/images/partner-celsiall.png', '/images/partner-dairin.png', '/images/partner-kanon.png', '/images/partner-kokoro.png', '/images/partner-meithu.png', '/images/partner-midcityhotel.png', '/images/partner-nikkou.png', '/images/partner-oluolu.png', '/images/partner-omakaseauto.png', '/images/partner-poppo.png', '/images/partner-Quattro.png', '/images/partner-sekiguchi02.png', '/images/partner-tonbo.png', '/images/partner-training_farm.png', '/images/partner-transunet.png', '/images/partner-yamabuki.png', '/images/partner-yamakiya.png'].map((logoPath, index) => (
                            <Image key={index} src={logoPath} alt={`パートナーロゴ ${index + 1}`} width={150} height={50} className="object-contain" />
                        ))}
                    </div>
                </section>
                <section className="mt-24 text-center">
                    <h3 className="text-3xl font-extrabold">安心のトリプルサポート体制</h3>
                    <p className="mt-4 text-gray-600 max-w-2xl mx-auto">導入後も、専任の担当者が貴社の採用活動を徹底的にサポート。初めてのAI利用でもご安心ください。</p>
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                        <div className="bg-white p-6 rounded-lg shadow-md border"><PhoneIcon className="w-10 h-10 mx-auto text-blue-500"/><p className="mt-4 font-bold text-lg">お電話サポート</p></div>
                        <div className="bg-white p-6 rounded-lg shadow-md border"><MessageCircleIcon className="w-10 h-10 mx-auto text-green-500"/><p className="mt-4 font-bold text-lg">LINEチャットサポート</p></div>
                        <div className="bg-white p-6 rounded-lg shadow-md border"><UserCheckIcon className="w-10 h-10 mx-auto text-orange-500"/><p className="mt-4 font-bold text-lg">専任担当者</p></div>
                    </div>
                </section>

                <section ref={registrationFormRef} className="my-24 max-w-3xl mx-auto p-6 bg-white rounded-2xl shadow-xl">
                    <h3 className="text-3xl font-extrabold text-center mb-6">AI求人サービス お申し込みフォーム</h3>
                    <p className="text-gray-600 text-center mb-8">下記フォームにご記入後、お支払い方法を選択してください。<br className="hidden md:inline"/>ご登録後すぐにAI求人のご利用が可能です。</p>

                    <div className="space-y-5">
                        <div className="space-y-5 border-b pb-8 mb-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div><label className="block text-sm font-medium text-gray-600 mb-1">企業名・店舗名</label><input type="text" readOnly value={userData.companyName} className="w-full px-4 py-3 border rounded-lg bg-gray-100 cursor-not-allowed text-gray-700"/></div>
                                <div><label className="block text-sm font-medium text-gray-600 mb-1">ご担当者名</label><input type="text" readOnly value={userData.contactPerson} className="w-full px-4 py-3 border rounded-lg bg-gray-100 cursor-not-allowed text-gray-700"/></div>
                            </div>
                            <div><label className="block text-sm font-medium text-gray-600 mb-1">所在地</label><input type="text" readOnly value={userData.address} className="w-full px-4 py-3 border rounded-lg bg-gray-100 cursor-not-allowed text-gray-700"/></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div><label className="block text-sm font-medium text-gray-600 mb-1">電話番号</label><input type="tel" readOnly value={userData.phoneNumber} className="w-full px-4 py-3 border rounded-lg bg-gray-100 cursor-not-allowed text-gray-700"/></div>
                                <div><label className="block text-sm font-medium text-gray-600 mb-1">メールアドレス</label><input type="email" readOnly value={userData.email} className="w-full px-4 py-3 border rounded-lg bg-gray-100 cursor-not-allowed text-gray-700"/></div>
                            </div>
                        </div>

                        {/* 決済セクション */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-center">お支払い方法の選択</h3>
                            {/* エラー表示エリア */}
                            {stripeError && ( <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md flex items-center"><XCircleIcon className="h-5 w-5 mr-3"/><p className="text-sm">決済設定が不完全なため、お申し込みを完了できません。サイト管理者にご連絡ください。</p></div> )}
                            {error && !stripeError && ( <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md flex items-center"><XCircleIcon className="h-5 w-5 mr-3"/><p className="text-sm">{error}</p></div> )}

                            <div className="pt-4">
                                <label className="flex items-start">
                                    <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 h-5 w-5 text-orange-600 rounded"/>
                                    <span className="ml-3 text-sm text-gray-600">
                                        <button type="button" onClick={() => setShowTerms(true)} className="text-blue-600 hover:underline">利用規約</button>に同意します。
                                    </span>
                                </label>
                            </div>

                            {/* クレカ決済フォーム */}
                            <div className="mt-4 border p-4 rounded-lg">
                                <h4 className="font-bold text-center mb-2">クレジットカードでお支払い</h4>
                                <button onClick={handleSubmit} disabled={isLoading || !agreed || stripeError} className="w-full py-3 mt-4 text-white font-bold bg-gradient-to-r from-orange-500 to-red-500 rounded-lg disabled:opacity-50">
                                    {getButtonText()}
                                </button>
                            </div>
                            
                            {/* 請求書払いボタン */}
                            <div className="mt-6 border p-4 rounded-lg">
                                <h4 className="font-bold text-center mb-2">請求書でお支払い (年一括)</h4>
                                {invoiceDownloadSuccess && (
                                    <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-md flex items-center justify-center mb-4 max-w-md mx-auto">
                                        <DownloadIcon className="h-5 w-5 mr-3"/>
                                        <p className="text-sm font-bold">請求書のダウンロードを開始しました！</p>
                                    </div>
                                )}
                                <button 
                                    onClick={handleCreateInvoice} 
                                    disabled={isInvoiceProcessing || !agreed} 
                                    className="inline-flex items-center justify-center w-full py-3 mt-4 text-white font-bold bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg disabled:opacity-50"
                                >
                                    {isInvoiceProcessing && <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                                    <DownloadIcon className="w-5 h-5 mr-2" />
                                    {getInvoiceButtonText()}
                                </button>
                                {!agreed && <p className="text-red-500 text-sm mt-2">※ PDFダウンロードには、利用規約への同意が必要です。</p>}
                            </div>
                        </div>
                    </div>
                </section>
            </main>
            <footer className="bg-white mt-20 border-t">
                <div className="container mx-auto px-6 py-8 text-center text-gray-600">
                    <p>&copy; {new Date().getFullYear()} 株式会社adtown. All Rights Reserved.</p>
                    <div className="mt-4">
                        <Link href="/legal" className="text-sm text-gray-500 hover:underline mx-2">特定商取引法に基づく表記</Link>
                        <Link href="/privacy" className="text-sm text-gray-500 hover:underline mx-2">プライバシーポリシー</Link>
                    </div>
                </div>
            </footer>
            {showTerms && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
                        <h2 className="text-xl font-bold mb-4 border-b pb-2">AIマッチング求人 利用規約</h2>
                        <div className="overflow-y-auto space-y-4 pr-2">
                            <p><strong>第1条（適用）</strong><br/>本規約は、株式会社adtown（以下「当社」といいます。）が提供するAIマッチング求人サービス（以下「本サービス」といいます。）の利用に関する一切の関係に適用されます。</p>
                            <p><strong>第2条（利用登録）</strong><br/>本サービスの利用を希望する者（以下「登録希望者」）は、本規約に同意の上、当社の定める方法によって利用登録を申請し、当社がこれを承認することによって、利用登録が完了するものとします。</p>
                            <p><strong>第3条（利用料金と支払方法）</strong><br/>1. 本サービスの利用料金は、月額3,300円（税込）とします。<br/>2. 支払方法はクレジットカード決済または銀行振込（年額一括のみ）とし、登録希望者は当社が指定する方法で支払うものとします。<br/>3. 利用契約は毎月自動的に更新されるものとし、利用者はいつでも次回の更新をキャンセルすることができます。</p>
                            <p>（その他の条文は省略）</p>
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button onClick={() => setShowTerms(false)} className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600">閉じる</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
    try {
        const cookies = parseCookies(context);
        const token = cookies.token;
        if (!token) {
            return {
                redirect: {
                    destination: '/partner/login',
                    permanent: false,
                },
            };
        }

        const decodedToken = await adminAuth.verifySessionCookie(token, true);
        const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
        
        if (!userDoc.exists) {
            return {
                redirect: {
                    destination: '/partner/login',
                    permanent: false,
                },
            };
        }

        const userData = userDoc.data();

        const isRecruitPartner = userData?.roles?.includes('recruit-partner');
        if (!isRecruitPartner) {
            return {
                redirect: {
                    destination: '/partner/dashboard', 
                    permanent: false,
                },
            };
        }
        
        return {
            props: {
                userData: {
                    companyName: userData?.companyName || '',
                    address: userData?.address || '',
                    contactPerson: userData?.displayName || '',
                    phoneNumber: userData?.phoneNumber || '',
                    email: userData?.email || '',
                },
            },
        };
    } catch (error) {
        console.error("Failed to retrieve user data from session:", error);
        return {
            redirect: {
                destination: '/partner/login',
                permanent: false,
            },
        };
    }
};

export default RecruitSubscribePage;