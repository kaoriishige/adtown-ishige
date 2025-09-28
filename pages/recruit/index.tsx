import Link from 'next/link';
import Image from 'next/image';
import { NextPage } from 'next';
import { useState, useEffect, useRef } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import React from 'react';

// --- インラインSVGアイコンコンポーネンﾄ ---
const UsersIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg> );
const XCircleIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg> );
const PhoneIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg> );
const MessageCircleIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg> );
const UserCheckIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><polyline points="17 11 19 13 23 9"></polyline></svg> );
const ChevronDownIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="6 9 12 15 18 9"></polyline></svg> );
const ZapIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg> );

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
    )
};

const usePersistentState = (key: string, defaultValue: any) => {
    const [state, setState] = useState(() => {
        if (typeof window === 'undefined') { return defaultValue; }
        try { const storedValue = window.sessionStorage.getItem(key); return storedValue ? JSON.parse(storedValue) : defaultValue; } catch (error) { console.error(error); return defaultValue; }
    });
    useEffect(() => {
        if (typeof window !== 'undefined') {
            try { window.sessionStorage.setItem(key, JSON.stringify(state)); } catch (error) { console.error(error); }
        }
    }, [key, state]);
    return [state, setState];
};

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) : null;

const RecruitPartnerPage: NextPage = () => {
    const [companyName, setCompanyName] = usePersistentState('recruitForm_companyName', '');
    const [address, setAddress] = usePersistentState('recruitForm_address', '');
    const [contactPerson, setContactPerson] = usePersistentState('recruitForm_contactPerson', '');
    const [phoneNumber, setPhoneNumber] = usePersistentState('recruitForm_phoneNumber', '');
    const [email, setEmail] = usePersistentState('recruitForm_email', '');
    const [confirmEmail, setConfirmEmail] = usePersistentState('recruitForm_confirmEmail', '');
    const [password, setPassword] = usePersistentState('recruitForm_password', '');
    const [agreed, setAgreed] = usePersistentState('recruitForm_agreed', false);
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [stripeError, setStripeError] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    const [showInvoiceEmail, setShowInvoiceEmail] = useState(false);
    const [invoiceEmailContent, setInvoiceEmailContent] = useState({ subject: '', body: '' });
    const [copied, setCopied] = useState('');

    const registrationFormRef = useRef<HTMLDivElement>(null);

    useEffect(() => { if (!stripePromise) { console.error("Stripe key missing"); setStripeError(true); } }, []);
    
    const scrollToForm = () => {
        registrationFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const handleInvoiceClick = () => {
        if (!companyName || !contactPerson || !phoneNumber || !email) {
            setError('請求書払いをご希望の場合も、先にフォームの必須項目（企業名、担当者名、電話番号、メールアドレスなど）をご入力ください。');
            setShowInvoiceEmail(false);
            scrollToForm();
            return;
        }
        setError(null);
        const subject = "【AIマッチング求人】請求書払い（年額プラン）希望";
        const body = `以下の情報で年間プランを申し込みます。\n請求書の発行をお願いいたします。\n\n・企業名／店舗名：${companyName}\n・ご担当者名：${contactPerson}\n・お電話番号：${phoneNumber}\n・メールアドレス：${email}\n・所在地：${address}`;
        setInvoiceEmailContent({ subject, body });
        setShowInvoiceEmail(true);
    };

    const handleCopy = (text: string, field: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(field);
            setTimeout(() => setCopied(''), 2000);
        }).catch(err => { console.error('コピーに失敗しました', err); });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!stripePromise) { setStripeError(true); return; }
        if (email.trim() !== confirmEmail.trim()) { setError('メールアドレスが一致しません。'); return; }
        if (!agreed) { setError('利用規約への同意が必要です。'); return; }
        if (password.length < 6) { setError('パスワードは6文字以上で入力してください。'); return; }
        setIsLoading(true);

        try {
            const registerResponse = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    password,
                    displayName: companyName,
                    role: 'recruit',
                }),
            });

            if (!registerResponse.ok) {
                const errorData = await registerResponse.json();
                throw new Error(errorData.message || 'アカウント作成に失敗しました。');
            }

            const { uid } = await registerResponse.json();

            const stripeResponse = await fetch('/api/recruit/create-subscription-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    uid,
                    email,
                    companyName,
                    trialEndDate: '2025-11-01' 
                }),
            });
            
            const stripeData = await stripeResponse.json();
            if (!stripeResponse.ok) {
                throw new Error(stripeData.error?.message || '決済ページの作成に失敗しました。');
            }

            const { sessionId } = stripeData;
            if (sessionId) {
                const stripe = await stripePromise;
                if (stripe) {
                    await stripe.redirectToCheckout({ sessionId });
                }
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const getButtonText = () => {
        if (isLoading) return '処理中...';
        if (stripeError) return '決済設定エラー';
        return '先行登録を完了する';
    };

    return (
        <div className="bg-gray-50 text-gray-800 font-sans">
            <header className="bg-white shadow-md sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-800">AIマッチング求人</h1>
                    <button onClick={scrollToForm} className="bg-orange-500 text-white font-bold py-2 px-6 rounded-full hover:bg-orange-600 transition duration-300 shadow-lg animate-pulse">
                        先行登録はこちら
                    </button>
                </div>
            </header>
            <main className="container mx-auto px-6">
                <section className="text-center py-16 md:py-24">
                    <p className="text-orange-500 font-semibold">【2025年11月1日サービス開始】</p>
                    <h2 className="text-4xl md:text-5xl font-extrabold mt-4 leading-tight">
                        AI採用、はじまる。<br />
                        <span className="text-orange-600">先行登録で、最高のスタートを。</span>
                    </h2>
                    <p className="mt-6 text-lg text-gray-600 max-w-3xl mx-auto">
                        求人広告の常識が変わります。**2025年11月1日**より、月額3,300円で理想の人材と出会えるAIマッチング求人がスタート。今ご登録いただくと、**サービス開始日まで料金は一切かかりません。** 最高の採用機会を、リスクゼロで確保してください。
                    </p>
                    <div className="mt-8">
                        <button onClick={scrollToForm} className="bg-gradient-to-r from-orange-500 to-red-500 text-white font-extrabold py-4 px-10 rounded-full text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300">
                           今すぐ無料で先行登録する
                        </button>
                        <p className="mt-2 text-sm text-gray-500">課金は11月1日から。いつでもキャンセル可能。</p>
                    </div>
                </section>
                
                <section className="py-16 bg-white rounded-2xl shadow-lg">
                    <div className="text-center">
                        <h2 className="text-3xl font-extrabold text-gray-800">こんな「採用の悩み」ありませんか？</h2>
                        <p className="mt-4 text-gray-600 max-w-2xl mx-auto">一つでも当てはまれば、AIマッチングが解決します。</p>
                    </div>
                    <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                        <div className="p-6 text-center">
                            <XCircleIcon className="w-12 h-12 mx-auto text-red-500" />
                            <h3 className="mt-4 text-xl font-bold">コストが高い</h3>
                            <p className="mt-2 text-gray-600">多額の広告費を払っても、良い人材からの応募があるとは限らない。</p>
                        </div>
                        <div className="p-6 text-center">
                            <UsersIcon className="w-12 h-12 mx-auto text-red-500" />
                            <h3 className="mt-4 text-xl font-bold">応募が来ない</h3>
                            <p className="mt-2 text-gray-600">そもそも求人を見てもらえず、応募が全く集まらない。</p>
                        </div>
                        <div className="p-6 text-center">
                            <UserCheckIcon className="w-12 h-12 mx-auto text-red-500" />
                            <h3 className="mt-4 text-xl font-bold">ミスマッチが多い</h3>
                            <p className="mt-2 text-gray-600">応募は来るが、求めるスキルや人柄と合わず、採用に至らない。</p>
                        </div>
                    </div>
                </section>

                <section className="mt-24">
                    <div className="text-center">
                        <ZapIcon className="w-12 h-12 mx-auto text-orange-500"/>
                        <h2 className="mt-4 text-3xl font-extrabold text-gray-800">その悩み、AIが解決します。</h2>
                        <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">従来の「待ち」の求人とは違い、AIが貴社に最適な人材を「探し出し」ます。<br/>採用活動が驚くほどシンプルに変わる、その仕組みをご覧ください。</p>
                    </div>
                    <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        <div className="text-center p-6 bg-white rounded-lg shadow-lg">
                            <div className="bg-orange-500 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">1</div>
                            <h4 className="text-xl font-bold">カンタン求人作成</h4>
                            <p className="mt-2 text-gray-600">求めるスキルや人物像を数分で入力。AIが貴社のニーズを深く学習し、最適な人材像を定義します。</p>
                        </div>
                        <div className="text-center p-6 bg-white rounded-lg shadow-lg">
                            <div className="bg-orange-500 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">2</div>
                            <h4 className="text-xl font-bold">AIが候補者を自動提案</h4>
                            <p className="mt-2 text-gray-600">AIが地域の求職者データベースから、貴社にマッチする可能性の高い人材を自動でリストアップ。待っているだけで、会いたい人材の情報が届きます。</p>
                        </div>
                        <div className="text-center p-6 bg-white rounded-lg shadow-lg">
                            <div className="bg-orange-500 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">3</div>
                            <h4 className="text-xl font-bold">いつでも更新を停止</h4>
                            <p className="mt-2 text-gray-600">採用が決まればいつでも次回の更新を停止。必要な期間だけ利用でき、無駄なコストはかかりません。</p>
                        </div>
                    </div>
                </section>
                
                <section className="mt-24 py-16 bg-blue-50 rounded-2xl">
                    <div className="text-center">
                        <h2 className="text-3xl font-extrabold text-gray-800">求人は、このアプリに掲載されます</h2>
                        <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
                            作成された求人情報は、那須地域の情報アプリ『みんなの那須アプリ』内に新設される「お仕事さがし」コーナーに掲載。**すでに3,000人を超える地域ユーザー**が、未来のあなたの従業員候補です。
                        </p>
                    </div>
                    <div className="mt-8 flex justify-center">
                        <a 
                            href="https://minna-no-nasu-app.netlify.app/" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="bg-blue-500 text-white font-bold py-3 px-8 rounded-full hover:bg-blue-600 transition duration-300 shadow-lg"
                        >
                            実際のアプリ（利用者向けページ）を見る
                        </a>
                    </div>
                </section>

                <section className="mt-24 text-center">
                    <h3 className="text-2xl font-bold text-gray-700">すでに那須地域の多くの企業様が先行登録に参加しています</h3>
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

                <section className="mt-24 max-w-4xl mx-auto">
                    <h3 className="text-3xl font-extrabold text-center">よくある質問</h3>
                    <div className="mt-8 bg-white p-4 md:p-8 rounded-2xl shadow-xl border">
                        <FAQItem question="先行登録の課金は本当に11月1日からですか？">
                            <p className="leading-relaxed">はい、お約束します。**2025年11月1日**になるまで、料金が請求されることは一切ありません。サービス開始前にキャンセルいただければ、費用は全くかかりません。</p>
                        </FAQItem>
                        <FAQItem question="費用は本当にこれだけですか？成功報酬はありますか？">
                            <p className="leading-relaxed"><strong className="font-bold">はい、月額3,300円（または年額39,600円）のみです。</strong>採用が何名決まっても、追加の成功報酬は一切いただきません。コストを気にせず、納得のいくまで採用活動に専念していただけます。</p>
                        </FAQItem>
                        <FAQItem question="契約の途中で解約（停止）はできますか？">
                             <p className="leading-relaxed">はい、いつでも管理画面から次回の更新を停止（解約）することができます。契約期間の縛りはありません。ただし、月の途中で停止した場合でも、日割りの返金はございませんのでご了承ください。</p>
                        </FAQItem>
                    </div>
                </section>
                
                <section ref={registrationFormRef} id="registration-form" className="mt-24 pt-10">
                    <div className="bg-white p-8 md:p-12 rounded-2xl shadow-2xl w-full max-w-3xl mx-auto border border-gray-200">
                         <div className="text-center mb-10">
                            <ZapIcon className="w-12 h-12 mx-auto text-orange-500 mb-4" />
                            <h2 className="text-3xl font-bold text-center mb-2">先行パートナー登録</h2>
                            <p className="text-center text-gray-600">アカウントと決済情報を登録し、11月1日のサービス開始に備えましょう。</p>
                        </div>
                        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-800 p-4 mb-8 rounded-md">
                            <p className="font-bold">最初の課金は【2025年11月1日】です。</p>
                            <p className="text-sm">それ以前に料金が発生することはありません。課金開始前であれば、いつでも無料でキャンセル可能です。</p>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div> <label className="block text-gray-700 font-medium mb-2">企業名・店舗名 *</label> <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required className="w-full px-4 py-2 border rounded-lg focus:ring-orange-500 focus:border-orange-500"/> </div>
                                <div> <label className="block text-gray-700 font-medium mb-2">ご担当者名 *</label> <input type="text" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} required className="w-full px-4 py-2 border rounded-lg focus:ring-orange-500 focus:border-orange-500"/> </div>
                            </div>
                            <div> <label className="block text-gray-700 font-medium mb-2">所在地 *</label> <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} required placeholder="例：栃木県那須塩原市共墾社108-2" className="w-full px-4 py-2 border rounded-lg focus:ring-orange-500 focus:border-orange-500"/> </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                                <div> <label className="block text-gray-700 font-medium mb-2">電話番号 *</label> <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required placeholder="例: 09012345678" className="w-full px-4 py-2 border rounded-lg focus:ring-orange-500 focus:border-orange-500"/> </div>
                                <div> <label className="block text-gray-700 font-medium mb-2">パスワード (6文字以上) *</label> <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="w-full px-4 py-2 border rounded-lg focus:ring-orange-500 focus:border-orange-500"/> </div>
                                <div> <label className="block text-gray-700 font-medium mb-2">メールアドレス *</label> <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-2 border rounded-lg focus:ring-orange-500 focus:border-orange-500"/> </div>
                                <div> <label className="block text-gray-700 font-medium mb-2">メールアドレス（確認用）*</label> <input type="email" value={confirmEmail} onChange={(e) => setConfirmEmail(e.target.value)} required className="w-full px-4 py-2 border rounded-lg focus:ring-orange-500 focus:border-orange-500"/> </div>
                            </div>
                            <div className="pt-4">
                                <label className="flex items-start">
                                    <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 h-5 w-5 text-orange-600 focus:ring-orange-500 rounded"/>
                                    <span className="ml-3 text-sm text-gray-600">
                                        <button type="button" onClick={() => setShowTerms(true)} className="text-blue-600 hover:underline">
                                            利用規約
                                        </button>
                                        に同意します。
                                    </span>
                                </label>
                            </div>
                            {stripeError && ( <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md flex items-center"><XCircleIcon className="h-5 w-5 mr-3"/><p className="text-sm">決済設定が不完全なため、お申し込みを完了できません。</p></div> )}
                            {error && ( <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md flex items-center"><XCircleIcon className="h-5 w-5 mr-3"/><p className="text-sm">{error}</p></div> )}
                            <button type="submit" disabled={isLoading || !agreed || stripeError} className="w-full py-4 mt-4 text-white text-lg font-bold bg-gradient-to-r from-orange-500 to-red-500 rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300">
                                {getButtonText()}
                            </button>
                        </form>
                         <p className="text-sm text-center mt-6">
                            すでにアカウントをお持ちですか？ <Link href="/recruit/login" className="text-orange-600 hover:underline font-medium">ログインはこちら</Link>
                        </p>
                    </div>
                </section>
                <section className="mt-20 bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-gray-200 text-center">
                    <h3 className="text-3xl font-extrabold mb-4">年間使い放題プラン（請求書払い）</h3>
                    <p className="text-gray-600 mb-6">
                        年間39,600円（税込）の一括前払いで、1年間求人を出し放題になるプランです。<br />
                        ご希望の方は、まず<strong className="text-orange-600">上記のフォームにご入力の上</strong>、以下のボタンからお問い合わせください。
                    </p>
                    <button
                        onClick={handleInvoiceClick}
                        className="inline-block w-full max-w-md py-4 text-white text-lg font-bold bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg hover:shadow-lg transition-all duration-300"
                    >
                        請求書払いのためのメールを作成
                    </button>
                    {showInvoiceEmail && (
                        <div className="mt-6 p-4 border rounded-lg bg-gray-50 max-w-3xl mx-auto text-left">
                            <p className="font-bold text-lg mb-4 text-center">メール内容の準備ができました</p>
                            <div className="space-y-4">
                                <div className="text-center">
                                    <p className="text-sm mb-2">① 下のボタンをクリックして、メールソフトを起動してください。</p>
                                    <a
                                        href={`mailto:adtown@able.ocn.ne.jp?subject=${encodeURIComponent(invoiceEmailContent.subject)}&body=${encodeURIComponent(invoiceEmailContent.body)}`}
                                        className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 inline-block font-bold"
                                    >
                                        メールソフトを起動して送信する
                                    </a>
                                </div>
                                <div className="text-center text-gray-600">または</div>
                                <div>
                                    <p className="text-sm mb-2 text-center">② 起動しない場合は、以下の内容をコピーしてメールでお送りください。</p>
                                    <div className="space-y-3">
                                        <div className="flex items-center">
                                            <label className="w-20 text-sm font-medium text-gray-700">宛先:</label>
                                            <input type="text" readOnly value="adtown@able.ocn.ne.jp" className="flex-1 px-3 py-2 border rounded-md bg-gray-100" />
                                            <button onClick={() => handleCopy('adtown@able.ocn.ne.jp', 'to')} className="ml-2 px-3 py-2 bg-gray-200 rounded-md text-sm hover:bg-gray-300">{copied === 'to' ? 'コピー完了' : 'コピー'}</button>
                                        </div>
                                        <div className="flex items-center">
                                            <label className="w-20 text-sm font-medium text-gray-700">件名:</label>
                                            <input type="text" readOnly value={invoiceEmailContent.subject} className="flex-1 px-3 py-2 border rounded-md bg-gray-100" />
                                            <button onClick={() => handleCopy(invoiceEmailContent.subject, 'subject')} className="ml-2 px-3 py-2 bg-gray-200 rounded-md text-sm hover:bg-gray-300">{copied === 'subject' ? 'コピー完了' : 'コピー'}</button>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">本文:</label>
                                            <textarea readOnly value={invoiceEmailContent.body} rows={8} className="w-full px-3 py-2 border rounded-md bg-gray-100" />
                                            <button onClick={() => handleCopy(invoiceEmailContent.body, 'body')} className="mt-1 w-full px-3 py-2 bg-gray-200 rounded-md text-sm hover:bg-gray-300">{copied === 'body' ? 'コピー完了' : 'コピー'}</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </section>
            </main>
            <footer className="bg-white mt-24 border-t">
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
                        <div className="overflow-y-auto space-y-4 pr-2 text-sm">
                            <p><strong>第1条（適用）</strong><br/>本規約は、株式会社adtown（以下「当社」）が提供するAIマッチング求人サービス（以下「本サービス」）の利用に関する一切の関係に適用されます。</p>
                            <p><strong>第2条（利用登録）</strong><br/>1. 本サービスの利用を希望する者（以下「登録希望者」）は、本規約に同意の上、当社の定める方法によって利用登録を申請するものとします。<br/>2. 当社が申請を承認し、登録希望者に対して通知を行った時点で、利用契約が成立するものとします。<br/>3. 当社は、登録希望者に以下の事由があると判断した場合、利用登録の申請を承認しないことがあり、その理由については一切の開示義務を負わないものとします。<br/>　(1) 登録事項に虚偽、誤記または記載漏れがあった場合<br/>　(2) 本規約に違反したことがある者からの申請である場合<br/>　(3) その他、当社が利用登録を相当でないと判断した場合</p>
                            <p><strong>第3条（利用料金と支払方法）</strong><br/>1. 本サービスの利用料金は、月額3,300円（税込）とします。<br/>2. 先行登録期間中に登録した場合、最初の課金は当社が別途定めるサービス開始日（2025年11月1日）に行われます。<br/>3. 利用契約は毎月自動的に更新されるものとし、利用者はいつでも次回の更新をキャンセルすることができます。月の途中で解約した場合でも、日割り返金は行いません。</p>
                            <p><strong>第4条（アカウントの管理）</strong><br/>1. 利用者は、自己の責任において、本サービスのユーザーIDおよびパスワードを管理するものとします。<br/>2. 利用者は、いかなる場合にも、ユーザーIDおよびパスワードを第三者に譲渡または貸与することはできません。</p>
                            <p><strong>第5条（禁止事項）</strong><br/>利用者は、本サービスの利用にあたり、以下の行為をしてはなりません。<br/>1. 法令または公序良俗に違反する行為<br/>2. 犯罪行為に関連する行為<br/>3. 当社のサーバーまたはネットワークの機能を破壊したり、妨害したりする行為<br/>4. 虚偽の情報を提供または掲載する行為<br/>5. 当社または第三者の知的財産権、肖像権、プライバシー、名誉その他の権利または利益を侵害する行為<br/>6. その他、当社が不適切と判断する行為</p>
                            <p><strong>第6条（本サービスの提供の停止等）</strong><br/>当社は、以下のいずれかの事由があると判断した場合、利用者に事前に通知することなく本サービスの全部または一部の提供を停止または中断することができるものとします。<br/>1. 本サービスにかかるシステムの保守点検または更新を行う場合<br/>2. 天災などの不可抗力により、本サービスの提供が困難となった場合<br/>3. その他、当社が本サービスの提供が困難と判断した場合</p>
                            <p><strong>第7条（知的財産権）</strong><br/>本サービスに含まれる文章、画像、プログラムその他のコンテンツに関する知的財産権は、すべて当社または当社にライセンスを許諾している者に帰属します。</p>
                            <p><strong>第8条（免責事項）</strong><br/>1. 当社は、本サービスに起因して利用者に生じたあらゆる損害について一切の責任を負いません。<br/>2. 当社は、本サービスを通じて行われる利用者と求職者との間のやり取りや契約に関して、一切関与せず、責任を負いません。</p>
                            <p><strong>第9条（規約の変更）</strong><br/>当社は、必要と判断した場合には、利用者に通知することなくいつでも本規約を変更することができるものとします。</p>
                            <p><strong>第10条（準拠法・裁判管轄）</strong><br/>本規約の解釈にあたっては、日本法を準拠法とします。本サービスに関して紛争が生じた場合には、当社の本店所在地を管轄する裁判所を専属的合意管轄とします。</p>
                            <p className="mt-4 text-xs text-gray-500">※本利用規約はサンプルです。実際の運用にあたっては、弁護士等の専門家にご相談ください。</p>
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

export default RecruitPartnerPage;


