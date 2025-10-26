import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import Link from 'next/link';
import Image from 'next/image';
import { NextPage } from 'next';
import React, { useState, useEffect, useRef } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import Head from 'next/head';
import { useRouter } from 'next/router';

// --- 画像パスの定義（404エラーのパスをコメントアウト） ---
const PARTNER_LOGOS = [
    '/images/partner-adtown.png',
    '/images/partner-aquas.png',
    // '/images/partner-aurevoir.png', // 404
    '/images/partner-celsiall.png',
    '/images/partner-dairin.png',
    '/images/partner-kanon.png',
    '/images/partner-kokoro.png',
    '/images/partner-meithu.png',
    '/images/partner-midcityhotel.png',
    // '/images/partner-nikkou.png', // 404
    // '/images/partner-oluolu.png', // 404
    '/images/partner-omakaseauto.png',
    '/images/partner-poppo.png',
    // '/images/partner-Quattro.png', // 404
    '/images/partner-sekiguchi02.png',
    // '/images/partner-tonbo.png', // 404
    '/images/partner-training_farm.png',
    '/images/partner-transunet.png',
    // '/images/partner-yamabuki.png', // 存在確認
    '/images/partner-yamakiya.png'
];

// --- SVGアイコン ---
const UsersIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg> );
const XCircleIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg> );
const PhoneIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 .7 2.81 .2 2 0 0 1 22 16.92z"></path></svg> );
const MessageCircleIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg> );
const UserCheckIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><polyline points="17 11 19 13 23 9"></polyline></svg> );
const ChevronDownIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="6 9 12 15 18 9"></polyline></svg> );
const ZapIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg> );
const DownloadIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> );

const SERVICE_START_DATE = new Date('2025-11-01T00:00:00+09:00');
const SERVICE_START_DATE_STRING = '2025年11月1日';

const FAQItem = ({ question, children }: { question: string, children: React.ReactNode }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (<div className="border-b"><button onClick={() => setIsOpen(!isOpen)} className="w-full text-left py-5 flex justify-between items-center hover:bg-gray-50 transition-colors"><span className="text-lg font-medium text-gray-800 pr-2">{question}</span><ChevronDownIcon className={`w-6 h-6 text-orange-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} /></button>{isOpen && ( <div className="pb-5 pt-2 px-2 text-gray-600 bg-gray-50">{children}</div> )}</div>);
};

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) : null;

const AddRecruitServicePage: NextPage = () => {
    const router = useRouter();

    const [companyName, setCompanyName] = useState('');
    const [address, setAddress] = useState('');
    const [area, setArea] = useState('');
    const [contactPerson, setContactPerson] = useState('未入力'); 
    const [phoneNumber, setPhoneNumber] = useState('');
    const [email, setEmail] = useState('');
    const [agreed, setAgreed] = useState(false);

    // ★ 修正: 必要なStateを全て定義
    const [userId, setUserId] = useState<string | null>(null);
    const [isFirebaseLoading, setIsFirebaseLoading] = useState(true); // ★ 追加
    const [firebaseError, setFirebaseError] = useState<string | null>(null); // ★ 追加

    const [isDataLoading, setIsDataLoading] = useState(true);
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
        
        if (!auth || !db) {
             console.error("Firebase Auth or DB is not initialized.");
             setFirebaseError("Firebase設定がありません。");
             setIsFirebaseLoading(false);
             setIsDataLoading(false);
             return;
        }

        // 認証状態の監視とデータ取得
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user && user.email) {
                setUserId(user.uid); 
                try {
                    let userData: any = null;
                    // 複数のコレクションを検索
                    const refs = [doc(db, 'users', user.uid), doc(db, 'recruit_partners', user.uid), doc(db, 'partners', user.uid)];
                    for (const ref of refs) {
                        const userDocSnap = await getDoc(ref);
                        if (userDocSnap.exists()) {
                            userData = userDocSnap.data();
                            console.log(`Fetched data from ${ref.path}`);
                            break;
                        }
                    }

                    if (userData) {
                        const contact = userData.displayName || userData.contactPerson || user.email.split('@')[0] || '未入力';
                        setCompanyName(userData.companyName || userData.storeName || user.email.split('@')[0] || '');
                        setAddress(userData.address || '');
                        setContactPerson(contact);
                        setPhoneNumber(userData.phoneNumber || '');
                        setEmail(user.email);
                        
                        const match = (userData.address || '').match(/(那須塩原市|那須郡那須町|那須町|大田原市)/);
                        if (match) {
                            setArea(match[0].replace('那須郡', ''));
                        } else {
                            setArea('');
                        }
                    } else {
                        setError('ユーザープロファイル情報が見つかりませんでした。');
                        setEmail(user.email);
                        setContactPerson(user.email.split('@')[0] || '未入力');
                    }
                } catch (e: any) {
                    console.error("Error fetching user data:", e);
                    setError(`ユーザーデータ取得エラー: ${e.message}.`);
                    setFirebaseError(`ユーザーデータ取得エラー: ${e.message}.`);
                }
                setIsDataLoading(false);
                setIsFirebaseLoading(false); 
            } else {
                router.push('/partner/login');
            }
        });
        return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [router]);

    const isFormValid = !!(agreed); 

    const scrollToForm = () => {
        registrationFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const handleRegisterAndInvoice = async () => {
        setError(null);
        if (firebaseError || isFirebaseLoading) { setError("Firebaseが利用できません。"); return; } 
        if (!isFormValid) { 
            setError('お申し込みには利用規約への同意が必要です。'); 
            scrollToForm(); 
            return; 
        }
        if (!companyName || companyName === '未入力' || !address || !phoneNumber) {
            setError('企業名、住所、電話番号が未入力です。プロフィールを更新してください。');
            scrollToForm();
            return;
        }

        setIsInvoiceProcessing(true);
        setInvoiceDownloadSuccess(false);
        try {
            const response = await fetch('/api/auth/register-and-create-invoice', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    serviceType: 'recruit',
                    companyName, address, area, contactPerson, phoneNumber, email,
                    paymentMethod: 'invoice', billingCycle: 'annual',
                    existingUid: userId 
                }),
            });
            const data = await response.json();
            if (!response.ok || !data.pdfUrl) {
                throw new Error(data.error || '登録および請求書の作成に失敗しました。');
            }
            const link = document.createElement('a');
            link.href = data.pdfUrl;
            link.setAttribute('download', `invoice_${companyName}_${Date.now()}.pdf`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setInvoiceDownloadSuccess(true);
        } catch (err: any) {
            setError(err.message || '登録および請求書の自動生成に失敗しました。');
            setInvoiceDownloadSuccess(false);
        } finally {
            setIsInvoiceProcessing(false);
        }
    };
    
    const handleSubmit = async () => {
        setError(null);
        if (firebaseError || isFirebaseLoading) { setError("Firebaseが利用できません。"); return; } 
        if (!isFormValid) { 
            setError('お申し込みには利用規約への同意が必要です。'); 
            scrollToForm(); 
            return; 
        }
        if (!companyName || companyName === '未入力' || !address || !phoneNumber) {
            setError('企業名、住所、電話番号が未入力です。プロフィールを更新してください。');
            scrollToForm();
            return;
        }

        if (!stripePromise) { setStripeError(true); return; }
        setIsLoading(true);
        try {
            const trialEndDate = Math.floor(SERVICE_START_DATE.getTime() / 1000);

            // ★★★ ご要望の修正点 ★★★
            // 決済成功時のリダイレクト先を /partner/login (パートナーログイン) に指定
            const successUrl = `${window.location.origin}/partner/login`;
            const cancelUrl = window.location.href;

            const response = await fetch('/api/auth/register-and-subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    serviceType: 'recruit',
                    companyName, address, area, contactPerson, phoneNumber, email,
                    trialEndDate, paymentMethod: 'card', billingCycle: 'monthly',
                    existingUid: userId, 
                    success_url: successUrl, // ★ 成功時URLを渡す
                    cancel_url: cancelUrl   // ★ キャンセル時URLを渡す
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
        return 'クレジットカード決済で申し込む';
    };
    const getInvoiceButtonText = () => {
        if (isInvoiceProcessing) return '登録・請求書を作成中...';
        if (invoiceDownloadSuccess) return 'ダウンロード完了！再発行';
        return '請求書PDFをダウンロードして先行予約';
    };

    if (isDataLoading || isFirebaseLoading) { // ★ 修正
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-xl font-semibold">ユーザー情報を読み込んでいます...</div>
            </div>
        );
    }
    
    // プロフィール情報が不十分な場合のエラー表示
    if ((!companyName || companyName === '未入力') && (!contactPerson || contactPerson === '未入力')) { 
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <div className="bg-white p-8 rounded-xl shadow-2xl text-center max-w-lg">
                    <XCircleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">情報が不足しています</h1>
                    <p className="text-gray-700 mb-6">
                        既存のパートナー情報が不完全なため、自動入力ができませんでした。お手数ですが、<Link href="/partner/profile" className="text-blue-600 underline">広告パートナーダッシュボードのプロフィール画面</Link>で**企業名**と**担当者名**を登録してください。
                    </p>
                    <button
                        onClick={() => router.push('/partner/dashboard')}
                        className="mt-6 px-6 py-2 bg-indigo-600 text-white font-bold rounded-md hover:bg-indigo-700"
                    >
                        ダッシュボードに戻る
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 text-gray-800 font-sans">
            <Head>
                <title>{"AI求人サービス 追加お申し込み"}</title>
            </Head>
            <header className="bg-white shadow-md sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-800">AIマッチング求人</h1>
                    <button onClick={scrollToForm} className="bg-orange-500 text-white font-bold py-2 px-6 rounded-full hover:bg-orange-600 transition duration-300 shadow-lg">
                        追加で申し込む
                    </button>
                </div>
            </header>
            
            <main className="container mx-auto px-6">
                {/* Content Sections */}
                <section className="text-center pt-16 pb-8">
                    <h2 className="text-3xl font-bold text-gray-800">おかげさまで株式会社adtown20周年、感謝企画</h2>
                    <p className="mt-4 text-lg text-gray-600">みんなの那須アプリを開発しましたので、下記をご覧の上ご利用ください。</p>
                </section>
                <section className="text-center py-16 md:py-24">
                    <div className="mb-8 p-4 bg-indigo-100 border-l-4 border-indigo-500 rounded-r-lg max-w-4xl mx-auto">
                        <p className="font-bold text-indigo-800 text-lg">【先行予約受付中】サービス開始日: {SERVICE_START_DATE_STRING}</p>
                        <p className="text-sm text-indigo-700 mt-1">今お申し込みいただくと、企業の情報登録を完了して、サービス開始日からすぐにご利用いただけます。</p>
                    </div>
                    <p className="text-orange-500 font-semibold">地元の企業を応援する広告代理店 株式会社adtownからのご提案【大手企業に高い求人広告費を払い続けるのは、もうやめにしませんか？】</p>
                    <h2 className="text-4xl md:text-5xl font-extrabold mt-4 leading-tight text-center">
                        【先行予約】月額8,800円が、先着100社限定で6,600円！<br />
                        <span className="text-orange-600">求人マッチングAIで、理想の人材が見つかるまで。</span>
                    </h2>
                    <p className="mt-6 text-lg text-gray-600 max-w-3xl mx-auto">
                        求人広告の高騰、応募が来ない、理想の人材と出会えない…。そんな採用の<strong className="font-bold">「痛み」</strong>を、最先端のマッチングAIが根本から解決。必要な時にいつでも始められ、複数職種を登録することができ、採用が決まればいつでも停止できる、新しい採用の形をご提案します。
                    </p>
                    <div className="mt-8">
                        <button onClick={scrollToForm} className="bg-gradient-to-r from-orange-500 to-red-500 text-white font-extrabold py-4 px-10 rounded-full text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300">
                            先行予約に申し込む
                        </button>
                        <p className="mt-2 text-sm text-gray-500">いつでもキャンセル可能・成功報酬なし。</p>
                    </div>
                </section>
                <section className="mt-20 bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-gray-200">
                    <div className="max-w-4xl mx-auto text-center">
                        <UsersIcon className="w-12 h-12 mx-auto text-orange-500 mb-4" />
                        <h3 className="text-3xl font-extrabold">なぜ今、アプリ求人なのか？答えは「圧倒的な見込み客」です。</h3>
                        <p className="mt-6 text-lg text-gray-600 leading-relaxed">
                            『みんなの那須アプリ』は...<strong className="text-orange-600 font-bold">無料</strong>...<strong className="text-orange-600 font-bold">3,000人</strong>を突破...<strong className="font-bold">爆発的に増え続ける「未来の求職者」</strong>に直接届くのです。
                        </p>
                        <div className="mt-8">
                            <p className="text-lg text-gray-700 mb-4 font-semibold">地元の住民がすでに使っています。ぜひご確認ください。</p>
                            <a 
                                href="https://minna-no-nasu-app.netlify.app/"
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center bg-orange-600 text-white font-bold py-3 px-8 rounded-full hover:bg-orange-700 transition duration-300 shadow-md text-base"
                            >
                                アプリを確認
                            </a>
                        </div>
                    </div>
                </section>
                <section className="py-16 bg-white rounded-2xl shadow-lg mt-20">
                    <div className="text-center">
                        <h2 className="text-3xl font-extrabold text-gray-800">こんな「採用の悩み」ありませんか？</h2>
                        <p className="mt-4 text-gray-600 max-w-2xl mx-auto">一つでも当てはまれば、AIマッチングが解決します。</p></div>
                    <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                        <div className="p-6 text-center"><XCircleIcon className="w-12 h-12 mx-auto text-red-500" /><h3 className="mt-4 text-xl font-bold">コストが高い</h3><p className="mt-2 text-gray-600">...</p></div>
                        <div className="p-6 text-center"><UsersIcon className="w-12 h-12 mx-auto text-red-500" /><h3 className="mt-4 text-xl font-bold">応募が来ない</h3><p className="mt-2 text-gray-600">...</p></div>
                        <div className="p-6 text-center"><UserCheckIcon className="w-12 h-12 mx-auto text-red-500" /><h3 className="mt-4 text-xl font-bold">ミスマッチが多い</h3><p className="mt-2 text-gray-600">...</p></div>
                    </div>
                </section>
                <section className="mt-24">
                    <div className="text-center"><ZapIcon className="w-12 h-12 mx-auto text-orange-500"/><h2 className="mt-4 text-3xl font-extrabold text-gray-800">その悩み、AIが解決します。</h2><p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">...</p></div>
                    <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        <div className="p-6 text-center"><div className="bg-orange-500 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">1</div><h4 className="text-xl font-bold">カンタン求人作成</h4><p className="mt-2 text-gray-600">...</p></div>
                        <div className="p-6 text-center"><div className="bg-orange-500 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">2</div><h4 className="text-xl font-bold">AIが候補者を自動提案</h4><p className="mt-2 text-gray-600">...</p></div>
                        <div className="p-6 text-center"><div className="bg-orange-500 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">3</div><h4 className="text-xl font-bold">いつでも更新を停止</h4><p className="mt-2 text-gray-600">...</p></div>
                    </div>
                </section>
                <section className="mt-20 bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-gray-200">
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-3xl font-extrabold text-center mb-12">AIマッチング求人システム運用ガイド</h2>
                        <div className="mb-12">
                            <h3 className="text-2xl font-bold mb-4 pb-2 border-b-2 border-orange-500">1. AIマッチングの仕組み...</h3>
                            <p className="mb-6 text-gray-600 leading-relaxed">...</p>
                            <div className="overflow-x-auto">
                                {/* Table Content Placeholder */}
                                <table className="w-full text-left border-collapse"><thead><tr><th className="p-3 border">...</th></tr></thead><tbody><tr><td className="p-3 border">...</td></tr></tbody></table>
                            </div>
                        </div>
                        <div className="mb-12">
                            <h3 className="text-2xl font-bold mb-4 pb-2 border-b-2 border-orange-500">2. 企業パートナー向け運用ガイド</h3>
                            <h4 className="text-xl font-semibold mb-4">📄 使い方：登録から面接確約までの流れ</h4>
                             <div className="overflow-x-auto">
                                {/* Table Content Placeholder */}
                                <table className="w-full text-left border-collapse"><thead><tr><th className="p-3 border">...</th></tr></thead><tbody><tr><td className="p-3 border">...</td></tr></tbody></table>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold mb-4 pb-2 border-b-2 border-orange-500">3. 求職者ユーザー向け運用ガイド</h3>
                            <h4 className="text-xl font-semibold mb-4">📋 使い方：登録から面接確約までの流れ</h4>
                            <div className="overflow-x-auto">
                                {/* Table Content Placeholder */}
                                <table className="w-full text-left border-collapse"><thead><tr><th className="p-3 border">...</th></tr></thead><tbody><tr><td className="p-3 border">...</td></tr></tbody></table>
                            </div>
                        </div>
                    </div>
                </section>
                <section className="mt-24 text-center">
                    <h3 className="text-2xl font-bold text-gray-700">すでに那須地域の多くの企業様が...</h3>
                    <div className="mt-8 flex flex-wrap justify-center items-center gap-x-8 gap-y-6 opacity-80">
                        {PARTNER_LOGOS.map((logoPath, index) => (
                            <Image key={index} src={logoPath} alt={`パートナーロゴ ${index + 1}`} width={150} height={50} className="object-contain" unoptimized={true} />
                        ))}
                    </div>
                </section>
                <section className="mt-24 text-center">
                    <h3 className="text-3xl font-extrabold">安心のサポート体制</h3>
                    <p className="mt-4 text-gray-600 max-w-2xl mx-auto">...</p>
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                        <div className="p-6 text-center"><PhoneIcon className="w-10 h-10 mx-auto text-blue-500"/><p className="mt-4 font-bold text-lg">お電話サポート</p></div>
                        <div className="p-6 text-center"><MessageCircleIcon className="w-10 h-10 mx-auto text-green-500"/><p className="mt-4 font-bold text-lg">LINEチャットサポート</p></div>
                        <div className="p-6 text-center"><UserCheckIcon className="w-10 h-10 mx-auto text-orange-500"/><p className="mt-4 font-bold text-lg">専任担当者</p></div>
                    </div>
                </section>
                <section className="mt-24 max-w-4xl mx-auto">
                    <h3 className="text-3xl font-extrabold text-center">よくある質問</h3>
                    <div className="mt-8 bg-white p-4 md:p-8 rounded-2xl shadow-xl border">
                        <FAQItem question="本当に求める人材に出会えますか？"><p>...</p></FAQItem>
                        <FAQItem question="費用は本当にこれだけですか？成功報酬はありますか？"><p>...</p></FAQItem>
                        <FAQItem question="契約の途中で解約（停止）はできますか？"><p>...</p></FAQItem>
                    </div>
                </section>

                {/* Registration Form Section */}
                <section ref={registrationFormRef} id="registration-form" className="mt-24 pt-10">
                    <div className="bg-white p-8 md:p-12 rounded-2xl shadow-2xl w-full max-w-3xl mx-auto border border-gray-200">
                        <div className="text-center mb-10"><ZapIcon className="w-12 h-12 mx-auto text-orange-500 mb-4" /><h2 className="text-3xl font-bold text-center mb-2">AI求人サービス 追加お申し込み</h2><p className="text-center text-gray-600">...</p></div>
                        
                        {/* Loading/Error Display */}
                        {(isDataLoading || isFirebaseLoading) ? ( 
                             <div className="text-center p-4 bg-blue-50 text-blue-700 rounded-lg mb-6"><p>ユーザー情報を読み込んでいます...</p></div>
                        ) : firebaseError ? ( 
                             <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md flex items-center mb-6"><XCircleIcon className="h-5 w-5 mr-3"/><p className="text-sm">{firebaseError}</p></div>
                        ) : stripeError ? (
                             <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md flex items-center mb-6"><XCircleIcon className="h-5 w-5 mr-3"/><p className="text-sm">決済設定エラーが発生しました。</p></div>
                        ) : error ? (
                             <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md flex items-center mb-6"><XCircleIcon className="h-5 w-5 mr-3"/><p className="text-sm">{error}</p></div>
                        ) : null}

                        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div> <label className="block text-gray-700 font-medium mb-2">企業名・店舗名 *</label> <input type="text" value={companyName} readOnly className="w-full px-4 py-2 border rounded-lg bg-gray-100 cursor-not-allowed"/> </div>
                                <div> <label className="block text-gray-700 font-medium mb-2">ご担当者名 *</label> <input type="text" value={contactPerson} readOnly className="w-full px-4 py-2 border rounded-lg bg-gray-100 cursor-not-allowed"/> </div>
                            </div>
                            <div> <label className="block text-gray-700 font-medium mb-2">住所 *</label> <input type="text" value={address} readOnly className="w-full px-4 py-2 border rounded-lg bg-gray-100 cursor-not-allowed"/> </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                                <div> <label className="block text-gray-700 font-medium mb-2">電話番号 *</label> <input type="tel" value={phoneNumber} readOnly className="w-full px-4 py-2 border rounded-lg bg-gray-100 cursor-not-allowed"/> </div>
                                <div> <label className="block text-gray-700 font-medium mb-2">メールアドレス *</label> <input type="email" value={email} readOnly className="w-full px-4 py-2 border rounded-lg bg-gray-100 cursor-not-allowed"/> </div>
                            </div>
                            <div className="pt-4">
                                <label className="flex items-start">
                                    <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 h-5 w-5 text-orange-600 focus:ring-orange-500 rounded"/>
                                    <span className="ml-3 text-sm text-gray-600">
                                        <button type="button" onClick={() => setShowTerms(true)} className="text-blue-600 hover:underline">
                                            パートナー利用規約
                                        </button>
                                        に同意します。
                                    </span>
                                </label>
                            </div>
                            
                            <button type="button" onClick={handleSubmit} disabled={isLoading || !isFormValid || stripeError || isDataLoading || isFirebaseLoading} className="w-full py-4 mt-4 text-white text-lg font-bold bg-gradient-to-r from-orange-500 to-red-500 rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300">
                                {getButtonText()}
                            </button>
                            <p className="text-sm text-center -mt-2 text-gray-500">クレジットカードでのお支払いは上記からお願いします。</p>
                        </form>
                    </div>
                </section>
                <section className="mt-12 bg-white rounded-2xl shadow-xl p-8 md:p-12 w-full max-w-3xl mx-auto border border-gray-200 text-center">
                    <h3 className="text-3xl font-extrabold mb-4">請求書でのお支払いをご希望の方へ</h3>
                    <p className="text-gray-600 mb-6">...</p> {/* Shortened */}
                    {invoiceDownloadSuccess && (
                        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-md flex items-center justify-center mb-4 max-w-md mx-auto">
                            <DownloadIcon className="h-5 w-5 mr-3"/>
                            <p className="text-sm font-bold">請求書のダウンロードを開始しました！</p>
                        </div>
                    )}
                    <button
                        onClick={handleRegisterAndInvoice}
                        disabled={isInvoiceProcessing || !isFormValid || isDataLoading || isFirebaseLoading} // ★ 修正
                        className="inline-flex items-center justify-center w-full max-w-md py-4 text-white text-lg font-bold bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg hover:shadow-lg disabled:opacity-50 transition-all duration-300"
                    >
                        {isInvoiceProcessing && <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                        <DownloadIcon className="w-5 h-5 mr-2" />
                        {getInvoiceButtonText()}
                    </button>
                    {!isFormValid && <p className="text-red-500 text-sm mt-2">※ PDFダウンロードには、規約への同意が必要です。</p>}
                </section>
            </main>
            <footer className="bg-white mt-20 border-t">
                <div className="container mx-auto px-6 py-8 text-center text-gray-600">
                    <p>&copy; {new Date().getFullYear()} 株式会社adtown. All Rights Reserved.</p>
                    <div className="mt-4">
                        <Link href="/legal/" className="text-sm text-gray-500 hover:underline mx-2">特定商取引法に基づく表記</Link>
                        <Link href="/privacy" className="text-sm text-gray-500 hover:underline mx-2">プライバシーポリシー</Link>
                    </div>
                </div>
            </footer>
            {/* 利用規約モーダル */}
            {showTerms && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
                        <h2 className="text-xl font-bold mb-4 border-b pb-2">AIマッチング求人 利用規約</h2>
                        <div className="overflow-y-auto space-y-4 pr-2">
                             {/* Full Terms Content */}
                             <p><strong>第1条（適用）</strong><br/>本規約は、株式会社adtown（以下「当社」といいます。）が提供するAIマッチング求人サービス（以下「本サービス」といいます。）の利用に関する一切の関係に適用されます。</p>
                            <p><strong>第2条（利用登録）</strong><br/>1. 本サービスの利用を希望する者（以下「登録希望者」）は、本規約に同意の上、当社の定める方法によって利用登録を申請するものとします。<br/>2. 当社は、当社の基準に従って、登録希望者の登録の可否を判断し、当社が登録を認める場合にはその旨を登録希望者に通知します。利用登録は、当社が本項の通知を行ったことをもって完了したものとします。<br/>3. 当社は、登録希望者が、以下の各号のいずれかの事由に該当する場合は、登録を拒否することがあり、またその理由について一切開示義務を負いません。</p>
                            <ul className="list-disc list-inside pl-4 text-sm">
                                <li>当社に提供した登録事項の全部または一部につき虚偽、誤記または記載漏れがあった場合</li>
                                <li>反社会的勢力等（暴力団、暴力団員、その他これに準ずる者を意味します。以下同じ。）である、または資金提供その他を通じて反社会的勢力等の維持、運営もしくは経営に協力もしくは関与する等反社会的勢力等との何らかの交流もしくは関与を行っていると当社が判断した場合</li>
                                <li>過去当社との契約に違反した者またはその関係者であると当社が判断した場合</li>
                                <li>その他、当社が登録を適当でないと判断した場合</li>
                            </ul>
                            <p><strong>第3条（利用料金及び支払方法）</strong><br/>1. 利用者は、本サービスの利用の対価として、当社が別途定める利用料金を、当社が指定する支払方法により当社に支払うものとします。利用料金は月額8,800円（税込）とします。<br/>2. 支払方法はクレジットカード決済または銀行振込（定価105,600円を年額一括の割引価格92,400円（税込）のみ「求人を停止しても返金はございません」）とします。<br/>3. 利用契約は毎月自動的に更新されるものとし、利用者はいつでも管理画面から次回の更新をキャンセルすることができます。月の途中で解約した場合でも、日割り返金は行われません。</p>
                            <p><strong>第4条（ユーザーID及びパスワードの管理）</strong><br/>1. 利用者は、自己の責任において、本サービスのユーザーID及びパスワードを適切に管理及び保管するものとし、これを第三者に利用させ、または貸与、譲渡、名義変更、売買等をしてはならないものとします。<br/>2. ユーザーIDまたはパスワードの管理不十分、使用上の過誤、第三者の使用等によって生じた損害に関する責任は利用者が負うものとし、当社は一切の責任を負いません。</p>
                            <p><strong>第5条（禁止事項）</strong><br/>利用者は、本サービスの利用にあたり、以下の各号のいずれかに該当する行為または該当すると当社が判断する行為をしてはなりません。<br/>
                            <ul className="list-disc list-inside pl-4 text-sm">
                                <li>法令に違反する行為または犯罪行為に関連する行為</li>
                                <li>当社、本サービスの他の利用者またはその他の第三者に対する詐欺または脅迫行為</li>
                                <li>公序良俗に反する行為</li>
                                <li>当社、本サービスの他の利用者またはその他の第三者の知的財産権、肖像権、プライバシーの権利、名誉、その他の権利または利益を侵害する行為</li>
                                <li>本サービスのネットワークまたはシステム等に過度な負荷をかける行為</li>
                                <li>当社のサービスの運営を妨害するおそれのある行為</li>
                                <li>その他、当社が不適切と判断する行為</li>
                            </ul>
                            </p>
                            <p><strong>第6条（本サービスの停止等）</strong><br/>当社は、以下のいずれかの事由があると判断した場合、パートナーに事前に通知することなく、本サービスの全部または一部の提供を停止または中断することができるものとします。<br/>
                            <ul className="list-disc list-inside pl-4 text-sm">
                                <li>本サービスに係るコンピューター・システムの点検または保守作業を緊急に行う場合</li>
                                <li>コンピューター、通信回線等が事故により停止した場合</li>
                                <li>地震、落雷、火災、停電、天災地変などの不可抗力により本サービスの運営ができなくなった場合</li>
                                <li>その他、当社が停止または中断を必要と判断した場合</li>
                            </ul>
                            </p>
                            <p><strong>第7条（契約の解約）</strong><br/>利用者は、当社所定の方法で当社に通知することにより、本サービスを解約し、自己の利用者としての登録を抹消することができます。解約にあたり、利用者は当社に対して負っている債務がある場合は、その一切について当然に期限の利益を失い、直ちに当社に対して全ての債務の支払を行わなければなりません。</p>
                            <p><strong>第8条（免責事項）</strong><br/>当社は、本サービスが利用者の特定の目的に適合すること、期待する機能・商品的価値・正確性・有用性を有すること、利用者による本サービスの利用が利用者に適用のある法令または業界団体の内部規則等に適合すること、及び不具合が生じないことについて、何ら保証するものではありません。また、当社は、本サービスから得られる情報の完全性、正確性、確実性、有用性等について、いかなる保証も行わないものとします。</p>
                            <p><strong>第9条（本規約等の変更）</strong><br/>当社は、当社が必要と認めた場合は、本規約を変更できるものとします。本規約を変更する場合、変更後の本規約の施行時期及び内容を当社のウェブサイト上での掲示その他の適切な方法により周知し、または利用者に通知します。但し、法令上利用者の同意が必要となるような内容の変更の場合は、当社所定の方法で利用者の同意を得るものとします。</p>
                            <p><strong>第10条（準拠法及び管轄裁判所）</strong><br/>1. 本規約及びサービス利用契約の準拠法は日本法とします。<br/>2. 本規約またはサービス利用契約に起因し、または関連する一切の紛争については、宇都宮地方裁判所を第一審の専属的合意管轄裁判所とします。</p>
                        </div>
                        <div className="mt-6 flex justify-end"><button onClick={() => setShowTerms(false)} className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600">閉じる</button></div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AddRecruitServicePage;
