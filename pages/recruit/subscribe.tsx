import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import React from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { app } from '../../lib/firebase';
import { adminDb, getPartnerUidFromCookie } from '../../lib/firebase-admin';

// --- 型定義 ---
interface UserData {
    uid: string;
    companyName: string;
    address: string;
    contactPerson: string;
    phoneNumber: string;
    email: string;
}

interface PageProps {
    userData?: UserData;
    error?: string;
}

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


const FAQItem = ({ question, children }: { question: string, children: React.ReactNode }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (<div className="border-b"><button onClick={() => setIsOpen(!isOpen)} className="w-full text-left py-5 flex justify-between items-center hover:bg-gray-50 transition-colors"><span className="text-lg font-medium text-gray-800 pr-2">{question}</span><ChevronDownIcon className={`w-6 h-6 text-orange-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} /></button>{isOpen && ( <div className="pb-5 pt-2 px-2 text-gray-600 bg-gray-50">{children}</div> )}</div>);
};

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) : null;

// --- サーバーサイドでのデータ取得 ---
export const getServerSideProps: GetServerSideProps<PageProps> = async (context) => {
    try {
        const uid = await getPartnerUidFromCookie(context);
        if (!uid) { return { redirect: { destination: '/partner/login?redirect=/recruit/subscribe', permanent: false } }; }
        
        const userDoc = await adminDb.collection('users').doc(uid).get();
        if (!userDoc.exists) {
            context.res.setHeader('Set-Cookie', 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT');
            return { redirect: { destination: '/partner/login?error=user_not_found', permanent: false } };
        }
        const data = userDoc.data()!;

        // 既に求人パートナーとして登録済みの場合はダッシュボードへリダイレクト
        if (data.roles?.includes('recruit')) { return { redirect: { destination: '/recruit/dashboard', permanent: false } }; }

        const userData: UserData = {
            uid: uid,
            companyName: data.companyName || data.storeName || '',
            address: data.address || '',
            contactPerson: data.displayName || '', // displayNameを担当者として使用
            phoneNumber: data.phoneNumber || '',
            email: data.email || '',
        };
        return { props: { userData } };
    } catch (error) {
        console.error('Subscribe page getServerSideProps error:', error);
        context.res.setHeader('Set-Cookie', 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT');
        return { redirect: { destination: '/partner/login', permanent: false } };
    }
};

const RecruitSubscribePage: NextPage<PageProps> = ({ userData, error: serverError }) => {
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
        const auth = getAuth(app);
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
        });
        if (!stripePromise) { console.error("Stripe key missing"); setStripeError(true); }
        return () => unsubscribe();
    }, []);

    const scrollToForm = () => { registrationFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };

    // フォームの入力完了チェック (同意のみチェック)
    const isFormValid = !!(agreed && userData);


    /**
     * 【請求書払い】ログイン済みのユーザー情報を使って請求書を作成・ダウンロードさせる処理
     */
    const handleCreateInvoice = async () => {
        setError(null);

        if (!isFormValid || !userData) { 
            setError('請求書ダウンロードには、利用規約への同意が必要です。'); 
            scrollToForm(); 
            return; 
        }

        setIsInvoiceProcessing(true);
        setInvoiceDownloadSuccess(false);

        try {
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
                    serviceType: 'recruit', // 求人サービスとして指定
                    // 既存ユーザーとして処理するために必要な情報を渡す
                    companyName: userData.companyName, 
                    email: userData.email,
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
            link.setAttribute('download', `invoice_${userData.companyName}_${Date.now()}.pdf`);
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
        if (!isFormValid || !userData) { 
            setError('クレジットカード決済へ進むには、利用規約への同意が必要です。'); 
            scrollToForm(); 
            return; 
        }
        if (!stripePromise || !currentUser) { setStripeError(true); return; }

        setIsLoading(true);
        try {
            const idToken = await currentUser.getIdToken();

            // 統一APIを呼び出し、Stripe Checkoutセッションを作成
            const response = await fetch('/api/recruit/create-subscription', { // 既存のサブスクAPIを使用
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`,
                },
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'サーバーエラーが発生しました。');

            const { sessionId } = data;
            if (sessionId) {
                const stripe = await stripePromise;
                if (stripe) {
                    await stripe.redirectToCheckout({ sessionId });
                } else { throw new Error('Stripeの初期化に失敗しました。'); }
            } else { throw new Error('決済セッションの作成に失敗しました。'); }
        } catch (err: any) {
            setError(err.message || '不明なエラーが発生しました');
            setIsLoading(false);
        }
    };

    const getButtonText = () => {
        if (isLoading) return '処理中...';
        if (stripeError) return '決済設定エラー';
        return 'カードで支払う (月額3,300円)';
    };

    const getInvoiceButtonText = () => {
        if (isInvoiceProcessing) return '請求書を作成中...';
        if (invoiceDownloadSuccess) return 'ダウンロード完了！再発行';
        return '請求書PDFをダウンロードして登録';
    };


    if (serverError || !userData) {
        return (
            <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 p-4">
                <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-2xl border">
                    <h2 className="text-2xl font-bold mb-4 text-red-600">エラー</h2>
                    <p className="text-gray-800 mb-6 bg-red-50 p-4 rounded-md text-left">
                        <strong>エラー内容:</strong> {serverError || "ユーザー情報を取得できませんでした。再度ログインしてください。"}
                    </p>
                    <Link href="/partner/login?redirect=/recruit/subscribe" className="text-blue-600 hover:underline">
                        ログインページに戻る
                    </Link>
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

                <section className="mt-24 max-w-4xl mx-auto">
                    <h3 className="text-3xl font-extrabold text-center">よくある質問</h3>
                    <div className="mt-8 bg-white p-4 md:p-8 rounded-2xl shadow-xl border">
                        <FAQItem question="本当に求める人材に出会えますか？"><p className="leading-relaxed">はい。当社のAIは、スキルや経験といった表面的な情報だけでなく、求職者の価値観や希望する働き方、貴社の社風などを多角的に分析し、マッチング精度を最大限に高めています。これにより、定着率の高い、貴社にとって本当に価値のある採用を実現します。</p></FAQItem>
                        <FAQItem question="費用は本当にこれだけですか？成功報酬はありますか？"><p className="leading-relaxed"><strong className="font-bold">はい、月額3,300円（または年額39,600円）のみです。</strong>採用が何名決まっても、追加の成功報酬は一切いただきません。コストを気にせず、納得のいくまで採用活動に専念していただけます。</p></FAQItem>
                        <FAQItem question="契約の途中で解約（停止）はできますか？"><p className="leading-relaxed">はい、いつでも管理画面から次回の更新を停止（解約）することができます。契約期間の縛りはありません。ただし、月の途中で停止した場合でも、日割りの返金はございませんのでご了承ください。</p></FAQItem>
                    </div>
                </section>

                <section ref={registrationFormRef} id="registration-form" className="mt-24 pt-10">
                    <div className="bg-white p-8 md:p-12 rounded-2xl shadow-2xl w-full max-w-3xl mx-auto border border-gray-200">
                        <div className="text-center mb-10">
                            <ZapIcon className="w-12 h-12 mx-auto text-orange-500 mb-4" />
                            <h2 className="text-3xl font-bold">AI求人サービス お申し込み</h2>
                            <p className="text-gray-600 mt-2">ご登録済みの情報が自動入力されています。内容をご確認の上、お支払い方法を選択してください。</p>
                        </div>
                        
                        {/* 登録情報表示 */}
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
                                <button onClick={handleSubmit} disabled={isLoading || !isFormValid || stripeError} className="w-full py-3 mt-4 text-white font-bold bg-gradient-to-r from-orange-500 to-red-500 rounded-lg disabled:opacity-50">
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
                                    disabled={isInvoiceProcessing || !isFormValid} 
                                    className="inline-flex items-center justify-center w-full py-3 mt-4 text-white font-bold bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg disabled:opacity-50"
                                >
                                    {isInvoiceProcessing && <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                                    <DownloadIcon className="w-5 h-5 mr-2" />
                                    {getInvoiceButtonText()}
                                </button>
                                {!isFormValid && <p className="text-red-500 text-sm mt-2">※ PDFダウンロードには、利用規約への同意が必要です。</p>}
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

export default RecruitSubscribePage;