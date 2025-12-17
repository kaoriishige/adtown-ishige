import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { NextPage } from 'next';

// --- 画像パスの定義 (public/images/に配置されていることを前提とする) ---
const PARTNER_LOGOS = [
    '/images/partner-adtown.png',
    '/images/partner-aquas.png',
    '/images/partner-celsiall.png',
    '/images/partner-dairin.png',
    '/images/partner-kanon.png',
    '/images/partner-kokoro.png',
    '/images/partner-meithu.png',
    '/images/partner-midcityhotel.png',
    '/images/partner-omakaseauto.png',
    '/images/partner-poppo.png',
    '/images/partner-sekiguchi02.png',
    '/images/partner-training_farm.png',
    '/images/partner-transunet.png',
    '/images/partner-koharu.png',
    '/images/partner-yamakiya.png'
];

// --- Inline SVG Icon Components ---
interface CustomIconProps extends React.SVGProps<SVGSVGElement> {
    size?: number | string;
}

const UsersIcon = (props: CustomIconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
);
const XCircleIcon = (props: CustomIconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
    </svg>
);
const ChevronDownIcon = (props: CustomIconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <polyline points="6 9 12 15 18 9"/>
    </svg>
);
const ZapIcon = (props: CustomIconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
);
const ShoppingBagIcon = (props: CustomIconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
);

// --- FAQ Component ---
const FAQItem = ({ question, children }: { question: string, children: React.ReactNode }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full text-left py-5 flex justify-between items-center hover:bg-gray-50 transition-colors">
                <span className="text-lg font-medium text-gray-800 pr-2">{question}</span>
                <ChevronDownIcon className={`w-6 h-6 text-orange-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && ( <div className="pb-5 pt-2 px-2 text-gray-600 bg-gray-50 leading-relaxed">{children}</div> )}
        </div>
    );
};

const PartnerSignupPage: NextPage = () => {
    const router = useRouter();

    // --- Form States ---
    const [storeName, setStoreName] = useState('');
    const [address, setAddress] = useState('');
    const [area, setArea] = useState('');
    const [contactPerson, setContactPerson] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [email, setEmail] = useState('');
    const [confirmEmail, setConfirmEmail] = useState('');
    const [password, setPassword] = useState('');
    const [agreed, setAgreed] = useState(false);

    // --- UI States ---
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showTerms, setShowTerms] = useState(false);
    const [registeredCount] = useState(32);
    const totalSlots = 100;
    const remainingSlots = totalSlots - registeredCount;

    const registrationFormRef = useRef<HTMLDivElement>(null);

    // --- エリア自動判定ロジック ---
    useEffect(() => {
        const match = address.match(/(那須塩原市|那須郡那須町|那須町|大田原市)/);
        if (match) {
            setArea(match[0].replace('那須郡', ''));
        } else if (address) {
            setArea('');
        }
    }, [address]);

    const scrollToForm = () => {
        registrationFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const isFormValid = !!(
        storeName &&
        contactPerson &&
        address &&
        phoneNumber &&
        email &&
        confirmEmail &&
        area &&
        agreed &&
        email === confirmEmail &&
        password.length >= 6
    );

    const handleFreeSignup = async () => {
        setError(null);
        if (!isFormValid) {
            setError('パートナーダッシュボードへ進むには、フォームの必須項目を全て満たし、規約に同意してください。');
            scrollToForm();
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch('/api/auth/register-free-partner', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    serviceType: 'adver',
                    companyName: storeName,
                    address,
                    area,
                    contactPerson,
                    phoneNumber,
                    email,
                    password: password
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'サーバーでエラーが発生しました。');
            }

            router.push('/partner/login?signup_success=true');
        } catch (err: any) {
            setError(err.message || '不明なエラーが発生しました。');
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-gray-50 text-gray-800 font-sans min-h-screen">
            <Head>
                <title>パートナー無料登録 | みんなのNasuアプリ</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
            </Head>

            {/* ヘッダー画像セクション */}
            <header className="relative bg-white overflow-hidden shadow-lg">
                <div className="relative w-full aspect-[16/9] md:aspect-[16/7] lg:aspect-[16/6] mx-auto max-w-7xl">
                    <Image
                        src="/images/minna_nasu_s.png"
                        alt="みんなの那須アプリ パートナー向け"
                        fill
                        priority
                        style={{ objectFit: 'contain' }}
                    />
                </div>
            </header>

            <main className="container mx-auto px-6">
                {/* ヒーローメッセージ */}
                <section className="text-center pt-16 pb-8">
                    <h2 className="text-3xl font-bold text-gray-800">おかげさまで株式会社adtown20周年、感謝企画</h2>
                    <p className="mt-4 text-lg text-gray-600">
                        日頃よりご支援いただいている那須地域の皆さまへの感謝を込めて、このたび「みんなのNasuアプリ」を開発いたしました。
                    </p>
                    <div className="mt-8">
                        <button onClick={scrollToForm} className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-extrabold py-4 px-10 rounded-full text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300">
                            無料で集客広告を出す
                        </button>
                    </div>
                </section>

                {/* 悩み解決セクション */}
                <section className="mt-12 md:mt-16 py-8 bg-white rounded-2xl shadow-lg border border-gray-200">
                    <div className="max-w-4xl mx-auto text-center px-6">
                        <h3 className="text-2xl font-extrabold text-gray-800 mb-6">こんな集客の悩み、ありませんか？</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left max-w-2xl mx-auto">
                            {[
                                "思うように、お客様が来てくれない...",
                                "何を、どのようにして集客するのかわからない...",
                                "SNSなどの配信に時間がとれない...",
                                "割引だけ利用してリピートしない..."
                            ].map((text, i) => (
                                <div key={i} className="flex items-start space-x-3 p-4 bg-red-50 rounded-lg border border-red-200">
                                    <XCircleIcon className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                                    <p className="text-lg font-medium text-gray-700">{text}</p>
                                </div>
                            ))}
                        </div>
                        <p className="mt-8 text-xl font-bold text-orange-600">
                            「みんなのNasuアプリ」の無料登録が、その解決の第一歩です！
                        </p>
                    </div>
                </section>

                {/* 第3の集客セクション（指示された文章を追加、不要な文章を削除） */}
                <section className="mt-20 bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-gray-200">
                    <div className="max-w-4xl mx-auto text-center">
                        <UsersIcon className="w-12 h-12 mx-auto text-orange-500 mb-4" />
                        <h3 className="text-3xl font-extrabold leading-tight">
                            第３の集客、なぜアプリ集客広告（集客マッチングAI）なのか？<br/>
                            答えは「圧倒的な見込み客」です。
                        </h3>
                        <p className="mt-6 text-lg text-gray-600 leading-relaxed text-left">
                            那須地域限定の『みんなのNasuアプリ』は、ほとんどの機能が無料で使えるため、那須地域の住民にとって「ないと損」なアプリになりつつあります。
                            先行登録者はすでに3,000人を突破。口コミでその輪は確実に広がり、5,000人、10,000人の巨大なユーザーコミュニティへと成長します。
                            貴店の広告やクーポン、フードロスを、アプリ広告（集客マッチングAI）出し放題で、この爆発的に増え続ける「貴店に理想の常連客」に直接届くのです。
                        </p>

                        <div className="mt-12 pt-8 border-t border-gray-200">
                            <h4 className="text-2xl font-black text-pink-800 mb-4 bg-yellow-100 px-6 py-3 rounded-xl border border-yellow-300 shadow-md inline-block">
                                こちらが、地元ユーザーが利用してるアプリのランディングページです。
                            </h4>
                            <p className="text-lg font-bold text-gray-700 mb-6">アプリの機能を確認する</p>
                            <div className="flex flex-col items-center space-y-4">
                                <a 
                                    href="https://minna-no-nasu-app.netlify.app/" 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="inline-block transition-transform transform hover:scale-105 bg-orange-500 hover:bg-orange-600 text-white font-extrabold py-4 px-12 rounded-full shadow-lg text-xl"
                                >
                                    アプリのランディングページを見る
                                </a>
                                <p className="text-sm text-gray-500">※新規タブで詳細を確認できます。</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* キャンペーンセクション */}
                <section className="bg-yellow-100 border-t-4 border-b-4 border-yellow-400 text-yellow-900 p-6 rounded-lg shadow-md my-12 text-center">
                    <h3 className="text-2xl font-bold">【先着100店舗様 限定】有料機能の月額費用割引キャンペーン実施中！</h3>
                    <p className="mt-2 text-lg">
                        有料機能がすべて使えるパートナー制度は月額<strong className="font-bold">4,400円</strong>ですが、
                        先着100社様に限り、永続的に<strong className="font-bold text-red-600">月額3,850円</strong>でご利用いただけます。
                        <br/>**無料登録しても、この割引枠を確保できます。**
                    </p>
                    <div className="mt-4 bg-white p-4 rounded-lg flex items-center justify-center space-x-4 max-w-md mx-auto shadow-inner">
                        <p className="text-lg font-semibold">現在の申込店舗数:</p>
                        <div className="text-3xl font-extrabold text-gray-800 bg-gray-100 px-3 py-1 rounded">{registeredCount}店舗</div>
                        <p className="text-lg font-semibold text-red-600">残り {remainingSlots} 枠！</p>
                    </div>
                </section>

                {/* 機能紹介セクション */}
                <section className="mt-20">
                    <h3 className="text-3xl font-extrabold text-center border-b pb-4 mb-8">【無料の価値】今すぐ集客を始めるための基本機能</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="text-center p-8 bg-green-50 rounded-xl shadow-lg border-green-200 border">
                            <div className="bg-green-500 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6"><ShoppingBagIcon size={32} /></div>
                            <h4 className="text-xl font-bold mb-3">クーポン・フードロス機能</h4>
                            <p className="text-gray-600">特典やフードロス情報を無料で自由に発行・管理できます。</p>
                        </div>
                        <div className="text-center p-8 bg-green-50 rounded-xl shadow-lg border-green-200 border">
                            <div className="bg-green-500 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6"><UsersIcon size={32} /></div>
                            <h4 className="text-xl font-bold mb-3">店舗情報公開と露出</h4>
                            <p className="text-gray-600">お店の情報を、スマホを持つ地元の人に確実に届けます。</p>
                        </div>
                        <div className="text-center p-8 bg-green-50 rounded-xl shadow-lg border-green-200 border">
                            <div className="bg-green-500 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6"><ZapIcon size={32} /></div>
                            <h4 className="text-xl font-bold mb-3">簡単操作と即時反映</h4>
                            <p className="text-gray-600">毎日更新のSNSではなく、一度登録するだけでAIが理想の顧客をマッチングします。</p>
                        </div>
                    </div>
                </section>

                {/* 有料機能セクション */}
                <section className="mt-24">
                    <h3 className="text-3xl font-extrabold text-center mb-4">【有料の価値】集客マッチングAIで利益を最大化</h3>
                    <p className="text-center text-gray-600 max-w-3xl mx-auto mb-12 text-lg">
                        無料広告で一歩を踏み出した後、さらに強力な有料機能で利益を追求できます。
                    </p>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="text-center p-8 bg-yellow-50 rounded-xl shadow-lg border-yellow-200 border">
                            <div className="bg-yellow-500 text-white w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6">AI</div>
                            <h4 className="text-xl font-bold mb-3">集客マッチングAI（有料）</h4>
                            <p className="text-gray-600">行動データに基づき、最も興味を持つ「理想の顧客」にピンポイントで広告を配信します。</p>
                        </div>
                        <div className="text-center p-8 bg-orange-50 rounded-xl shadow-lg border-orange-200 border">
                            <div className="bg-orange-500 text-white w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6">¥</div>
                            <h4 className="text-xl font-bold mb-3">紹介料取得プログラム（有料）</h4>
                            <p className="text-gray-600">お客様が貴店経由で有料会員になると、その売上の30%を永続的に受け取れます。</p>
                        </div>
                        <div className="text-center p-8 bg-red-50 rounded-xl shadow-lg border-red-200 border">
                            <div className="bg-red-500 text-white w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6">AI</div>
                            <h4 className="text-xl font-bold mb-3">特典強化AI配信（有料）</h4>
                            <p className="text-gray-600">無料特典をAIマッチングで強化し、来店率を飛躍的に高めます。</p>
                        </div>
                    </div>
                </section>

                {/* ロゴ一覧 */}
                <section className="mt-24 text-center">
                    <h3 className="text-2xl font-bold text-gray-700 mb-10">すでに那須地域の多くの店舗様が参画しています</h3>
                    <div className="flex flex-wrap justify-center items-center gap-x-10 gap-y-8 opacity-70">
                        {PARTNER_LOGOS.map((logo, index) => (
                            <div key={index} className="relative w-32 h-12">
                                <Image src={logo} alt="パートナー" fill style={{ objectFit: 'contain' }} />
                            </div>
                        ))}
                    </div>
                </section>

                {/* FAQ */}
                <section className="mt-24 max-w-4xl mx-auto">
                    <h3 className="text-3xl font-extrabold text-center mb-10">よくある質問</h3>
                    <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
                        <FAQItem question="費用は本当に無料ですか？">
                            <p>はい、店舗情報の登録と広告掲載、特典・クーポンの発行は永続的に無料です。高度なAI機能や紹介料プログラムを利用する場合のみ月額料金が発生します。</p>
                        </FAQItem>
                        <FAQItem question="紹介手数料はどのように支払われますか？">
                            <p>毎月末締めで計算し、翌々月15日にご指定の銀行口座へお振り込みします。詳細は管理画面からいつでも確認可能です。</p>
                        </FAQItem>
                        <FAQItem question="有料プランの途中で解約はできますか？">
                            <p>はい、管理画面からいつでも停止できます。契約期間の縛りはありません。</p>
                        </FAQItem>
                    </div>
                </section>

                {/* 登録フォーム */}
                <section ref={registrationFormRef} id="registration-form" className="mt-20 pt-10 pb-24">
                    <div className="bg-white p-8 md:p-12 rounded-2xl shadow-2xl w-full max-w-3xl mx-auto border border-gray-100">
                        <div className="text-center mb-10">
                            <h2 className="text-4xl font-bold mb-4">パートナー無料登録</h2>
                        </div>

                        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-gray-700 font-bold mb-2">店舗名・企業名 *</label>
                                    <input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all" placeholder="株式会社〇〇" />
                                </div>
                                <div>
                                    <label className="block text-gray-700 font-bold mb-2">ご担当者名 *</label>
                                    <input type="text" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all" placeholder="山田 太郎" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-700 font-bold mb-2">住所 *</label>
                                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all" placeholder="栃木県那須塩原市..." />
                                {address && !area && <p className="text-red-500 text-xs mt-1 font-bold">※対象外のエリアです（那須塩原市、那須町、大田原市のみ）</p>}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-gray-700 font-bold mb-2">電話番号 *</label>
                                    <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all" placeholder="0287-00-0000" />
                                </div>
                                <div>
                                    <label className="block text-gray-700 font-bold mb-2">パスワード *</label>
                                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all" placeholder="6文字以上" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-gray-700 font-bold mb-2">メールアドレス *</label>
                                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all" placeholder="example@mail.com" />
                                </div>
                                <div>
                                    <label className="block text-gray-700 font-bold mb-2">メールアドレス（確認）*</label>
                                    <input type="email" value={confirmEmail} onChange={(e) => setConfirmEmail(e.target.value)} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all" />
                                </div>
                            </div>

                            <div className="pt-6 border-t border-gray-200">
                                <label className="flex items-start space-x-3 cursor-pointer group">
                                    <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 w-5 h-5 text-orange-500 rounded focus:ring-orange-400 border-gray-300" />
                                    <span className="text-sm text-gray-700 leading-relaxed">
                                        <button type="button" onClick={() => setShowTerms(true)} className="text-orange-600 font-bold underline hover:text-orange-800">利用規約</button>
                                        およびプライバシーポリシーに同意して、無料でダッシュボードを利用します。
                                    </span>
                                </label>
                            </div>

                            {error && (
                                <div className="bg-red-50 border-l-4 border-red-500 p-4 mt-4">
                                    <p className="text-red-700 text-sm font-bold">{error}</p>
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={handleFreeSignup}
                                disabled={isLoading || !isFormValid}
                                className={`w-full py-5 rounded-full text-white font-extrabold text-xl shadow-xl transition-all duration-300 ${
                                    isFormValid ? 'bg-orange-500 hover:bg-orange-600 hover:scale-[1.02] active:scale-95' : 'bg-gray-400 cursor-not-allowed'
                                }`}
                            >
                                {isLoading ? 'アカウント作成中...' : '無料でダッシュボードに進む'}
                            </button>
                        </form>
                    </div>
                </section>
            </main>

            {/* 利用規約モーダル */}
            {showTerms && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
                        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="text-xl font-bold">パートナー利用規約</h3>
                            <button onClick={() => setShowTerms(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <XCircleIcon size={28} />
                            </button>
                        </div>
                        <div className="p-8 overflow-y-auto text-sm text-gray-600 leading-relaxed space-y-6">
                            <section>
                                <h4 className="font-bold text-gray-900 mb-2">第1条（サービス内容）</h4>
                                <p>1. 無料プラン：店舗情報の掲載、クーポン・フードロス情報の配信を永続的に無料で行えるものとします。</p>
                                <p>2. 有料プラン：AIマッチング広告、紹介料取得プログラム、AI特典強化配信等の高度な機能を提供します。</p>
                            </section>
                            <section>
                                <h4 className="font-bold text-gray-900 mb-2">第2条（紹介手数料）</h4>
                                <p>貴店経由でユーザーが有料会員となった場合、当社は月額費用の30%を紹介手数料として貴店に支払うものとします。</p>
                            </section>
                            <section>
                                <h4 className="font-bold text-gray-900 mb-2">第3条（禁止事項）</h4>
                                <p>公序良俗に反するコンテンツの掲載、虚偽の情報の登録を禁止します。</p>
                            </section>
                        </div>
                        <div className="p-6 border-t text-center bg-gray-50">
                            <button onClick={() => setShowTerms(false)} className="bg-orange-500 hover:bg-orange-600 text-white px-12 py-3 rounded-full font-bold transition-all shadow-md">
                                閉じてフォームに戻る
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <footer className="bg-gray-900 text-white py-16 mt-12 border-t-4 border-orange-500">
                <div className="container mx-auto px-6 text-center">
                    <p className="mb-4">© 株式会社adtown All rights reserved.</p>
                    <div className="flex justify-center space-x-6 text-sm text-gray-400">
                        <Link href="/privacy" className="hover:text-white transition-colors">プライバシーポリシー</Link>
                        <Link href="/legal" className="hover:text-white transition-colors">特定商取引法に基づく表記</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default PartnerSignupPage;