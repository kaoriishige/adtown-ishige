import Link from 'next/link';
import Image from 'next/image';
import { NextPage, GetServerSideProps } from 'next';
import { useState, useEffect, useRef } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import React from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth'; 
import { app } from '../../lib/firebase'; 
import { getPartnerUidFromCookie, adminDb } from '../../lib/firebase-admin';
import Head from 'next/head';

// --- インラインSVGアイコンコンポーネント ---
const UsersIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
);
const XCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
);
const PhoneIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81 .7A2 2 0 0 1 22 16.92z"></path></svg>
);
const MessageCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
);
const UserCheckIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><polyline points="17 11 19 13 23 9"></polyline></svg>
);
const ChevronDownIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="6 9 12 15 18 9"></polyline></svg>
);
const DownloadIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
);

const FAQItem = ({ question, children }: { question: string, children: React.ReactNode }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full text-left py-5 flex justify-between items-center hover:bg-gray-50 transition-colors">
                <span className="text-lg font-medium text-gray-800 pr-2">{question}</span>
                <ChevronDownIcon className={`w-6 h-6 text-orange-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && ( <div className="pb-5 pt-2 px-2 text-gray-600 bg-gray-50">{children}</div> )}
        </div>
    );
};

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) : null;

// --- ページに渡されるデータの型定義 ---
interface PageProps {
    partnerInfo?: {
        uid: string;
        companyName: string;
        contactPerson: string;
        address: string;
        phoneNumber: string;
        email: string;
    };
    error?: string;
}

// --- サーバーサイドでのデータ取得 ---
export const getServerSideProps: GetServerSideProps<PageProps> = async (context) => {
    try {
        const uid = await getPartnerUidFromCookie(context);

        if (!uid) {
            return { redirect: { destination: '/partner/login', permanent: false } };
        }

        const userDoc = await adminDb.collection('users').doc(uid).get();
        if (!userDoc.exists) {
            return { redirect: { destination: '/partner/login?error=user_not_found', permanent: false } };
        }

        const userData = userDoc.data()!;

        // 既に広告パートナーとして登録済みの場合はダッシュボードへリダイレクト
        if (userData.roles?.includes('ad')) {
            return { redirect: { destination: '/partner/dashboard', permanent: false } };
        }

        return {
            props: {
                partnerInfo: {
                    uid: userDoc.id,
                    email: userData.email || '',
                    companyName: userData.companyName || userData.storeName || '',
                    address: userData.address || '',
                    // ユーザー情報にはdisplayNameを連絡担当者として利用
                    contactPerson: userData.displayName || '', 
                    phoneNumber: userData.phoneNumber || '',
                },
            },
        };
    } catch (error) {
        console.error("ad-subscribe getServerSideProps error:", error);
        return { redirect: { destination: '/partner/login', permanent: false } };
    }
};

const PartnerSubscribePage: NextPage<PageProps> = ({ partnerInfo, error: serverError }) => {
    const [agreed, setAgreed] = useState(false);
    const [isLoading, setIsLoading] = useState(false); // クレカ決済処理中
    const [error, setError] = useState<string | null>(serverError || null);
    const [stripeError, setStripeError] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    
    // 請求書PDFダウンロード機能用
    const [isInvoiceProcessing, setIsInvoiceProcessing] = useState(false); // 請求書処理中
    const [invoiceDownloadSuccess, setInvoiceDownloadSuccess] = useState(false); // ダウンロード成功

    const registrationFormRef = useRef<HTMLDivElement>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);


    useEffect(() => { 
        if (!stripePromise) { console.error("Stripe key missing"); setStripeError(true); } 

        // Firebase AuthでユーザーUIDを確保
        const auth = getAuth(app);
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
        });
        return () => unsubscribe();

    }, []);

    const scrollToForm = () => {
        registrationFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    // フォームの入力完了チェック (同意のみチェック)
    const isFormValid = !!(agreed && partnerInfo);


    /**
     * 【請求書払い】ログイン済みのユーザー情報を使って請求書を作成・ダウンロードさせる処理
     */
    const handleCreateInvoice = async () => {
        setError(null);

        if (!isFormValid || !partnerInfo) { 
            setError('請求書ダウンロードには、利用規約への同意が必要です。'); 
            scrollToForm(); 
            return; 
        }

        setIsInvoiceProcessing(true);
        setInvoiceDownloadSuccess(false);

        try {
            // ログイン済みのため、認証トークンを使ってAPIを呼び出す
            const idToken = await currentUser?.getIdToken();
            if (!idToken) throw new Error("ユーザー認証に失敗しました。再ログインしてください。");

            // APIを呼び出し、請求書PDFのURLを取得
            const response = await fetch('/api/auth/register-and-create-invoice', { 
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`, // 認証情報
                },
                body: JSON.stringify({ 
                    serviceType: 'ad', 
                    // 既存ユーザーとして処理するために必要な情報を渡す
                    companyName: partnerInfo.companyName, 
                    email: partnerInfo.email,
                    isExistingUser: true, // 既存ユーザーであることをAPIに伝える
                }),
            });
            const data = await response.json();
            
            if (!response.ok || !data.pdfUrl) {
                throw new Error(data.error || '請求書の作成に失敗しました。');
            }

            // 成功：PDFダウンロードURLを使ってダウンロードを開始
            const link = document.createElement('a');
            link.href = data.pdfUrl;
            link.setAttribute('download', `invoice_${partnerInfo.companyName}_${Date.now()}.pdf`);
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
     * 【クレカ決済】申し込み処理
     */
    const handleSubmit = async () => {
        setError(null);

        if (!isFormValid || !partnerInfo) { 
            setError('クレジットカード決済へ進むには、利用規約への同意が必要です。'); 
            scrollToForm(); 
            return; 
        }

        if (!stripePromise || !currentUser) { setStripeError(true); return; }

        setIsLoading(true);
        try {
            const idToken = await currentUser.getIdToken();

            // 統一APIを呼び出し、Stripe Checkoutセッションを作成
            const response = await fetch('/api/auth/register-and-subscribe', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`,
                },
                body: JSON.stringify({ 
                    serviceType: 'ad', 
                    // ログイン済みユーザーの情報を使用
                    companyName: partnerInfo.companyName,
                    email: partnerInfo.email,
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
        return 'リスクゼロで申し込む (全額返金保証付き)';
    };

    const getInvoiceButtonText = () => {
        if (isInvoiceProcessing) return '請求書を作成中...';
        if (invoiceDownloadSuccess) return 'ダウンロード完了！再発行';
        return '請求書PDFをダウンロードして登録';
    };


    if (serverError || !partnerInfo) {
        return (
            <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 p-4">
                <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-2xl border">
                    <h2 className="text-2xl font-bold mb-4 text-red-600">エラー</h2>
                    <p className="text-gray-800 mb-6 bg-red-50 p-4 rounded-md text-left">
                        <strong>エラー内容:</strong> {serverError || "パートナー情報を取得できませんでした。再度ログインしてください。"}
                    </p>
                    <Link href="/partner/login">
                        <a className="text-blue-600 hover:underline">ログインページに戻る</a>
                    </Link>
                </div>
            </div>
        );
    }
    
    return (
        <div className="bg-gray-50 text-gray-800 font-sans">
            <Head>
                <title>広告掲載＆紹介料プログラム お申し込み</title>
            </Head>
            <header className="bg-white shadow-md sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-800">みんなの那須アプリ</h1>
                    <button onClick={scrollToForm} className="bg-orange-500 text-white font-bold py-2 px-6 rounded-full hover:bg-orange-600 transition duration-300 shadow-lg animate-pulse">
                        今すぐ申し込む
                    </button>
                </div>
            </header>
            <main className="container mx-auto px-6">
                <section className="text-center py-16 md:py-24">
                    <p className="text-orange-500 font-semibold">adtownからのご提案【もし、毎月安定した収益が自動で入ってきたら？】</p>
                    <h2 className="text-4xl md:text-5xl font-extrabold mt-4 leading-tight">
                        「お金を無駄に
                        払う」時代は終わりました。<br />
                        これからは<span className="text-orange-600">あなたのお店のテーブルが新しい収益源</span>になります。
                    </h2>
                    <p className="mt-6 text-lg text-gray-600 max-w-3xl mx-auto">
                        これは単なる広告掲載のご提案ではありません。人手不足、物価高騰…そんな<strong className="font-bold">「痛み」</strong>を抱える今だからこそ、那須地域の店舗様と共に、広告費を「コスト」から「利益」に変える新しいプロジェクトをご提案します。
                    </p>
                    <div className="mt-8">
                        <button onClick={scrollToForm} className="bg-gradient-to-r from-orange-500 to-red-500 text-white font-extrabold py-4 px-10 rounded-full text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300">
                            今すぐ新しい収益源を手に入れる
                        </button>
                        <p className="mt-2 text-sm text-gray-500">お申し込みは簡単です。</p>
                    </div>
                </section>
                
                {/* 登録情報確認セクション */}
                <section ref={registrationFormRef} id="registration-form" className="mt-20 pt-10">
                    <div className="bg-white p-8 md:p-12 rounded-2xl shadow-2xl w-full max-w-3xl mx-auto border border-gray-200">
                        <div className="text-center mb-10">
                            <h2 className="text-3xl font-bold mb-2">お申し込み内容の確認</h2>
                            <p className="text-gray-600">ご登録済みの情報が自動入力されています。内容を確認し、決済方法を選択してください。</p>
                        </div>
                        
                        {/* 登録情報表示 */}
                        <div className="space-y-4 border-b pb-8 mb-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">店舗名・企業名</label><input type="text" readOnly value={partnerInfo.companyName} className="w-full px-4 py-2 border rounded-lg bg-gray-100 cursor-not-allowed"/></div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">ご担当者名</label><input type="text" readOnly value={partnerInfo.contactPerson} className="w-full px-4 py-2 border rounded-lg bg-gray-100 cursor-not-allowed"/></div>
                            </div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">住所</label><input type="text" readOnly value={partnerInfo.address} className="w-full px-4 py-2 border rounded-lg bg-gray-100 cursor-not-allowed"/></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">電話番号</label><input type="tel" readOnly value={partnerInfo.phoneNumber} className="w-full px-4 py-2 border rounded-lg bg-gray-100 cursor-not-allowed"/></div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label><input type="email" readOnly value={partnerInfo.email} className="w-full px-4 py-2 border rounded-lg bg-gray-100 cursor-not-allowed"/></div>
                            </div>
                        </div>

                        {/* 決済セクション */}
                        <div className="space-y-6">
                            <div className="pt-4">
                                <label className="flex items-start">
                                    <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 h-5 w-5 text-orange-600 focus:ring-orange-500 rounded"/>
                                    <span className="ml-3 text-sm text-gray-600">
                                        <button type="button" onClick={() => setShowTerms(true)} className="text-blue-600 hover:underline">パートナー利用規約</button>
                                        および全額返金保証の条件に同意し、広告掲載および紹介料プログラム（月額3,300円/税込）へ申し込みます。
                                    </span>
                                </label>
                            </div>
                            
                            {/* エラー表示エリア */}
                            {stripeError && ( <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md flex items-center"><XCircleIcon className="h-5 w-5 mr-3"/><p className="text-sm">決済設定が不完全なため、お申し込みを完了できません。サイト管理者にご連絡ください。</p></div> )}
                            {error && !stripeError && ( <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md flex items-center"><XCircleIcon className="h-5 w-5 mr-3"/><p className="text-sm">{error}</p></div> )}

                            {/* クレジットカード決済ボタン */}
                            <button type="button" onClick={handleSubmit} disabled={isLoading || !isFormValid || stripeError} className="w-full py-4 mt-4 text-white text-lg font-bold bg-gradient-to-r from-orange-500 to-red-500 rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300">
                                {getButtonText()}
                            </button>
                            <p className="text-sm text-center -mt-2 text-gray-500">クレジットカードでのお支払いは上記からお願いします。</p>
                        </div>
                    </div>
                </section>

                {/* 請求書払いセクション (PDFダウンロードUI) */}
                <section className="mt-12 bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-gray-200 text-center">
                    <h3 className="text-3xl font-extrabold mb-4">請求書でのお支払いをご希望の方へ</h3>
                    <p className="text-gray-600 mb-6">
                        御請求書にてのお支払いについては、年間39,600円を前払にてのご精算になります。<br />
                        ご希望の方は、**規約に同意した後**、下のボタンから**請求書PDFを即時ダウンロード**してください。
                    </p>
                    {invoiceDownloadSuccess && (
                        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-md flex items-center justify-center mb-4 max-w-md mx-auto">
                            <DownloadIcon className="h-5 w-5 mr-3"/>
                            <p className="text-sm font-bold">請求書のダウンロードを開始しました！</p>
                        </div>
                    )}
                    <button
                        onClick={handleCreateInvoice}
                        disabled={isInvoiceProcessing || !isFormValid}
                        className="inline-flex items-center justify-center w-full max-w-md py-4 text-white text-lg font-bold bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg hover:shadow-lg disabled:opacity-50 transition-all duration-300"
                    >
                        {isInvoiceProcessing && <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                        <DownloadIcon className="w-5 h-5 mr-2" />
                        {getInvoiceButtonText()}
                    </button>
                    {!isFormValid && <p className="text-red-500 text-sm mt-2">※ PDFダウンロードには、利用規約への同意が必要です。</p>}
                </section>
                
                <section className="mt-20 max-w-4xl mx-auto">
                    <h3 className="text-3xl font-extrabold text-center">よくある質問</h3>
                    <div className="mt-8 bg-white p-4 md:p-8 rounded-2xl shadow-xl border">
                        <FAQItem question="本当にリスクはないのですか？（全額返金保証について）"><p className="leading-relaxed font-bold text-orange-600">はい、貴店にリスクは一切ありません。</p><p className="mt-2 leading-relaxed">もし1年間で得られた紹介手数料の合計が、年間のパートナー費用（39,600円）に満たなかった場合、お支払いいただいた費用を<strong className="font-bold">全額返金</strong>いたします。これは、私達がこの仕組みに絶対的な自信を持っている証拠です。<br/><span className="text-xs text-gray-500">※全額返金保証は、お客様が来店される実店舗様が対象となります。</span></p></FAQItem>
                        <FAQItem question="QRコードスタンドは有料ですか？"><p className="leading-relaxed">いいえ、<strong className="font-bold">制作費は完全に無料</strong>です。お申し込み後、貴店専用のQRコードスタンドを必要数お作りし、お届けいたします。テーブルやレジ横に置くだけで、すぐに始められます。不足した場合は、追加も可能です。</p></FAQItem>
                        <FAQItem question="紹介料は本当に毎月振り込まれますか？"><p className="leading-relaxed">はい、もちろんです。紹介料は月末締めで計算し、翌月15日にご登録いただいた銀行口座へ自動でお振込みいたします。振込額が3,000円に満たない場合は翌月以降に繰り越されるが、報酬が消えることはございませんのでご安心ください。</p></FAQItem>
                        <FAQItem question="契約の途中で解約はできますか？"><p className="leading-relaxed">はい、いつでも解約手続きが可能です。ただし、本契約は1年単位での自動更新となっており、契約期間中のご返金は致しかねますのでご了承ください（全額返金保証を除く）。次回の更新日までに解約手続きをいただければ、追加の料金は発生いたしません。</p></FAQItem>
                    </div>
                </section>
            </main>
            <footer className="bg-white mt-20 border-t">
                <div className="container mx-auto px-6 py-8 text-center text-gray-600">
                    <p>&copy; {new Date().getFullYear()} 株式会社adtown. All Rights Reserved.</p>
                    <div className="mt-4">
                        <Link href="/legal/">
                            <a className="text-sm text-gray-500 hover:underline mx-2">特定商取引法に基づく表記</a>
                        </Link>
                        <Link href="/privacy">
                            <a className="text-sm text-gray-500 hover:underline mx-2">プライバシーポリシー</a>
                        </Link>
                    </div>
                </div>
            </footer>
            {showTerms && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
                        <h2 className="text-xl font-bold mb-4 border-b pb-2">パートナー利用規約</h2>
                        <div className="overflow-y-auto space-y-4 pr-2">
                            <p><strong>第1条（本規約の適用範囲）</strong><br />本規約は、株式会社adtown（以下「当社」といいます。）が提供する「みんなの那須アプリ」パートナープログラム（以下「本サービス」といいます。）の利用に関する一切の関係に適用されます。</p>
                            <p><strong>第2条（本サービスの利用資格）</strong><br />本サービスは、当社が別途定める審査基準を満たした法人または個人事業主（以下「パートナー」といいます。）のみが利用できるものとします。申込者は、当社が要求する情報が真実かつ正確であることを保証するものとします。</p>
                            <p><strong>第3条（利用料金）</strong><br />パートナーは、当社に対し、別途定める利用料金（月額3,300円（税込）または年額39,600円（税込））を支払うものとします。支払い方法は、クレジットカード決済または銀行振込（年額一括のみ）とします。</p>
                            <p><strong>第4条（禁止事項）</strong><br />パートナーは、本サービスの利用にあたり、以下の行為を行ってはなりません。<br />1. 法令または公序良俗に違反する行為<br />2. 犯罪行為に関連する行為<br />3. 当社のサーバーまたはネットワークの機能を破壊したり、妨害したりする行為<br />4. 当社のサービスの運営を妨害するおそれのある行為<br />5. 他のパートナーに関する個人情報等を収集または蓄積する行為<br />6. 不正な目的を持って本サービスを利用する行為<br />7. 当社または第三者の知的財産権、肖像権、プライバシー、名誉その他の権利または利益を侵害する行為<br />8. その他、当社が不適切と判断する行為</p>
                            <p><strong>第5条（紹介手数料）</strong><br />1. パートナーは、当社が提供する専用のQRコードを経由してアプリ利用者が有料会員登録を行った場合、当社所定の紹介手数料（以下「手数料」といいます。）を受け取ることができます。<br />2. 手数料は、有料会員の月額利用料金の30%とします。<br />3. 手数料は、月末締めで計算し、翌々月15日にパートナーが指定する銀行口座へ振り込むものとします。ただし、振込額の合計が3,000円に満たない場合は、支払いは翌月以降に繰り越されるものとします。</p>
                            <p><strong>第6条（全額返金保証）</strong><br />1. 本サービスの利用開始から1年経過した時点で、パートナーが受け取った手数料の累計額が、支払った年間のパートナー費用（39,600円）に満たなかった場合、パートナーは当社に対し、支払った費用の全額返金を請求することができます。<br />2. 本保証は、実店舗を有し、来店客への案内が可能なパートナーを対象とします。<br />3. 返金請求は、利用開始から1年経過後、30日以内に当社所定の方法で行うものとします。</p>
                            <p><strong>第7条（契約期間と解約）</strong><br />1. 本サービスの契約期間は、申込日を起算日として1年間とします。期間満了までにいずれかの当事者から解約の申し出がない場合、契約は同一条件で1年間自動更新されるものとし、以後も同様とします。<br />2. パートナーは、いつでも解約を申し出ることができますが、契約期間中の利用料金の返金は行わないものとします（第6条の全額返金保証を除く）。</p>
                            <p><strong>第8条（本サービスの提供の停止等）</strong><br />当社は、以下のいずれかの事由があると判断した場合、パートナーに事前に通知することなく本サービスの全部または一部の提供を停止または中断することができるものとします。<br />1. 本サービスにかかるコンピュータシステムの保守点検または更新を行う場合<br />2. 地震、落雷、火災、停電または天災などの不可抗力により、本サービスの提供が困難となった場合<br />3. その他、当社が本サービスの提供が困難と判断した場合</p>
                            <p><strong>第9条（免責事項）</strong><br />当社は、本サービスに起因してパートナーに生じたあらゆる損害について一切の責任を負いません。ただし、本サービスに関する当社とパートナーとの間の契約が消費者契約法に定める消費者契約となる場合、この免責規定は適用されません。</p>
                            <p><strong>第10条（準拠法・裁判管轄）</strong><br />本規約の解釈にあたっては、日本法を準拠法とします。本サービスに関して紛争が生じた場合には、当社の本店所在地を管轄する裁判所を専属的合意管轄とします。</p>
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button onClick={() => setShowTerms(false)} className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600">
                                閉じる
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PartnerSubscribePage;