import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { NextPage } from 'next';

// --- 画像パスの定義（public/images/に配置されていることを前提とする） ---
// あなたのファイルエクスプローラーに合わせて、ここで使用されているロゴ画像を全て public/images/ に配置してください
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

// --- Inline SVG Icon Components (sizeプロパティを受け取れるように型定義を調整) ---
interface CustomIconProps extends React.SVGProps<SVGSVGElement> {
    size?: number | string; // sizeプロパティを許容
}

const UsersIcon = (props: CustomIconProps) => ( <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> );
const XCircleIcon = (props: CustomIconProps) => ( <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg> );
const MessageCircleIcon = (props: CustomIconProps) => ( <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> );
const UserCheckIcon = (props: CustomIconProps) => ( <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg> );
const ChevronDownIcon = (props: CustomIconProps) => ( <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="6 9 12 15 18 9"/></svg> );
const ZapIcon = (props: CustomIconProps) => ( <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> );
const ShoppingBagIcon = (props: CustomIconProps) => (<svg xmlns="http://www.w3.org/2000/svg" width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg> );

// --- Utility Components ---
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


const PartnerSignupPage: NextPage = () => {
    const router = useRouter();

    const [storeName, setStoreName] = useState('');
    const [address, setAddress] = useState('');
    const [area, setArea] = useState('');
    const [contactPerson, setContactPerson] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [email, setEmail] = useState('');
    const [confirmEmail, setConfirmEmail] = useState('');
    const [password, setPassword] = useState('');
    const [agreed, setAgreed] = useState(false);

    // UI state management
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showTerms, setShowTerms] = useState(false);

    const [registeredCount] = useState(32); // Dummy value for registered stores
    const totalSlots = 100;
    const remainingSlots = totalSlots - registeredCount;

    const registrationFormRef = useRef<HTMLDivElement>(null);

    // Auto-detect area from address
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

    const isPasswordRequired = true; 
    
    // フォームバリデーションロジック (passwordは常に必須)
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
        (isPasswordRequired ? (password.length >= 6) : true)
    );


    /**
     * 【新規無料登録】フォーム入力の検証と無料アカウントの作成、ログインページへリダイレクト
     */
    const handleFreeSignup = async () => {
        setError(null);

        // Client-side validation
        if (!isFormValid) {
            setError('パートナーダッシュボードへ進むには、フォームの必須項目を全て満たし、規約に同意してください。');
            scrollToForm();
            return;
        }

        setIsLoading(true);
        try {
            // 既存ユーザーID (existingUid) を null に固定
            const existingUid = null; 

            // New API call for free registration (APIパスは適宜修正してください)
            const response = await fetch('/api/auth/register-free-partner', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    serviceType: 'adver', // ロールとして'adver'を付与
                    companyName: storeName,
                    address,
                    area,
                    contactPerson,
                    phoneNumber,
                    email,
                    password: password, // パスワードは必ず送信される
                    existingUid: existingUid // 常に null
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.error && (data.error.includes('already in use') || data.error.includes('exists') || data.error.includes('既に使用'))) {
                    setError('このメールアドレスは既に使用されています。');
                } else {
                    throw new Error(data.error || 'サーバーでエラーが発生しました。');
                }
            }

            // 登録成功後、ログインページへリダイレクト（ユーザーが自分でログインする必要がある）
            router.push('/partner/login?signup_success=true');

        } catch (err: any) {
            console.error('Free signup error:', err);
            if (!error) setError(err.message || '不明なエラーが発生しました。');
            setIsLoading(false);
        }
    };


    const getButtonText = () => {
        if (isLoading) return 'アカウント作成中...';
        return '無料でダッシュボードに進む';
    };

    const lineUrl = "https://lin.ee/your-line-id"; // LINE URLは適宜置き換えてください

    return (
        <div className="bg-gray-50 text-gray-800 font-sans">
            <Head>
                <title>{"みんなのNasuアプリ パートナー無料登録"}</title>
            </Head>
            
            {/* ★★★ 修正箇所: minna_nasu_s.png を使用し、unoptimizedを適用 ★★★ */}
            <header className="relative bg-white overflow-hidden shadow-lg">
                <div className="relative w-full aspect-[16/9] md:aspect-[16/7] lg:aspect-[16/6] mx-auto">
                    <Image
                        // あなたのコードに合わせて minna_nasu_s.png に修正
                        src="/images/minna_nasu_s.png" 
                        alt="みんなの那須アプリ パートナー向けヘッダー画像"
                        fill
                        priority={true}
                        sizes="(max-width: 768px) 100vw, 100vw"
                        // 画像が切れないように 'contain' に設定
                        style={{ objectFit: 'contain' }}
                        // ★重要: これで画像が表示される可能性が高まります
                        unoptimized={true} 
                    />
                </div>

                {/* 画像の下にCTAボタンを配置するためのコンテナ */}
                <div className="container mx-auto px-6 py-6 relative z-20 text-center bg-white">
                    <div className="max-w-3xl mx-auto">
                        {/* CTA: LINE Only */}
                        <div className="flex flex-col items-center space-y-4">
                            {/* 誘導テキスト */}
                            <p className="text-xl font-black text-pink-800 bg-yellow-100 px-6 py-2 rounded-full border border-yellow-300 shadow-md">
                                最速3秒！LINEで友だち追加
                            </p>
                            {/* LINEボタン: 公式LINE URLへ誘導 */}
                            <a href={lineUrl} target="_blank" rel="noopener noreferrer" className="inline-block transition-transform transform hover:scale-105">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src="https://scdn.line-apps.com/n/line_add_friends/btn/ja.png" alt="LINE 友だち追加" height="42" className="h-14 w-auto shadow-xl" />
                            </a>
                        </div>
                    </div>
                </div>
            </header>
            {/* ★★★ 修正箇所ここまで ★★★ */}

            <main className="container mx-auto px-6">

                {/* Hero Section - タイトルを変更し、無料を強調 */}
                <section className="text-center pt-16 pb-8">
                    <h2 className="text-3xl font-bold text-gray-800">おかげさまで株式会社adtown20周年、感謝企画</h2>
                    <p className="mt-4 text-lg text-gray-600">日頃よりご支援いただいている那須地域の皆さまへの感謝を込めて、
                    このたび「みんなのNasuアプリ」を開発いたしました。</p>
                </section>

                <section className="text-center py-16 md:py-24">
                    <p className="text-orange-500 font-semibold">那須地域の地元企業＆店舗を応援するadtownからのご提案</p>
                    <h2 className="text-4xl md:text-5xl font-extrabold mt-4 leading-tight">
                        「集客に困っている店舗様」は必見！<br />
                        <span className="text-orange-600"> SNSでもなくWebでもない、第３の集客方法を無料でスタート！</span><br />
                        ！無料登録で広告管理ページへアクセス！
                    </h2>
                    <p className="mt-6 text-lg text-gray-600 max-w-3xl mx-auto">
                        まずは<strong className="font-bold">無料</strong>で広告管理ページにログインし、店舗情報の登録（広告掲載）を始めましょう。
                        有料機能（集客マッチングAI、紹介料、お客様を貴店LINEに誘導）は、広告管理ページ内で**いつでも**お申し込みいただけます。
                    </p>
                    <div className="mt-8">
                        <button onClick={scrollToForm} className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-extrabold py-4 px-10 rounded-full text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300">
                            無料で集客広告を出す
                        </button>
                        <p className="mt-2 text-sm text-gray-500">登録は3分、料金は一切かかりません。</p>
                    </div>
                </section>

                {/* 集客の悩みに絞ったセクション */}
                <section className="mt-12 md:mt-16 py-8 bg-white rounded-2xl shadow-lg border border-gray-200">
                    <div className="max-w-4xl mx-auto text-center px-6">
                        <h3 className="text-2xl font-extrabold text-gray-800 mb-6">
                            こんな集客の悩み、ありませんか？
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left max-w-2xl mx-auto">
                            <div className="flex items-start space-x-3 p-4 bg-red-50 rounded-lg border border-red-200">
                                <XCircleIcon className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                                <p className="text-lg font-medium text-gray-700">
                                    思うように、お客様が来てくれない...
                                </p>
                            </div>
                            <div className="flex items-start space-x-3 p-4 bg-red-50 rounded-lg border border-red-200">
                                <XCircleIcon className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                                <p className="text-lg font-medium text-gray-700">
                                    何を、どのようにして集客するのかわからない...
                                </p>
                            </div>
                            <div className="flex items-start space-x-3 p-4 bg-red-50 rounded-lg border border-red-200">
                                <XCircleIcon className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                                <p className="text-lg font-medium text-gray-700">
                                    SNSなどの配信に時間がとれない...
                                </p>
                            </div>
                            <div className="flex items-start space-x-3 p-4 bg-red-50 rounded-lg border border-red-200">
                                <XCircleIcon className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                                <p className="text-lg font-medium text-gray-700">
                                    割引だけ利用してリピートしない...
                                </p>
                            </div>
                        </div>
                        <p className="mt-8 text-xl font-bold text-orange-600">
                            「みんなのNasuアプリ」の無料登録が、その解決の第一歩です！
                        </p>
                    </div>
                </section>

                {/* Campaign Section - 内容を無料登録向けに変更 */}
                <section className="bg-yellow-100 border-t-4 border-b-4 border-yellow-400 text-yellow-900 p-6 rounded-lg shadow-md my-12 text-center">
                    <h3 className="text-2xl font-bold">【先着100店舗様 限定】有料機能の**月額費用割引**キャンペーン実施中！</h3>
                    <p className="mt-2 text-lg">
                        有料機能がすべて使えるパートナー制度（集客AI、紹介手数料で収入アップなど）は、月額<strong className="font-bold">4,400円</strong>ですが、
                        先着100社様に限り、永続的に<strong className="font-bold text-red-600">月額3,850円</strong>でご利用いただけます。
                        <br/>**無料登録しても、この割引枠を確保できます。**
                    </p>
                    <div className="mt-4 bg-white p-4 rounded-lg flex items-center justify-center space-x-2 md:space-x-4 max-w-md mx-auto">
                        <p className="text-md md:text-lg font-semibold">現在の申込店舗数:</p>
                        <div className="text-2xl md:text-3xl font-extrabold text-gray-800 tracking-wider bg-gray-100 px-3 py-1 rounded">{registeredCount}店舗</div>
                        <p className="text-md md:text-lg font-semibold text-red-600">残り {remainingSlots} 枠！</p>
                    </div>
                </section>

                {/* 社会的証明セクション */}
                <section className="mt-20 bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-gray-200">
                    <div className="max-w-4xl mx-auto text-center">
                        <UsersIcon className="w-12 h-12 mx-auto text-orange-500 mb-4" />
                        <h3 className="text-3xl font-extrabold">第３の集客、なぜアプリ集客広告（集客マッチングAI）なのか？答えは「圧倒的な見込み客」です。</h3>
                        <p className="mt-6 text-lg text-gray-600 leading-relaxed">
                            那須地域限定の『みんなのNasuアプリ』は、ほとんどの機能が<strong className="text-orange-600 font-bold">無料</strong>で使えるため、那須地域の住民にとって「ないと損」なアプリになりつつあります。
                            先行登録者はすでに<strong className="text-orange-600 font-bold">3,000人</strong>を突破。口コミでその輪は確実に広がり、<strong className="text-orange-600 font-bold">5,000人、10,000人</strong>の巨大なユーザーコミュニティへと成長します。
                            貴店の広告やクーポン、フードロスを、アプリ広告（集客マッチングAI）出し放題で、この<strong className="font-bold">爆発的に増え続ける「貴店に理想の常連客」</strong>に直接届くのです。
                        </p>
                    </div>
                </section>

                {/* 【無料の価値】セクション */}
                <section className="mt-20">
                    <h3 className="text-3xl font-extrabold text-center border-b pb-2 mb-8">【無料の価値・待ちの集客】今すぐ集客マッチングAIを始めるための基本機能</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="text-center p-6 bg-green-50 rounded-lg shadow-lg border-green-300 border">
                            <div className="bg-green-500 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4"><ShoppingBagIcon size={30} /></div>
                            <h4 className="text-xl font-bold">特典・クーポン・フードロス機能</h4>
                            <p className="mt-2 text-gray-600">特典やクーポン、フードロス情報を**無料**で自由に発行・管理できます。</p>
                        </div>
                        <div className="text-center p-6 bg-green-50 rounded-lg shadow-lg border-green-300 border">
                            <div className="bg-green-500 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4"><UsersIcon size={30} /></div>
                            <h4 className="text-xl font-bold">店舗情報公開と露出</h4>
                            <p className="mt-2 text-gray-600">お店の情報を、スマホを持つ地元の人（アプリユーザー）に確実に届けます。</p>
                        </div>
                        <div className="text-center p-6 bg-green-50 rounded-lg shadow-lg border-green-300 border">
                            <div className="bg-green-500 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4"><ZapIcon size={30} /></div>
                            <h4 className="text-xl font-bold">簡単操作と即時反映</h4>
                            <p className="mt-2 text-gray-600">簡単に掲載・更新でき、誰でもすぐに集客を始められます。毎日更新のSNSではなく、一度登録するだけで、理想の顧客をAIでマッチング!!</p>
                        </div>
                    </div>
                </section>

                {/* Monetization Mechanism Section - 有料機能として再定義 */}
                <section className="mt-20">
                    <h3 className="text-3xl font-extrabold text-center">【有料の価値・攻めの集客】集客マッチングAI、特典やクーポンのAIマッチングで利益を最大化</h3>
                    <p className="mt-4 text-center text-gray-600 max-w-3xl mx-auto">無料広告で集客の第一歩を踏み出した後、さらに強力な有料機能で利益を追求できます。すべての有料機能は、ダッシュボードから月額料金でご利用いただけます。</p>
                    <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        <div className="text-center p-6 bg-yellow-50 rounded-lg shadow-lg border-yellow-300 border">
                            <div className="bg-yellow-500 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">AI</div>
                            <h4 className="text-xl font-bold">集客マッチングAI出し放題（有料）</h4>
                            <p className="mt-2 text-gray-600">アプリユーザーの行動データに基づき、最も貴店に興味を持つであろう「理想の顧客」にピンポイントで広告を配信し、貴店のLINEに誘導します。</p>
                        </div>
                        <div className="text-center p-6 bg-orange-50 rounded-lg shadow-lg border-orange-300 border">
                            <div className="bg-orange-500 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">¥</div>
                            <h4 className="text-xl font-bold">紹介料取得プログラム（有料）</h4>
                            <p className="mt-2 text-gray-600">お客様が貴店のQRコード経由でアプリの有料会員になると、その売上の30%を永続的に収益として受け取れます。</p>
                        </div>
                        <div className="text-center p-6 bg-red-50 rounded-lg shadow-lg border-red-300 border">
                            <div className="bg-red-500 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">AI</div>
                            <h4 className="text-xl font-bold">特典強化（AIマッチング）</h4>
                            <p className="mt-2 text-gray-600">無料の特典やクーポンをAIマッチングにて強化し、「理想の顧客」にピンポイントで配信します。</p>
                        </div>
                    </div>
                    <div className="mt-12 text-center bg-green-50 border-t-4 border-green-400 p-6 rounded-lg"><p className="text-xl font-bold text-green-800">まずは無料登録から始め、これらの有料機能は後からお申込みいただけます。</p></div>
                </section>


                {/* Revenue Simulation Section */}
                <section className="mt-20 bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-gray-200">
                    <h3 className="text-3xl font-extrabold text-center">「紹介手数料・貴店収益増有料プラン」もし、1日にたった2人または5人のお客様が貴店のテーブルに置いたQRコードスタンドからアプリ登録して**有料プランに**移行したら？</h3>
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-orange-50 p-8 rounded-lg border-2 border-dashed border-orange-300"><h4 className="font-bold text-xl text-center">例：カフェ・美容室の場合</h4><p className="text-center text-sm text-gray-600">1日に2人が有料会員に移行</p><p className="mt-4 text-center text-lg text-gray-700">2人/日 × 30日 = <span className="font-bold text-2xl text-orange-600">月60人</span>の紹介</p><p className="mt-2 text-center text-xl font-bold text-gray-800">月間紹介料: <span className="text-red-600">8,640円</span></p><p className="mt-4 text-center text-xl font-bold text-gray-800">年間収益: <span className="text-4xl font-extrabold text-red-600">103,680円</span></p></div>
                        <div className="bg-blue-50 p-8 rounded-lg border-2 border-dashed border-blue-300"><h4 className="font-bold text-xl text-center">例：レストラン・居酒屋の場合</h4><p className="text-center text-sm text-gray-600">1日に5人が有料会員に移行</p><p className="mt-4 text-center text-lg text-gray-700">5人/日 × 30日 = <span className="font-bold text-2xl text-blue-600">月150人</span>の紹介</p><p className="mt-2 text-center text-xl font-bold text-gray-800">月間紹介料: <span className="text-red-600">21,600円</span></p><p className="mt-4 text-center text-xl font-bold text-gray-800">年間収益: <span className="text-4xl font-extrabold text-red-600">259,200円</span></p></div>
                    </div>
                    <p className="mt-4 text-sm text-gray-500 text-center">※この収益は、有料プラン加入後に、広告掲載による本来の**集客効果とは別に**得られるものです。</p>
                </section>


                {/* Partner Logos Section */}
                <section className="mt-20 text-center">
                    <h3 className="text-2xl font-bold text-gray-700">すでに那須地域の多くの店舗様がこのチャンスに気づいています</h3>
                    <div className="mt-8 flex flex-wrap justify-center items-center gap-x-8 gap-y-6 opacity-80">
                        {PARTNER_LOGOS.map((logoPath, index) => (
                            <Image
                                key={index}
                                src={logoPath}
                                alt={`パートナーロゴ ${index + 1}`}
                                width={150}
                                height={50}
                                className="object-contain"
                                unoptimized={true}
                            />
                        ))}
                    </div>
                </section>


                {/* Support System Section */}
                <section className="mt-20 text-center">
                    <h3 className="text-3xl font-extrabold">安心を保証するサポート体制</h3>
                    <p className="mt-4 text-gray-600 max-w-2xl mx-auto">導入後も、専任の担当者が貴店を徹底的にサポートします。ITが苦手な方でも安心してご利用いただけます。</p>
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                        <div className="bg-white p-6 rounded-lg shadow-md border"><MessageCircleIcon size={30} className="w-10 h-10 mx-auto text-green-500"/><p className="mt-4 font-bold text-lg">LINEチャットサポート</p></div>
                        <div className="bg-white p-6 rounded-lg shadow-md border"><UserCheckIcon size={30} className="w-10 h-10 mx-auto text-orange-500"/><p className="mt-4 font-bold text-lg">専任担当者</p></div>
                    </div>
                </section>


                {/* FAQ Section - 回答を有料化に合わせて変更 */}
                <section className="mt-24 max-w-4xl mx-auto">
                    <h3 className="text-3xl font-extrabold text-center">よくある質問</h3>
                    <div className="mt-8 bg-white p-4 md:p-8 rounded-2xl shadow-xl border">
                        <FAQItem question="費用は本当に無料ですか？">
                            <p className="leading-relaxed">はい、店舗情報の登録とアプリへの広告掲載、**特典・クーポンの発行は永続的に無料**です。ただし、集客マッチングAI、AIによる特典強化、アプリ利用者の紹介料取得プログラムといった**有料機能**をご利用になる場合のみ、月額<strong className="font-bold">4,400円</strong>（先着100社限定で3,850円）が発生します。有料機能はダッシュボード内からいつでもお申込み・停止が可能です。</p>
                        </FAQItem>
                        <FAQItem question="紹介手数料はどのように支払われますか？">
                            <p className="leading-relaxed">有料プラン加入済みのパートナー様には、毎月末締めで計算し、翌々月15日にご指定の銀行口座へお振り込みします。振込額の合計が3,000円に満たない場合は、お支払いは翌月以降に繰り越されます。パートナー様専用のダッシュボードで、いつでも収益状況をご確認いただけます。</p>
                        </FAQItem>
                        <FAQItem question="有料プランの途中で解約（停止）はできますか？">
                            <p className="leading-relaxed">はい、いつでも管理画面から次回の更新を停止（解約）することができます。契約期間の縛りはありません。ただし、月の途中で停止した場合でも、日割りの返金はございませんのでご了承ください。</p>
                        </FAQItem>
                    </div>
                </section>


                {/* Registration Form Section - フォームのメッセージとボタンの変更 */}
                <section ref={registrationFormRef} id="registration-form" className="mt-20 pt-10">
                    <div className="bg-white p-8 md:p-12 rounded-2xl shadow-2xl w-full max-w-3xl mx-auto border border-gray-200">
                        <div className="text-center mb-10">
                            <h2 className="text-3xl font-bold text-center mb-2">パートナー無料登録</h2>
                            <p className="text-gray-700 leading-relaxed">
                                まずは無料で広告管理ページにログインし、すぐに広告掲載をスタートしましょう。<br/>
                                <strong className="text-red-600 font-bold">有料機能の割引枠（月額4,400円→3,850円）</strong>を確保するためにも、今すぐご登録ください。
                            </p>
                        </div>

                        <p className="text-center text-gray-600 mb-8">
                            以下のフォームをご入力ください。ご登録後、広告管理ページにログインできるようになります。
                        </p>


                        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}> {/* Prevent form submission */}
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
                                {address && !area && <p className="text-red-500 text-xs mt-1">那須塩原市、那須郡那須町、那須町、大田原市のいずれかである必要があります。</p>}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                                <div>
                                    <label className="block text-gray-700 font-medium mb-2">電話番号 *</label>
                                    <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required className="w-full px-4 py-2 border rounded-lg focus:ring-orange-500 focus:border-orange-500"/>
                                </div>

                                {/* パスワード入力を必須にする */}
                                <div>
                                    <label className="block text-gray-700 font-medium mb-2">パスワード *</label>
                                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required={isPasswordRequired} disabled={!isPasswordRequired} minLength={isPasswordRequired ? 6 : 0} className="w-full px-4 py-2 border rounded-lg focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed"/>
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
                            
                            {/* エラーメッセージ */}
                            {error && (
                                <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm text-center">
                                    {error}
                                </div>
                            )}

                            <div className="pt-4">
                                <label className="flex items-start">
                                    <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 h-5 w-5 text-orange-600 focus:ring-orange-500 rounded"/>
                                    <span className="ml-3 text-sm text-gray-600">
                                        <button type="button" onClick={() => setShowTerms(true)} className="text-blue-600 hover:underline">
                                            パートナー利用規約
                                        </button>
                                        と<Link href="/privacy" target="_blank" className="text-blue-600 hover:underline">プライバシーポリシー</Link>に同意します。*
                                    </span>
                                </label>
                            </div>

                            <button
                                type="button"
                                onClick={handleFreeSignup}
                                disabled={!isFormValid || isLoading}
                                className={`w-full py-3 mt-8 text-xl font-bold rounded-full transition duration-300 shadow-lg ${
                                    isFormValid && !isLoading
                                        ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white hover:from-orange-600 hover:to-red-700 transform hover:scale-[1.01]'
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                            >
                                {getButtonText()}
                            </button>
                            <p className="text-center text-sm text-gray-500 mt-2">※ 登録後、広告管理ページにリダイレクトします。</p>

                            <p className="text-center text-sm text-gray-500 mt-4">
                                すでにアカウントをお持ちの場合は <Link href="/partner/login" className="text-blue-600 hover:underline font-medium">ログインはこちら</Link>
                            </p>

                        </form>
                    </div>
                </section>


                {/* Terms Modal */}
                {showTerms && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
                        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8">
                            <h3 className="text-2xl font-bold mb-4 border-b pb-2">パートナー利用規約</h3>
                            <div className="text-gray-700 text-sm space-y-4">
                                <p>
                                    （規約のテキストがここに入ります。実際には別のコンポーネントまたはファイルからロードされるべきです。）
                                </p>
                                <p>
                                    ※ 実際の利用規約の内容をここに挿入するか、または /terms などのページへのリンクを使用してください。
                                </p>
                            </div>
                            <button
                                onClick={() => setShowTerms(false)}
                                className="mt-6 bg-orange-500 text-white font-bold py-2 px-6 rounded-full hover:bg-orange-600 transition duration-300"
                            >
                                閉じる
                            </button>
                        </div>
                    </div>
                )}
            </main>

            {/* Footer Placeholder (必要に応じて追加) */}
            <footer className="mt-20 py-8 bg-gray-200 text-center text-sm text-gray-600">
                &copy; {new Date().getFullYear()} adtown Inc. All rights reserved.
            </footer>
        </div>
    );
};

export default PartnerSignupPage;