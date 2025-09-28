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

const categoryData: { [key: string]: string[] } = { "飲食関連": ["レストラン・食堂", "カフェ・喫茶店", "居酒屋・バー", "パン屋（ベーカリー）", "和菓子・洋菓子店", "ラーメン店", "そば・うどん店", "寿司屋"], "買い物関連": ["農産物直売所・青果店", "精肉店・鮮魚店", "個人経営の食料品店", "酒店", "ブティック・衣料品店", "雑貨店・民芸品店", "書店", "花屋", "お土産店"], "美容・健康関連": ["美容室・理容室", "ネイルサロン", "エステサロン", "リラクゼーション・マッサージ", "整体・整骨院・鍼灸院", "個人経営の薬局", "クリニック・歯科医院"], "住まい・暮らし関連": ["工務店・建築・リフォーム", "水道・電気工事", "不動産会社", "クリーニング店", "造園・植木屋", "便利屋"], "教育・習い事関連": ["学習塾・家庭教師", "ピアノ・音楽教室", "英会話教室", "書道・そろばん教室", "スポーツクラブ・道場", "パソコン教室", "料理教室"], "車・バイク関連": ["自動車販売店・自動車整備・修理工場", "ガソリンスタンド", "バイクショップ"], "観光・レジャー関連": ["ホテル・旅館・ペンション", "日帰り温泉施設", "観光施設・美術館・博物館", "体験工房（陶芸・ガラスなど）", "牧場・農園", "キャンプ場・グランピング施設", "ゴルフ場", "貸し別荘"], "ペット関連": ["動物病院", "トリミングサロン", "ペットホテル・ドッグラン"], "専門サービス関連": ["弁護士・税理士・行政書士などの士業", "デザイン・印刷会社", "写真館", "保険代理店", "カウンセリング", "コンサルティング"], };
const mainCategories = Object.keys(categoryData);

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

const PartnerSignupPage: NextPage = () => {
    const [storeName, setStoreName] = usePersistentState('partnerForm_storeName', '');
    const [address, setAddress] = usePersistentState('partnerForm_address', '');
    const [area, setArea] = usePersistentState('partnerForm_area', '');
    const [contactPerson, setContactPerson] = usePersistentState('partnerForm_contactPerson', '');
    const [phoneNumber, setPhoneNumber] = usePersistentState('partnerForm_phoneNumber', '');
    const [qrStandCount, setQrStandCount] = usePersistentState('partnerForm_qrStandCount', 0);
    const [email, setEmail] = usePersistentState('partnerForm_email', '');
    const [confirmEmail, setConfirmEmail] = usePersistentState('partnerForm_confirmEmail', '');
    const [password, setPassword] = usePersistentState('partnerForm_password', '');
    const [mainCategory, setMainCategory] = usePersistentState('partnerForm_mainCategory', '');
    const [selectedSubCategory, setSelectedSubCategory] = usePersistentState('partnerForm_selectedSubCategory', '');
    const [agreed, setAgreed] = usePersistentState('partnerForm_agreed', false);
    
    const [subCategoryOptions, setSubCategoryOptions] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [stripeError, setStripeError] = useState(false);
    
    const [showTerms, setShowTerms] = useState(false);
    const [showInvoiceEmail, setShowInvoiceEmail] = useState(false);
    const [invoiceEmailContent, setInvoiceEmailContent] = useState({ subject: '', body: '' });
    const [copied, setCopied] = useState('');

    const [registeredCount] = useState(32);
    const totalSlots = 100;
    const remainingSlots = totalSlots - registeredCount;

    const registrationFormRef = useRef<HTMLDivElement>(null);

    useEffect(() => { if (!stripePromise) { console.error("Stripe key missing"); setStripeError(true); } }, []);
    useEffect(() => { const match = address.match(/(那須塩原市|那須郡那須町|那須町|大田原市)/); if (match) { setArea(match[0].replace('那須郡', '')); } else if (address) { setArea(''); } }, [address]);
    useEffect(() => { if (mainCategory) { setSubCategoryOptions(categoryData[mainCategory] || []); } else { setSubCategoryOptions([]); } }, [mainCategory]);

    const scrollToForm = () => {
        registrationFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const handleInvoiceClick = () => {
        if (!storeName || !contactPerson || !phoneNumber || !email) {
            setError('請求書払いをご希望の場合も、先にお申し込みフォームの必須項目（店舗名、担当者名、電話番号、メールアドレスなど）をご入力ください。');
            setShowInvoiceEmail(false);
            scrollToForm();
            return;
        }
        
        setError(null);
        
        const subject = "【みんなの那須アプリ】請求書払い（年額プラン）希望";
        const body = `以下の情報でお申し込みいたします。\n担当者より折り返しご連絡ください。\n\n・店舗名／企業名：${storeName}\n・ご担当者名：${contactPerson}\n・お電話番号：${phoneNumber}\n・メールアドレス：${email}\n・住所：${address}\n・カテゴリ：${mainCategory} - ${selectedSubCategory}\n・QRスタンド希望個数：${qrStandCount}`;
        
        setInvoiceEmailContent({ subject, body });
        setShowInvoiceEmail(true);
    };

    const handleCopy = (text: string, field: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(field);
            setTimeout(() => setCopied(''), 2000);
        }).catch(err => {
            console.error('コピーに失敗しました', err);
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!stripePromise) { setStripeError(true); return; }
        if (email !== confirmEmail) { setError('メールアドレスが一致しません。'); return; }
        if (!agreed) { setError('利用規約および返金保証の条件への同意が必要です。'); return; }
        if (!area) { setError('住所は那須塩原市、那須町、大田原市のいずれかである必要があります。'); return; }
        if (!selectedSubCategory) { setError('カテゴリ（小分類）を選択してください。'); return; }
        if (password.length < 6) { setError('パスワードは6文字以上で入力してください。'); return; }
        setIsLoading(true);
        try {
            const response = await fetch('/api/partner/create-checkout-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ storeName, address, area, contactPerson, phoneNumber, qrStandCount, email, password, category: { main: mainCategory, sub: selectedSubCategory } }),
            });
            const { sessionId, error: apiError } = await response.json();
            if (apiError) throw new Error(apiError);
            if (sessionId) {
                Object.keys(window.sessionStorage).forEach(key => { if (key.startsWith('partnerForm_')) { window.sessionStorage.removeItem(key); } });
                const stripe = await stripePromise;
                if (stripe) {
                    const { error } = await stripe.redirectToCheckout({ sessionId });
                    if (error) throw new Error(error.message ?? 'Stripeリダイレクトエラー');
                } else throw new Error('Stripeの初期化に失敗');
            } else throw new Error('決済セッションの作成に失敗');
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

    return (
        <div className="bg-gray-50 text-gray-800 font-sans">
            <header className="bg-white shadow-md sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-800">みんなの那須アプリ</h1>
                    <button onClick={scrollToForm} className="bg-orange-500 text-white font-bold py-2 px-6 rounded-full hover:bg-orange-600 transition duration-300 shadow-lg animate-pulse">
                        リスクゼロですぐ始める
                    </button>
                </div>
            </header>
            <main className="container mx-auto px-6">
                <section className="text-center py-16 md:py-24">
                    <p className="text-orange-500 font-semibold">adtownからのご提案【もし、毎月安定した収益が自動で入ってきたら？】</p>
                    <h2 className="text-4xl md:text-5xl font-extrabold mt-4 leading-tight">
                        「広告費を無駄に
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
                        <p className="mt-2 text-sm text-gray-500">登録は3分、リスクはゼロです。</p>
                    </div>
                </section>
                <section className="bg-yellow-100 border-t-4 border-b-4 border-yellow-400 text-yellow-900 p-6 rounded-lg shadow-md my-12 text-center">
                    <h3 className="text-2xl font-bold">【先着100店舗様 限定】初期費用<span className="text-red-600"> 0円 </span>キャンペーン実施中！</h3>
                    <p className="mt-2 text-lg">
                        月額3,300円のパートナー制度（アプリ広告出し放題＆紹介手数料で収入アップ）を、今なら初期費用<span className="font-bold text-red-600">完全無料</span>で始められます。さらに、1年後の**全額返金保証**もご用意しました。
                    </p>
                    <div className="mt-4 bg-white p-4 rounded-lg flex items-center justify-center space-x-2 md:space-x-4 max-w-md mx-auto">
                        <p className="text-md md:text-lg font-semibold">現在の申込店舗数:</p>
                        <div className="text-2xl md:text-3xl font-extrabold text-gray-800 tracking-wider bg-gray-100 px-3 py-1 rounded">{registeredCount}店舗</div>
                        <p className="text-md md:text-lg font-semibold text-red-600">残り {remainingSlots} 枠！</p>
                    </div>
                </section>
                <section className="mt-20 bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-gray-200">
                    <div className="max-w-4xl mx-auto text-center">
                        <UsersIcon className="w-12 h-12 mx-auto text-orange-500 mb-4" />
                        <h3 className="text-3xl font-extrabold">なぜ今、アプリ広告なのか？答えは「圧倒的な見込み客」です。</h3>
                        <p className="mt-6 text-lg text-gray-600 leading-relaxed">
                            『みんなの那須アプリ』は、ほとんどの機能が<strong className="text-orange-600 font-bold">無料</strong>で使えるため、地域の住民にとって「ないと損」なアプリになりつつあります。
                            先行登録者はすでに<strong className="text-orange-600 font-bold">3,000人</strong>を突破。口コミでその輪は確実に広がり、<strong className="text-orange-600 font-bold">5,000人、10,000人</strong>の巨大なユーザーコミュニティへと成長します。
                            貴店の広告は、この<strong className="font-bold">爆発的に増え続ける「未来の常連客」</strong>に直接届くのです。
                        </p>
                        {/* ▼▼▼【ここが新しいセクションです】▼▼▼ */}
                        <div className="mt-8">
                             <p className="mb-4 text-gray-600">実際のアプリの利用者向けページも、ぜひその目でお確かめください。</p>
                            <a 
                                href="https://minna-no-nasu-app.netlify.app/" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="inline-block bg-blue-500 text-white font-bold py-3 px-8 rounded-full hover:bg-blue-600 transition duration-300 shadow-lg"
                            >
                                実際のアプリ紹介ページを見る
                            </a>
                        </div>
                    </div>
                </section>
                <section className="mt-20">
                    <h3 className="text-3xl font-extrabold text-center">なぜ「QRコード」を置くだけで「毎月の安定収益」に変わるのか？</h3>
                    <p className="mt-4 text-center text-gray-600 max-w-3xl mx-auto">お客様が貴店をきっかけにQRコードから無料登録して、有料会員になると、その売上の30%が**永続的に貴店の収益**となります。その驚くほど簡単な仕組みをご覧ください。</p>
                    <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        <div className="text-center p-6 bg-white rounded-lg shadow-lg">
                            <div className="bg-orange-500 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">1</div>
                            <h4 className="text-xl font-bold">お客様が「無料」で登録</h4>
                            <p className="mt-2 text-gray-600">貴店に置かれたQRコードスタンド（無料提供）から、お客様はお役立ち満載の約50個のアプリが永久無料で使い放題！**無料プラン**に登録します。</p>
                        </div>
                        <div className="text-center p-6 bg-white rounded-lg shadow-lg">
                                <div className="bg-orange-500 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">2</div>
                            <h4 className="text-xl font-bold">「年間9.3万円の損」に気づく</h4>
                            <p className="mt-2 text-gray-600">アプリを使ううち、お客様は「各店舗の割引クーポンや特典で節約」「フードロスの割引商品の情報で節約」「フリマで売って稼ぐ」「お手伝いで稼ぐ」といった有料機能を使わないと**年間93,000円以上も損をしている**事実に気づきます。</p>
                        </div>
                        <div className="text-center p-6 bg-white rounded-lg shadow-lg">
                            <div className="bg-orange-500 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">3</div>
                            <h4 className="text-xl font-bold">貴店に「継続収益」が発生します</h4>
                            <p className="mt-2 text-gray-600">お客様が月額480円の有料プランに移行した瞬間、貴店に**紹介料(売上の30%)**が発生。利用し続ける限り、**毎月144円×人数分**が自動で積み上がります。</p>
                        </div>
                    </div>
                        <div className="mt-12 text-center bg-green-50 border-t-4 border-green-400 p-6 rounded-lg">
                            <p className="text-xl font-bold text-green-800">つまり、月額3,300円のパートナー費用は、わずか23人のお客様が有料会員になるだけで回収でき、それ以降はすべて貴店の「利益」に変わり広告も出し放題で好循環の流れになります。</p>
                    </div>
                </section>
                <section className="mt-20 bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-gray-200">
                    <h3 className="text-3xl font-extrabold text-center">もし、1日にたった2人または5人のお客様が登録したら？</h3>
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-orange-50 p-8 rounded-lg border-2 border-dashed border-orange-300">
                            <h4 className="font-bold text-xl text-center">例：カフェ・美容室の場合</h4>
                            <p className="text-center text-sm text-gray-600">1日に2人が有料会員に移行</p>
                                <p className="mt-4 text-center text-lg text-gray-700">2人/日 × 30日 = <span className="font-bold text-2xl text-orange-600">月60人</span>の紹介</p>
                                <p className="mt-2 text-center text-xl font-bold text-gray-800">月間紹介料: <span className="text-red-600">8,640円</span></p>
                                <p className="mt-4 text-center text-xl font-bold text-gray-800">年間収益: <span className="text-4xl font-extrabold text-red-600">103,680円</span></p>
                        </div>
                        <div className="bg-blue-50 p-8 rounded-lg border-2 border-dashed border-blue-300">
                            <h4 className="font-bold text-xl text-center">例：レストラン・居酒屋の場合</h4>
                                <p className="text-center text-sm text-gray-600">1日に5人が有料会員に移行</p>
                                <p className="mt-4 text-center text-lg text-gray-700">5人/日 × 30日 = <span className="font-bold text-2xl text-blue-600">月150人</span>の紹介</p>
                                <p className="mt-2 text-center text-xl font-bold text-gray-800">月間紹介料: <span className="text-red-600">21,600円</span></p>
                                <p className="mt-4 text-center text-xl font-bold text-gray-800">年間収益: <span className="text-4xl font-extrabold text-red-600">259,200円</span></p>
                        </div>
                    </div>
                    <p className="mt-4 text-sm text-gray-500 text-center">※この収益は、広告掲載による本来の**集客効果とは別に**得られるものです。</p>
                </section>
                <section className="mt-20 text-center">
                    <h3 className="text-2xl font-bold text-gray-700">すでに那須地域の多くの店舗様がこのチャンスに気づいています</h3>
                    <div className="mt-8 flex flex-wrap justify-center items-center gap-x-8 gap-y-6 opacity-80">
                        {['/images/partner-adtown.png', '/images/partner-aquas.png', '/images/partner-aurevoir.png', '/images/partner-celsiall.png', '/images/partner-dairin.png', '/images/partner-kanon.png', '/images/partner-kokoro.png', '/images/partner-meithu.png', '/images/partner-midcityhotel.png', '/images/partner-nikkou.png', '/images/partner-oluolu.png', '/images/partner-omakaseauto.png', '/images/partner-poppo.png', '/images/partner-Quattro.png', '/images/partner-sekiguchi02.png', '/images/partner-tonbo.png', '/images/partner-training_farm.png', '/images/partner-transunet.png', '/images/partner-yamabuki.png', '/images/partner-yamakiya.png'].map((logoPath, index) => (
                            <Image key={index} src={logoPath} alt={`パートナーロゴ ${index + 1}`} width={150} height={50} className="object-contain" />
                        ))}
                    </div>
                </section>
                <section className="mt-20 text-center">
                    <h3 className="text-3xl font-extrabold">安心のトリプルサポート体制</h3>
                    <p className="mt-4 text-gray-600 max-w-2xl mx-auto">導入後も、専任の担当者が貴店を徹底的にサポートします。ITが苦手な方でも安心してご利用いただけます。</p>
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                        <div className="bg-white p-6 rounded-lg shadow-md border"><PhoneIcon className="w-10 h-10 mx-auto text-blue-500"/><p className="mt-4 font-bold text-lg">お電話サポート</p></div>
                        <div className="bg-white p-6 rounded-lg shadow-md border"><MessageCircleIcon className="w-10 h-10 mx-auto text-green-500"/><p className="mt-4 font-bold text-lg">LINEチャットサポート</p></div>
                        <div className="bg-white p-6 rounded-lg shadow-md border"><UserCheckIcon className="w-10 h-10 mx-auto text-orange-500"/><p className="mt-4 font-bold text-lg">専任担当者</p></div>
                    </div>
                </section>
                <section className="mt-20 max-w-4xl mx-auto">
                    <h3 className="text-3xl font-extrabold text-center">よくある質問</h3>
                    <div className="mt-8 bg-white p-4 md:p-8 rounded-2xl shadow-xl border">
                        <FAQItem question="本当にリスクはないのですか？（全額返金保証について）">
                            <p className="leading-relaxed font-bold text-orange-600">はい、貴店にリスクは一切ありません。</p>
                            <p className="mt-2 leading-relaxed">もし1年間で得られた紹介手数料の合計が、年間のパートナー費用（39,600円）に満たなかった場合、お支払いいただいた費用を<strong className="font-bold">全額返金</strong>いたします。これは、私達がこの仕組みに絶対的な自信を持っている証拠です。<br/><span className="text-xs text-gray-500">※全額返金保証は、お客様が来店される実店舗様が対象となります。</span></p>
                        </FAQItem>
                        <FAQItem question="QRコードスタンドは有料ですか？">
                            <p className="leading-relaxed">いいえ、<strong className="font-bold">制作費は完全に無料</strong>です。お申し込み後、貴店専用のQRコードスタンドを必要数お作りし、お届けいたします。テーブルやレジ横に置くだけで、すぐに始められます。不足した場合は、追加も可能です。</p>
                        </FAQItem>
                        <FAQItem question="紹介料は本当に毎月振り込まれますか？">
                            <p className="leading-relaxed">はい、もちろんです。紹介料は月末締めで計算し、翌月15日にご登録いただいた銀行口座へ自動でお振込みいたします。振込額が3,000円に満たない場合は翌月に繰り越されますが、報酬が消えることはございませんのでご安心ください。</p>
                        </FAQItem>
                        <FAQItem question="契約の途中で解約はできますか？">
                            <p className="leading-relaxed">はい、いつでも解約手続きが可能です。ただし、本契約は1年単位での自動更新となっており、契約期間中のご返金は致しかねますのでご了承ください（全額返金保証を除く）。次回の更新日までに解約手続きをいただければ、追加の料金は発生いたしません。</p>
                        </FAQItem>
                    </div>
                </section>
                <section ref={registrationFormRef} id="registration-form" className="mt-20 pt-10">
                    <div className="bg-white p-8 md:p-12 rounded-2xl shadow-2xl w-full max-w-3xl mx-auto border border-gray-200">
                        <div className="text-center mb-10">
                            <p className="text-gray-700 leading-relaxed">
                                ここまでお読みいただきありがとうございます。<br/>
                                限定100店舗の初期費用無料キャンペーン枠は、すぐに埋まってしまうことが予想されます。<br/>
                                <strong className="text-red-600 font-bold">このチャンスを逃せば、101店舗目からは初期費用が発生いたします。もし1年間で得られた紹介手数料の合計が、年間のパートナー費用（39,600円）に満たなかった場合、お支払いいただいた費用を全額返金いたします。</strong><br/>
                            </p>
                        </div>
                        <h2 className="text-3xl font-bold text-center mb-2">パートナー登録 & 掲載お申し込み</h2>
                        <p className="text-center text-gray-600 mb-8">
                            全てのメリットを手に入れるために、以下のフォームをご入力ください。<br />
                            請求書払いをご希望の場合も、一度こちらにご入力の上、下部の「請求書払いのためのメールを作成」ボタンをクリックしてください。
                        </p>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div> <label className="block text-gray-700 font-medium mb-2">店舗名・企業名 *</label> <input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} required className="w-full px-4 py-2 border rounded-lg focus:ring-orange-500 focus:border-orange-500"/> </div>
                                <div> <label className="block text-gray-700 font-medium mb-2">ご担当者名 *</label> <input type="text" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} required className="w-full px-4 py-2 border rounded-lg focus:ring-orange-500 focus:border-orange-500"/> </div>
                            </div>
                            <div> <label className="block text-gray-700 font-medium mb-2">住所 *</label> <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} required placeholder="例：栃木県那須塩原市共墾社108-2" className="w-full px-4 py-2 border rounded-lg focus:ring-orange-500 focus:border-orange-500"/> {address && !area && <p className="text-red-500 text-xs mt-1">那須塩原市、那須町、大田原市のいずれかを入力してください。</p>} </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div> <label className="block text-gray-700 font-medium mb-2">カテゴリ（大分類）*</label> <select value={mainCategory} onChange={(e) => setMainCategory(e.target.value)} required className="w-full px-4 py-2 border rounded-lg bg-white focus:ring-orange-500 focus:border-orange-500"> <option value="">選択してください</option> {mainCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)} </select> </div>
                                <div> <label className="block text-gray-700 font-medium mb-2">QRコードスタンド希望個数 *</label> <input type="number" value={qrStandCount} onChange={(e) => setQrStandCount(Number(e.target.value))} required min="0" className="w-full px-4 py-2 border rounded-lg focus:ring-orange-500 focus:border-orange-500"/> </div>
                            </div>
                            {mainCategory && ( <div> <label className="block text-gray-700 font-medium mb-2">カテゴリ（小分類）*</label> <div className="mt-2 p-4 border rounded-lg grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 bg-gray-50"> {subCategoryOptions.map(subCat => ( <label key={subCat} className="flex items-center space-x-3 cursor-pointer"> <input type="radio" name="subCategory" className="h-4 w-4 text-orange-600 focus:ring-orange-500" checked={selectedSubCategory === subCat} onChange={() => setSelectedSubCategory(subCat)} /> <span className="text-gray-700">{subCat}</span> </label> ))} </div> </div> )}
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
                                            パートナー利用規約
                                        </button>
                                        および全額返金保証の条件に同意し、広告掲載および紹介料プログラム（月額3,300円/税込）へ申し込みます。
                                    </span>
                                </label>
                            </div>
                            {stripeError && ( <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md flex items-center"><XCircleIcon className="h-5 w-5 mr-3"/><p className="text-sm">決済設定が不完全なため、お申し込みを完了できません。サイト管理者にご連絡ください。</p></div> )}
                            {error && !stripeError && ( <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md flex items-center"><XCircleIcon className="h-5 w-5 mr-3"/><p className="text-sm">{error}</p></div> )}
                            <button type="submit" disabled={isLoading || !agreed || stripeError} className="w-full py-4 mt-4 text-white text-lg font-bold bg-gradient-to-r from-orange-500 to-red-500 rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300">
                                {getButtonText()}
                            </button>
                            <p className="text-sm text-center -mt-2 text-gray-500">クレジットカードでのお支払いは上記からお願いします。</p>
                        </form>
                        <p className="text-sm text-center mt-6">
                            すでにアカウントをお持ちですか？ <Link href="/partner/login/" className="text-orange-600 hover:underline font-medium">ログインはこちら</Link>
                        </p>
                    </div>
                </section>
                <section className="mt-20 bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-gray-200 text-center">
                    <h3 className="text-3xl font-extrabold mb-4">請求書でのお支払いをご希望の方へ</h3>
                    <p className="text-gray-600 mb-6">
                        御請求書にてのお支払いについては、年間39,600円を前払にてのご精算になります。<br />
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
                                        href={`mailto:1st.market.c@gmail.com?subject=${encodeURIComponent(invoiceEmailContent.subject)}&body=${encodeURIComponent(invoiceEmailContent.body)}`}
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
                                            <input type="text" readOnly value="1st.market.c@gmail.com" className="flex-1 px-3 py-2 border rounded-md bg-gray-100" />
                                            <button onClick={() => handleCopy('1st.market.c@gmail.com', 'to')} className="ml-2 px-3 py-2 bg-gray-200 rounded-md text-sm hover:bg-gray-300">{copied === 'to' ? 'コピー完了' : 'コピー'}</button>
                                        </div>
                                        <div className="flex items-center">
                                            <label className="w-20 text-sm font-medium text-gray-700">件名:</label>
                                            <input type="text" readOnly value={invoiceEmailContent.subject} className="flex-1 px-3 py-2 border rounded-md bg-gray-100" />
                                             <button onClick={() => handleCopy(invoiceEmailContent.subject, 'subject')} className="ml-2 px-3 py-2 bg-gray-200 rounded-md text-sm hover:bg-gray-300">{copied === 'subject' ? 'コピー完了' : 'コピー'}</button>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">本文:</label>
                                            <textarea readOnly value={invoiceEmailContent.body} rows={10} className="w-full px-3 py-2 border rounded-md bg-gray-100" />
                                            <button onClick={() => handleCopy(invoiceEmailContent.body, 'body')} className="mt-1 w-full px-3 py-2 bg-gray-200 rounded-md text-sm hover:bg-gray-300">{copied === 'body' ? 'コピー完了' : 'コピー'}</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
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

export default PartnerSignupPage;
