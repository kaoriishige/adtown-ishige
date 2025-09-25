import Link from 'next/link';
import Image from 'next/image'; // エラー回避とパフォーマンス向上のため、Imageコンポーネントを使用
import { NextPage } from 'next';
import { useState, useEffect, useRef } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import React from 'react'; // FAQItemコンポーネントでReact.ReactNodeを使用するためインポート

// --- インラインSVGアイコンコンポーネンﾄ ---
const ZapIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
);
const UsersIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
);
const BarChartIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg>
);
const XCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
);
const PhoneIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
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

// --- FAQ Item Component ---
const FAQItem = ({ question, children }: { question: string, children: React.ReactNode }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full text-left py-5 flex justify-between items-center hover:bg-gray-50 transition-colors">
                <span className="text-lg font-medium text-gray-800 pr-2">{question}</span>
                <ChevronDownIcon className={`w-6 h-6 text-orange-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="pb-5 pt-2 px-2 text-gray-600 bg-gray-50">
                    {children}
                </div>
            )}
        </div>
    )
};

// --- カテゴリデータ ---
// 型定義を追加して@ts-ignoreを削除
const categoryData: { [key: string]: string[] } = {
    "飲食関連": ["レストラン・食堂", "カフェ・喫茶店", "居酒屋・バー", "パン屋（ベーカリー）", "和菓子・洋菓子店", "ラーメン店", "そば・うどん店", "寿司屋"],
    "買い物関連": ["農産物直売所・青果店", "精肉店・鮮魚店", "個人経営の食料品店", "酒店", "ブティック・衣料品店", "雑貨店・民芸品店", "書店", "花屋", "お土産店"],
    "美容・健康関連": ["美容室・理容室", "ネイルサロン", "エステサロン", "リラクゼーション・マッサージ", "整体・整骨院・鍼灸院", "個人経営の薬局", "クリニック・歯科医院"],
    "住まい・暮らし関連": ["工務店・建築・リフォーム", "水道・電気工事", "不動産会社", "クリーニング店", "造園・植木屋", "便利屋"],
    "教育・習い事関連": ["学習塾・家庭教師", "ピアノ・音楽教室", "英会話教室", "書道・そろばん教室", "スポーツクラブ・道場", "パソコン教室", "料理教室"],
    "車・バイク関連": ["自動車販売店・自動車整備・修理工場", "ガソリンスタンド", "バイクショップ"],
    "観光・レジャー関連": ["ホテル・旅館・ペンション", "日帰り温泉施設", "観光施設・美術館・博物館", "体験工房（陶芸・ガラスなど）", "牧場・農園", "キャンプ場・グランピング施設", "ゴルフ場", "貸し別荘"],
    "ペット関連": ["動物病院", "トリミングサロン", "ペットホテル・ドッグラン"],
    "専門サービス関連": ["弁護士・税理士・行政書士などの士業", "デザイン・印刷会社", "写真館", "保険代理店", "カウンセリング", "コンサルティング"],
};
const mainCategories = Object.keys(categoryData);

// --- フォームの入力内容をブラウザのタブを閉じるまで保持するカスタムフック ---
const usePersistentState = (key: string, defaultValue: any) => {
    const [state, setState] = useState(() => {
        if (typeof window === 'undefined') {
            return defaultValue;
        }
        try {
            const storedValue = window.sessionStorage.getItem(key);
            return storedValue ? JSON.parse(storedValue) : defaultValue;
        } catch (error) {
            console.error(`Error reading sessionStorage key “${key}”:`, error);
            return defaultValue;
        }
    });

    useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                window.sessionStorage.setItem(key, JSON.stringify(state));
            } catch (error) {
                console.error(`Error writing sessionStorage key “${key}”:`, error);
            }
        }
    }, [key, state]);

    return [state, setState];
};

// StripeのPromiseを一度だけ生成
const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
    : null;


const PartnerSignupPage: NextPage = () => {
    // --- State定義 ---
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

    const [registeredCount] = useState(32);
    const totalSlots = 100;
    const remainingSlots = totalSlots - registeredCount;

    const registrationFormRef = useRef<HTMLDivElement>(null);

    // Stripeキーの存在チェック
    useEffect(() => {
        if (!stripePromise) {
            console.error("Stripe public key is not defined. Payment form will be disabled.");
            setStripeError(true);
        }
    }, []);

    // --- 住所からエリアを抽出 ---
    useEffect(() => {
        const match = address.match(/(那須塩原市|那須郡那須町|那須町|大田原市)/);
        if (match) {
            setArea(match[0].replace('那須郡', '')); // '那須郡那須町'を'那須町'に統一
        } else if (address) {
            setArea('');
        }
    }, [address, setArea]);

    // --- カテゴリ選択ロジック ---
    useEffect(() => {
        if (mainCategory) {
            setSubCategoryOptions(categoryData[mainCategory] || []);
        } else {
            setSubCategoryOptions([]);
        }
    }, [mainCategory]);

    // --- 登録フォームへのスクロール ---
    const scrollToForm = () => {
        registrationFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    // --- 送信処理 ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!stripePromise) {
            setStripeError(true);
            return;
        }
        if (email !== confirmEmail) { setError('メールアドレスが一致しません。'); return; }
        if (!agreed) { setError('利用規約への同意が必要です。'); return; }
        if (!area) { setError('住所は那須塩原市、那須町、大田原市のいずれかである必要があります。'); return; }
        if (!selectedSubCategory) { setError('カテゴリ（小分類）を選択してください。'); return; }
        if (password.length < 6) { setError('パスワードは6文字以上で入力してください。'); return; }

        setIsLoading(true);

        try {
            const response = await fetch('/api/partner/create-checkout-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    storeName, address, area, contactPerson, phoneNumber, qrStandCount, email, password,
                    category: { main: mainCategory, sub: selectedSubCategory },
                }),
            });
            const { sessionId, error: apiError } = await response.json();
            if (apiError) throw new Error(apiError);
            if (sessionId) {
                Object.keys(window.sessionStorage).forEach(key => {
                    if (key.startsWith('partnerForm_')) {
                        window.sessionStorage.removeItem(key);
                    }
                });
                const stripe = await stripePromise;
                if (stripe) {
                    const { error } = await stripe.redirectToCheckout({ sessionId });
                    if (error) {
                        throw new Error(error.message ?? 'Stripeへのリダイレクト中にエラーが発生しました。');
                    }
                } else {
                    throw new Error('Stripeの初期化に失敗しました。');
                }
            } else {
                throw new Error('決済セッションの作成に失敗しました。');
            }
        } catch (err: any) {
            setError(err.message || '不明なエラーが発生しました。');
            setIsLoading(false);
        }
    };

    const getButtonText = () => {
        if (isLoading) return '処理中...';
        if (stripeError) return '決済設定エラー';
        return '初期費用0円で決済に進む (月額3,300円)';
    };

    return (
        <div className="bg-gray-50 text-gray-800 font-sans">
            <header className="bg-white shadow-md sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-800">みんなの那須アプリ</h1>
                    <button onClick={scrollToForm} className="bg-orange-500 text-white font-bold py-2 px-6 rounded-full hover:bg-orange-600 transition duration-300 shadow-lg animate-pulse">
                        初期費用0円で申し込む
                    </button>
                </div>
            </header>

            <main className="container mx-auto px-6">
                <section className="text-center py-16 md:py-24">
                    <p className="text-orange-500 font-semibold">人手不足・物価高の時代に、売上を伸ばしたいオーナー様へ</p>
                    <h2 className="text-4xl md:text-5xl font-extrabold mt-4 leading-tight">
                        広告費を「コスト」から「利益」に変える。<br />
                        那須地域だけの新しい集客・収益化ツールです。
                    </h2>
                    <p className="mt-6 text-lg text-gray-600 max-w-3xl mx-auto">
                        『みんなの那須アプリ』は、ただの広告ではありません。人手不足や物価高騰で広告費をかけても売上が伸び悩む…。そんな悩みを解決するために生まれました。
                    </p>
                    <div className="mt-8">
                        <button onClick={scrollToForm} className="bg-gradient-to-r from-orange-500 to-red-500 text-white font-extrabold py-4 px-10 rounded-full text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300">
                            今すぐ初期費用無料で申し込む
                        </button>
                        <p className="mt-2 text-sm text-gray-500">登録はたった3分で完了！</p>
                    </div>
                </section>

                <section className="bg-yellow-100 border-t-4 border-b-4 border-yellow-400 text-yellow-900 p-6 rounded-lg shadow-md my-12 text-center">
                    <h3 className="text-2xl font-bold">【先着100店舗様 限定】初期費用<span className="text-red-600"> 0円 </span>キャンペーン実施中！</h3>
                    <p className="mt-2 text-lg">今なら通常発生する初期費用が<span className="font-bold text-red-600">完全無料</span>。リスクなく始められる絶好の機会です。</p>
                    <div className="mt-4 bg-white p-4 rounded-lg flex items-center justify-center space-x-2 md:space-x-4 max-w-md mx-auto">
                        <p className="text-md md:text-lg font-semibold">現在の申込店舗数:</p>
                        <div className="text-2xl md:text-3xl font-extrabold text-gray-800 tracking-wider bg-gray-100 px-3 py-1 rounded">{registeredCount}店舗</div>
                        <p className="text-md md:text-lg font-semibold text-red-600">残り {remainingSlots} 枠！</p>
                    </div>
                </section>
                
                <section className="mt-20 text-center">
                    <h3 className="text-2xl font-bold text-gray-700">すでに那須地域の多くの店舗様が参加を決めています</h3>
                    <div className="mt-8 flex flex-wrap justify-center items-center gap-x-8 gap-y-6 opacity-80">
                        {[
                            { name: 'おまかせオート石川', logo: '/images/partner-ishikawa.png' },
                            { name: '那須ミッドシティホテル', logo: '/images/partner-midcity.png' },
                            { name: 'オートギャラリーダイリン', logo: '/images/partner-dairin.png' },
                            { name: '株式会社パン・アキモト', logo: '/images/partner-akimoto.png' },
                            { name: '榊原会館', logo: '/images/partner-sakakibara.png' },
                            { name: '株式会社セルシオール', logo: '/images/partner-serusio-ru.png' },
                        ].map((partner) => (
                            <Image
                                key={partner.name}
                                src={partner.logo}
                                alt={partner.name}
                                width={150}
                                height={50}
                                className="object-contain"
                            />
                        ))}
                    </div>
                </section>

                <section className="mt-20">
                    <h3 className="text-3xl font-extrabold text-center">広告費が利益になる仕組み</h3>
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        <div className="border-4 border-red-300 rounded-xl p-6 bg-red-50 relative">
                            <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-1 rounded-full font-bold">従来の広告</div>
                            <h4 className="text-2xl font-bold text-center mt-4">従来の広告</h4>
                            <p className="text-center text-5xl font-extrabold text-red-500 mt-4">コスト</p>
                            <ul className="mt-6 space-y-2 text-gray-600 list-disc list-inside">
                                <li>効果が見えにくい</li>
                                <li>掲載して終わり</li>
                                <li>費用は常にマイナス</li>
                            </ul>
                        </div>
                        <div className="border-4 border-green-400 rounded-xl p-6 bg-green-50 relative">
                            <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-1 rounded-full font-bold">みんなの那須アプリ</div>
                            <h4 className="text-2xl font-bold text-center mt-4">このアプリ</h4>
                            <p className="text-center text-5xl font-extrabold text-green-600 mt-4">収益</p>
                            <ul className="mt-6 space-y-2 text-gray-700 list-disc list-inside">
                                <li>紹介料で利益が生まれる</li>
                                <li>継続的な収入源になる</li>
                                <li>広告費がプラスに変わる</li>
                            </ul>
                        </div>
                    </div>
                </section>

                <section className="mt-20 bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-gray-200">
                    <h3 className="text-3xl font-extrabold text-center">店舗タイプ別 収益シミュレーション</h3>
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-orange-50 p-8 rounded-lg border-2 border-dashed border-orange-300">
                            <h4 className="font-bold text-xl text-center">例：カフェの場合</h4>
                            <p className="text-center text-sm text-gray-600">1日に2人が登録した場合...</p>
                                <p className="mt-4 text-center text-lg text-gray-700">2人/日 × 30日 = <span className="font-bold text-2xl text-orange-600">60人</span>/月</p>
                                <p className="mt-2 text-center text-xl font-bold text-gray-800">月間収益: <span className="text-red-600">8,640円</span></p>
                                <p className="mt-4 text-center text-xl font-bold text-gray-800">年間収益: <span className="text-4xl font-extrabold text-red-600">103,680円</span></p>
                        </div>
                        <div className="bg-blue-50 p-8 rounded-lg border-2 border-dashed border-blue-300">
                            <h4 className="font-bold text-xl text-center">例：レストラン・居酒屋の場合</h4>
                                <p className="text-center text-sm text-gray-600">1日に5人が登録した場合...</p>
                                <p className="mt-4 text-center text-lg text-gray-700">5人/日 × 30日 = <span className="font-bold text-2xl text-blue-600">150人</span>/月</p>
                                <p className="mt-2 text-center text-xl font-bold text-gray-800">月間収益: <span className="text-red-600">21,600円</span></p>
                                <p className="mt-4 text-center text-xl font-bold text-gray-800">年間収益: <span className="text-4xl font-extrabold text-red-600">259,200円</span></p>
                        </div>
                    </div>
                    <p className="mt-4 text-sm text-gray-500 text-center">※紹介料は1人あたり144円 (月額480円×30%) で計算。これは広告掲載による集客効果とは別の収益です。</p>
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
                    <h3 className="text-3xl font-extrabold text-center">よくあるご質問</h3>
                    <div className="mt-8 bg-white p-4 md:p-8 rounded-2xl shadow-xl border">
                        <FAQItem question="本当にお金（紹介料）は振り込まれるのですか？">
                            <p className="leading-relaxed">はい、もちろんです。紹介料は月末締めで計算し、翌月15日にご登録いただいた銀行口座へ自動でお振込みいたします。振込額が3,000円に満たない場合は翌月に繰り越されますが、報酬が消えることはございませんのでご安心ください。</p>
                        </FAQItem>
                        <FAQItem question="支払いプランについて教えてください。">
                            <p className="leading-relaxed font-semibold text-gray-700">お支払い方法は、下記のプランからお選びいただけます。</p>
                                <ul className="list-disc list-inside mt-4 space-y-3">
                                    <li><strong className="font-bold text-gray-800">月額プラン：</strong>月額3,300円（税込）。当社指定の決済代行サービス（Stripe）を通じたクレジットカードでの自動支払いとなります。</li>
                                    <li><strong className="font-bold text-gray-800">年額プラン：</strong>年額39,600円（税込）。当社発行の請求書に基づく銀行振り込みによる一括前払いとなります。ご希望の場合は、登録フォーム入力後、別途お問い合わせください。</li>
                                </ul>
                        </FAQItem>
                        <FAQItem question="契約の途中で解約はできますか？">
                            <p className="leading-relaxed">はい、いつでも解約手続きが可能です。ただし、本契約は1年単位での自動更新となっており、契約期間中のご返金は致しかねますのでご了承ください。次回の更新日までに解約手続きをいただければ、追加の料金は発生いたしません。</p>
                        </FAQItem>
                        <FAQItem question="導入後のサポート体制はどうなっていますか？">
                                <p className="leading-relaxed">ご安心ください。各店舗様に専任の担当者がつき、導入から運用までしっかりサポートいたします。操作方法がわからない、もっと集客効果を上げたいなど、どんなことでもお気軽にご相談いただけます。LINE、お電話、メールでのサポートに対応しております。</p>
                        </FAQItem>
                    </div>
                </section>

                <section ref={registrationFormRef} id="registration-form" className="mt-20 pt-10">
                    <div className="bg-white p-8 md:p-12 rounded-2xl shadow-2xl w-full max-w-3xl mx-auto border border-gray-200">
                        <h2 className="text-3xl font-bold text-center mb-2">パートナー登録 & 掲載お申し込み</h2>
                        <p className="text-center text-gray-600 mb-8">全てのメリットを手に入れるために、以下のフォームをご入力ください。</p>
                        
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-gray-700 font-medium mb-2">店舗名・企業名 *</label>
                                    <input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} required className="w-full px-4 py-2 border rounded-lg focus:ring-orange-500 focus:border-orange-500"/>
                                </div>
                                <div>
                                    <label className="block text-gray-700 font-medium mb-2">ご担当者名 *</label>
                                    <input type="text" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} required className="w-full px-4 py-2 border rounded-lg focus:ring-orange-500 focus:border-orange-500"/>
                                </div>
                            </div>
                            <div>
                                <label className="block text-gray-700 font-medium mb-2">住所 *</label>
                                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} required placeholder="例：栃木県那須塩原市共墾社108-2" className="w-full px-4 py-2 border rounded-lg focus:ring-orange-500 focus:border-orange-500"/>
                                {address && !area && <p className="text-red-500 text-xs mt-1">那須塩原市、那須町、大田原市のいずれかを入力してください。</p>}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-gray-700 font-medium mb-2">カテゴリ（大分類）*</label>
                                    <select value={mainCategory} onChange={(e) => setMainCategory(e.target.value)} required className="w-full px-4 py-2 border rounded-lg bg-white focus:ring-orange-500 focus:border-orange-500">
                                        <option value="">選択してください</option>
                                        {mainCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-gray-700 font-medium mb-2">QRコードスタンド希望個数 *</label>
                                    <input type="number" value={qrStandCount} onChange={(e) => setQrStandCount(Number(e.target.value))} required min="0" className="w-full px-4 py-2 border rounded-lg focus:ring-orange-500 focus:border-orange-500"/>
                                </div>
                            </div>
                            {mainCategory && (
                                <div>
                                    <label className="block text-gray-700 font-medium mb-2">カテゴリ（小分類）*</label>
                                    <div className="mt-2 p-4 border rounded-lg grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 bg-gray-50">
                                        {subCategoryOptions.map(subCat => (
                                            <label key={subCat} className="flex items-center space-x-3 cursor-pointer">
                                                <input type="radio" name="subCategory" className="h-4 w-4 text-orange-600 focus:ring-orange-500" checked={selectedSubCategory === subCat} onChange={() => setSelectedSubCategory(subCat)} />
                                                <span className="text-gray-700">{subCat}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                                <div>
                                    <label className="block text-gray-700 font-medium mb-2">電話番号 *</label>
                                    <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required placeholder="例: 09012345678" className="w-full px-4 py-2 border rounded-lg focus:ring-orange-500 focus:border-orange-500"/>
                                </div>
                                <div>
                                    <label className="block text-gray-700 font-medium mb-2">パスワード (6文字以上) *</label>
                                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="w-full px-4 py-2 border rounded-lg focus:ring-orange-500 focus:border-orange-500"/>
                                </div>
                                <div>
                                    <label className="block text-gray-700 font-medium mb-2">メールアドレス *</label>
                                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-2 border rounded-lg focus:ring-orange-500 focus:border-orange-500"/>
                                </div>
                                <div>
                                    <label className="block text-gray-700 font-medium mb-2">メールアドレス（確認用）*</label>
                                    <input type="email" value={confirmEmail} onChange={(e) => setConfirmEmail(e.target.value)} required className="w-full px-4 py-2 border rounded-lg focus:ring-orange-500 focus:border-orange-500"/>
                                </div>
                            </div>

                            <div className="pt-4">
                                <label className="flex items-start">
                                    <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 h-5 w-5 text-orange-600 focus:ring-orange-500 rounded"/>
                                    <span className="ml-3 text-sm text-gray-600">
                                        「<a href="/partner/terms" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">パートナー利用規約</a>」に同意し、広告掲載および紹介料プログラム（月額3,300円/税込）へ申し込みます。本契約は1年単位での自動更新となります。
                                    </span>
                                </label>
                            </div>

                            {stripeError && (
                                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md flex items-center">
                                    <XCircleIcon className="h-5 w-5 mr-3"/>
                                    <p className="text-sm">決済設定が不完全なため、お申し込みを完了できません。サイト管理者にご連絡ください。</p>
                                </div>
                            )}
                            {error && !stripeError && (
                                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md flex items-center">
                                    <XCircleIcon className="h-5 w-5 mr-3"/>
                                    <p className="text-sm">{error}</p>
                                </div>
                            )}
                            
                            <button type="submit" disabled={isLoading || !agreed || stripeError} className="w-full py-4 mt-4 text-white text-lg font-bold bg-gradient-to-r from-orange-500 to-red-500 rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300">
                                {getButtonText()}
                            </button>
                            <p className="text-sm text-center -mt-2 text-gray-500">登録は3分で完了します</p>
                        </form>
                        <p className="text-sm text-center mt-6">
                            {/* ▼▼▼ 修正 ▼▼▼ */}
                            すでにアカウントをお持ちですか？ <Link href="/partner/login/" className="text-orange-600 hover:underline font-medium">ログインはこちら</Link>
                        </p>
                    </div>
                </section>
            </main>

            <footer className="bg-white mt-20 border-t">
                <div className="container mx-auto px-6 py-8 text-center text-gray-600">
                    <p>&copy; {new Date().getFullYear()} 株式会社adtown. All Rights Reserved.</p>
                    <div className="mt-4">
                        {/* ▼▼▼ 修正 ▼▼▼ */}
                        <Link href="/legal/" className="text-sm text-gray-500 hover:underline mx-2">特定商取引法に基づく表記</Link>
                        <Link href="/privacy" className="text-sm text-gray-500 hover:underline mx-2">プライバシーポリシー</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default PartnerSignupPage;