// index.tsx (最終完全版: Linkインポート、タグ修正、空白修正済み)

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import Link from 'next/link'; // <-- 【重要】Linkコンポーネントをインポートしました
import {
    ShieldCheck, HeartPulse, ShoppingCart, Briefcase, Ticket, Lightbulb, Users, Building2, Rocket, Star, Coins, Sparkles, Smile, Clock, Zap, Gift, Crown, Infinity, HeartHandshake,
    Store, Brain, Utensils, Droplet, Gamepad, User, Shield, TrendingUp, ArrowLeft, Target, Shirt, Mail, Sun, WashingMachine, Home, LayoutGrid, Award, Filter, Fuel, Heart
} from 'lucide-react';
import {
    RiBankCardFill, RiShieldCheckFill, RiHistoryFill, RiShoppingBagFill, RiAddCircleFill, RiSettings4Fill, RiLogoutBoxRLine, RiPlantFill, RiFlashlightFill, RiHandHeartFill, RiExchangeBoxFill, RiArrowRightSLine, RiGiftFill, RiHeartFill, RiLightbulbFlashLine, RiHome4Line, RiLeafLine, RiExchangeFundsLine
} from 'react-icons/ri';

type IconType = React.FC<React.SVGProps<SVGSVGElement>>;

interface AppItem {
    title: string;
    category: string;
    description: string;
    href: string;
    Icon: any;
    disabled: boolean;
}

const FREE_APP_LIST: AppItem[] = [
    { title: "最安ガソリン＆価格投稿", category: '生活情報', description: '地域の最安ガソリン価格ランキングと価格投稿', href: '/apps/AIGasPriceTracker', Icon: Fuel, disabled: false },
    { title: "アレどこ (Aredoko)", category: '収納・片付け', description: 'たまにしか使わない大事なモノの「しまった場所」を記録・検索', href: '/apps/Aredoko', Icon: Filter, disabled: false },
    { title: "AIクローゼットスリム化診断", category: '収納・片付け', description: '衣類の断捨離をAIが質問でサポートし、意思決定を支援', href: '/apps/ClosetSlimmerAI', Icon: WashingMachine, disabled: false },
    { title: "知っ得！生活の裏技AI", category: '生活情報', description: '時短、掃除、収納などの役立つ裏技をAIが提案', href: '/apps/LifeHacksAI', Icon: Lightbulb, disabled: false },
    { title: "AIファッション診断", category: '生活情報', description: '用途と体型に基づき最適なコーディネートを提案', href: '/apps/FashionAI', Icon: Shirt, disabled: false },
    { title: "引越し手続きAIナビ", category: '生活情報', description: '転入/転出に必要な手続きリストをAIが生成', href: '/apps/MovingHelperAI', Icon: Mail, disabled: false },
    { title: "体重記録＆BMI計算", category: '健康支援', description: '日々の体重とBMIを記録・管理', href: '/apps/BodyMassTracker', Icon: Heart, disabled: false },
    { title: "育児記録ワンタッチログ", category: '子育て', description: '授乳・オムツ・睡眠の時刻を簡単記録', href: '/apps/BabyLog', Icon: Gift, disabled: false },
    { title: "子育て支援情報ナビ", category: '子育て', description: '各市町の子育て・教育情報リンク集', href: '/apps/ParentingInfo', Icon: User, disabled: false },
    { title: "賢人の子育て指針 Wisdom Guide", category: '子育て', description: 'AIと著名人の知恵の言葉から、子育ての羅針盤を見つける', href: '/apps/WisdomGuide', Icon: Award, disabled: false },
    { title: "スーパー特売チラシ＆AI献立ナビ", category: '節約・特売', description: '地域のチラシ確認とプロの節約レシピを提案', href: '/nasu/kondate', Icon: Utensils, disabled: false },
    { title: "ドラッグストアチラシ", category: '節約・特売', description: 'ドラッグストアの特売情報', href: '/nasu', Icon: Store, disabled: false },
    { title: "直感！脳力診断", category: 'エンタメ', description: '心理テストと脳トレ雑学で頭を活性化', href: '/apps/BrainTest', Icon: Brain, disabled: false },
    { title: "那須地区マスターズクイズ", category: 'エンタメ', description: '那須地域の歴史・観光クイズに挑戦', href: '/apps/QuizGame', Icon: Gamepad, disabled: false },
    { title: "地域防災情報ナビ", category: '防災・安全', description: '各市町の防災情報・ハザードマップリンク集', href: '/apps/DisasterInfo', Icon: Shield, disabled: false },
    { title: "今日の運勢占い", category: '診断・運勢', description: '生年月日による今日の運勢診断', href: '/apps/DailyFortune', Icon: Droplet, disabled: false },
    { title: "適職＆性格診断", category: '診断・運勢', description: 'あなたの強みと適職（在宅ワーク含む）を診断', href: '/apps/AptitudeTest', Icon: Target, disabled: false },
    { title: "朝の褒め言葉AI", category: '診断・運勢', description: 'AIが今日のモチベーションを高めるメッセージを提案', href: '/apps/MorningComplimentAI', Icon: Sun, disabled: false },
    { title: "AI手相鑑定", category: '診断・運勢', description: 'カメラで手相を撮影するだけで、AIが本格鑑定', href: '/apps/Palmistry', Icon: Sparkles, disabled: false },
    { title: "苦手な人攻略ヒント", category: '人間関係', description: '相手のタイプから接し方とストレス対策を診断', href: '/apps/RelationshipHint', Icon: Users, disabled: false },
    { title: "スキル学習時間トラッカー", category: 'スキルアップ・キャリア', description: '収益化スキル（ライティング等）の目標時間を管理', href: '/apps/SkillTimeTracker', Icon: TrendingUp, disabled: false },
    { title: "わたしの気分ログ", category: '趣味・文化', description: '毎日の気分と感情の傾向を記録・分析', href: '/apps/MoodTracker', Icon: Smile, disabled: false },
];

const FREE_CATEGORIES: string[] = [
    '収納・片付け', '生活情報', '健康支援', '子育て', '節約・特売', 'エンタメ', '防災・安全', 'スキルアップ・キャリア', '診断・運勢', '人間関係', '趣味・文化'
];

function MenuButton({ href, icon, title, label, color }: any) {
    return (
        <div className="group relative bg-white p-6 rounded-[2.2rem] shadow-sm border border-gray-100 flex items-center gap-5">
            <div className={`w-16 h-16 flex items-center justify-center bg-gradient-to-br ${color} rounded-2xl text-white shadow-lg shrink-0`}>
                {icon}
            </div>
            <div className="flex-1 text-left">
                <h3 className="font-black text-xl tracking-tighter text-gray-800">{title}</h3>
                <p className="text-[11px] font-medium text-gray-500 mt-1 leading-relaxed">{label}</p>
            </div>
        </div>
    );
}

// -------------------------
// Type definitions
// -------------------------
interface LandingData {
    mainTitle?: string;
    areaDescription?: string;
    heroHeadline?: string;
    heroSubheadline?: string;
    solutionBenefit1_Title?: string;
    solutionBenefit1_Desc?: string;
    solutionBenefit2_Title?: string;
    solutionBenefit2_Desc?: string;
    solutionBenefit3_Title?: string;
    solutionBenefit3_Desc?: string;
    solutionBenefit4_Title?: string;
    solutionBenefit4_Desc?: string;
    freePlanTitle?: string;
    freePlanSubTitle?: string;
    freePlanFeatures?: string[];
    freePlanConclusion?: string;
    premiumPlanHeadline?: string;
    premiumPlanDesc?: string;
    premiumPlanTitle?: string;
    premiumPlanFeatures?: { title: string; desc: string }[];
    premiumPlanConclusion?: string;
    freeReasonTitle?: string;
    freeReasonDesc?: string;
    finalCtaTitle?: string;
    finalCtaSubtext?: string;
    finalTagline1?: string;
    finalTagline2?: string;
}
import { useAffiliateTracker } from '@/lib/affiliate-tracker';

const LandingPageFallback = () => {
    return (
        <div className="p-10 text-center">
            <h1 className="text-2xl font-bold">Landing Page</h1>
            <p className="mt-4">Please see the main IndexPage below.</p>
        </div>
    );
};
// -------------------------
// Helper: safeHTML
// -------------------------
const SafeHTML: React.FC<{ html?: string }> = ({ html }) => (
    <div dangerouslySetInnerHTML={{ __html: html || '' }} />
);

// -------------------------
// Page component
// -------------------------
const IndexPage = () => {
    // ---------------------------------------------------------
    // 紹介システム連動ロジック 
    // ---------------------------------------------------------

    // 基本となるLINE公式アカウントのURL
    const BASE_LINE_URL = "https://lin.ee/N4x90pv";

    // 実際にボタンに設定されるURL（初期値は基本URL）
    const [lineUrl, setLineUrl] = useState(BASE_LINE_URL);

    // Next.jsのルーターを使用
    const router = useRouter();

    useEffect(() => {
        // サーバーサイドでの document, window の参照を防ぎます。
        if (typeof window === 'undefined') {
            return;
        }

        // 1. ページタイトル設定
        document.title = "みんなのNasuアプリ | 公式";

        // 2. URLパラメータから紹介ID (ref) を取得
        try {
            const searchParams = new URLSearchParams(window.location.search);
            const referralId = searchParams.get('ref');

            if (referralId) {
                // IDがある場合、LINEのURLに ?ref=ID を追加
                const newUrl = `${BASE_LINE_URL}?ref=${referralId}`;
                setLineUrl(newUrl);
                console.log("紹介ID検知: LINEリンクを書き換えました ->", newUrl);
            }
        } catch (e) {
            console.error("パラメータ取得エラー", e);
        }
    }, [router.isReady]);


    // ---------------------------------------------------------
    // データ定義
    // ---------------------------------------------------------
    const [selectedCategory, setSelectedCategory] = useState('すべて');

    const getCategoryAppList = (category: string): AppItem[] => {
        const list = FREE_APP_LIST.filter(app => app.category === category);
        if (list.length === 0) {
            return [{
                title: "アプリ準備中",
                description: "現在、このカテゴリのアプリを開発中です。",
                Icon: Zap,
                disabled: true,
                href: '#',
                category: category,
            }];
        }
        return list.reduce((acc, current) => {
            const isDuplicate = acc.some(item => item.title === current.title && item.href === current.href);
            if (!isDuplicate) acc.push(current);
            return acc;
        }, [] as AppItem[]);
    }

    const allUniqueApps: AppItem[] = FREE_APP_LIST.reduce((acc, current) => {
        const isDuplicate = acc.some(item => item.title === current.title && item.href === current.href);
        if (!isDuplicate) acc.push(current);
        return acc;
    }, [] as AppItem[]);

    const filteredApps = selectedCategory === 'すべて' ? allUniqueApps : getCategoryAppList(selectedCategory);

    // パートナー企業ロゴリスト
    const partnerLogos = [
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
        '/images/partner-yamakiya.png',
    ];

    useAffiliateTracker('user');

    return (
        <div className="bg-white text-gray-800 font-sans">

            {/* Hero Section: 画像ヘッダー */}
            <header className="relative bg-white overflow-hidden shadow-lg">

                <div className="relative w-full aspect-[16/9] md:aspect-[16/7] lg:aspect-[16/6] mx-auto">
                    <Image
                        src="/images/minna_nasu.png"
                        alt="みんなのNasuアプリ 公式ヘッダー画像"
                        fill
                        priority={true}
                        sizes="(max-width: 768px) 100vw, 100vw"
                        style={{ objectFit: 'contain' }}
                    />
                </div>

                {/* 画像の下にCTAボタンを配置するためのコンテナ */}
                <div className="container mx-auto px-6 py-6 relative z-20 text-center bg-white">
                    <div className="max-w-3xl mx-auto">
                        {/* CTA: LINE Only */}
                        <div className="flex flex-col items-center space-y-4">
                            {/* 誘導テキスト */}
                            <p className="text-xl font-black text-pink-800 bg-yellow-100 px-6 py-2 rounded-full border border-yellow-300 shadow-md">
                                最速30秒！LINE友だち追加で無料登録
                            </p>
                            {/* LINEボタン: 紹介ID付きのURL (lineUrl) に動的に変わる */}
                            <a href={lineUrl} target="_blank" rel="noopener noreferrer" className="inline-block transition-transform transform hover:scale-105">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src="https://scdn.line-apps.com/n/line_add_friends/btn/ja.png" alt="LINE 友だち追加" height="42" className="h-14 w-auto shadow-xl" />
                            </a>
                        </div>
                    </div>
                </div>
            </header>

            <main>
                {/* Intro */}
                <section className="text-center py-16 bg-white border-b">
                    <div className="container mx-auto px-6">
                        <h2 className="text-3xl font-bold text-gray-800">
                            おかげさまで株式会社adtown20周年、感謝企画
                        </h2>
                        <p className="mt-4 text-lg text-gray-600">
                            みんなのNasuアプリを開発しましたので、下記をご覧の上ご利用ください。
                        </p>
                    </div>
                </section>

                {/* YouTube */}
                <section className="py-16 bg-pink-50">
                    <div className="container mx-auto px-6 text-center">
                        <div
                            className="relative max-w-4xl mx-auto shadow-lg rounded-lg overflow-hidden bg-gray-200"
                            style={{ paddingTop: '56.25%' }}
                        >
                            <iframe
                                className="absolute top-0 left-0 w-full h-full"
                                src="https://www.youtube.com/embed/JRNx77WfEBU"
                                title="YouTube video"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                    </div>
                </section>

                {/* Partner logos */}
                <section className="py-16 bg-white border-y">
                    <div className="container mx-auto px-6 text-center">
                        <h3 className="text-sm tracking-widest text-gray-500 mb-8 font-semibold uppercase">
                            那須地域のパートナー企業・店舗様
                        </h3>
                        <div className="mt-8 flex flex-wrap justify-center items-center gap-x-8 gap-y-6 opacity-90">
                            {partnerLogos.map((logoPath, index) => (
                                <div key={index} className="p-2">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={logoPath}
                                        alt={`パートナーロゴ ${index + 1}`}
                                        width={150}
                                        height={50}
                                        className="object-contain max-h-12 w-auto"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                        }}
                                    />
                                </div>
                            ))}
                        </div>

                    </div>
                </section>

                {/* Free Apps Section */}
                <section className="py-20 bg-white">
                    <div className="container mx-auto px-4 max-w-4xl">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-5xl font-black text-gray-800 mb-4 tracking-tighter italic">
                                <Sparkles className="inline-block w-8 h-8 text-green-500 mr-2 mb-2" />
                                FREE APPS
                            </h2>
                            <p className="text-lg text-gray-600 font-bold">
                                地域の暮らしを便利にする「完全無料」アプリ一覧
                            </p>
                        </div>

                        {/* 代表例（Featured Apps） */}
                        <div className="space-y-12 mb-20">
                            {/* 1. 那須こんだて */}
                            <FeaturedAppCard
                                title="那須こんだて｜AI献立＆特売ナビ"
                                description={<>那須地域の特売チラシ × 冷蔵庫の在庫から、<br className="hidden md:block" />AIが“今いちばんお得で美味しい献立”を自動提案。</>}
                                detail="那須塩原市・大田原市・那須町のスーパー特売をまとめて分析し、家族構成に合わせた分量・レシピ・買い物リストまで一気に作ります。"
                                features={[
                                    "那須地域のスーパー特売に完全対応",
                                    "写真 or 入力だけで特売を読み取り",
                                    "冷蔵庫の在庫をムダなく使い切り",
                                    "家族人数に合わせた献立と分量を自動調整",
                                    "買い物リストをそのまま使える"
                                ]}
                                recommend={[
                                    "毎日の献立に悩みたくない",
                                    "特売は見るけど、何を作るか決められない",
                                    "食費は抑えたいけど、味は妥協したくない"
                                ]}
                                oneWord="考えるのはAI。あなたは、作るだけ。"
                                color="bg-orange-50 border-orange-100"
                                badge="AI × 特売"
                                badgeColor="bg-orange-100 text-orange-600"
                            />

                            {/* 2. 最安ガソリン */}
                            <FeaturedAppCard
                                title="最安ガソリン｜ガソリン価格比較"
                                description={<>那須地域のガソリン価格をまとめて比較。<br className="hidden md:block" />今いちばん安いスタンドが、ひと目でわかる。</>}
                                detail="那須塩原市・大田原市・那須町の最新価格情報を地域別に表示。外部の公式価格データと、投稿情報をあわせてチェックできます。"
                                features={[
                                    "地域別にガソリン価格を比較",
                                    "最新の価格ランキングを確認",
                                    "価格を見たまま投稿して共有",
                                    "外部価格サイトもアプリ内で表示"
                                ]}
                                recommend={[
                                    "ガソリン代を少しでも節約したい",
                                    "どのスタンドが安いか毎回迷う",
                                    "車移動が多い那須・大田原エリアの方"
                                ]}
                                oneWord="知らないだけで、毎月損している。"
                                color="bg-red-50 border-red-100"
                                badge="地域最安"
                                badgeColor="bg-red-100 text-red-600"
                            />

                            {/* 3. ドラッグストア特売ナビ */}
                            <FeaturedAppCard
                                title="ドラッグストア特売ナビ"
                                description={<>那須地域のドラッグストア特売をまとめてチェック。<br className="hidden md:block" />日用品・薬を、いちばん安い店で。</>}
                                detail="那須塩原市・大田原市・那須町のドラッグストア特売チラシを一覧表示。店舗ごとに探さず、「今どこが安いか」だけを素早く確認できます。"
                                features={[
                                    "地域別に特売チラシをまとめて表示",
                                    "主要ドラッグストアに対応",
                                    "公式チラシをそのまま確認",
                                    "比較に迷わないシンプル設計"
                                ]}
                                recommend={[
                                    "日用品・薬を少しでも安く買いたい",
                                    "チラシアプリを何個も使いたくない",
                                    "那須地域の情報だけを見たい"
                                ]}
                                oneWord="見る店を迷う時間が、ゼロになる。"
                                color="bg-blue-50 border-blue-100"
                                badge="日用品・薬"
                                badgeColor="bg-blue-100 text-blue-600"
                            />
                        </div>

                        {/* ジャンル選択 */}
                        <div className="mb-10 p-6 bg-green-50 rounded-[2rem] shadow-sm border border-green-100">
                            <h3 className="text-lg font-bold text-green-800 mb-4 flex items-center gap-2">
                                <LayoutGrid className="w-5 h-5" /> ジャンルで選ぶ
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setSelectedCategory('すべて')}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${selectedCategory === 'すべて'
                                        ? 'bg-gray-800 text-white border-gray-800 shadow-lg'
                                        : 'bg-white text-green-700 border-green-200 hover:bg-green-100'
                                        }`}
                                >
                                    すべて
                                </button>
                                {FREE_CATEGORIES.map(category => (
                                    <button
                                        key={category}
                                        onClick={() => setSelectedCategory(category)}
                                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${selectedCategory === category
                                            ? 'bg-green-600 text-white border-green-600 shadow-lg'
                                            : 'bg-white text-green-700 border-green-200 hover:bg-green-100'
                                            }`}
                                    >
                                        {category}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* アプリリスト */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {filteredApps.map(app => (
                                <div
                                    key={`${app.title}-${app.category}`}
                                    className={`block p-5 rounded-[2rem] shadow-sm border ${app.disabled ? 'bg-gray-100 text-gray-500 opacity-80 border-gray-300' : 'bg-white border-gray-100'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-2xl ${app.disabled ? 'bg-gray-300' : 'bg-green-100 text-green-600'}`}>
                                            <app.Icon className="w-6 h-6" />
                                        </div>
                                        <div className="text-left">
                                            <h3 className={`font-black text-lg tracking-tight ${app.disabled ? 'text-gray-500' : 'text-gray-800'}`}>{app.title}</h3>
                                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{app.description}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-12 p-8 bg-pink-50 rounded-[2.5rem] border border-pink-100 text-center">
                            <p className="text-2xl font-black text-pink-700 italic tracking-tighter">
                                これらすべて、一生無料。
                            </p>
                            <p className="mt-2 text-gray-600 font-bold">
                                登録しない理由が、見つかりません。
                            </p>
                            <div className="mt-8 flex flex-col items-center space-y-2">
                                <a href={lineUrl} target="_blank" rel="noopener noreferrer" className="inline-block transition-transform transform hover:scale-105">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src="https://scdn.line-apps.com/n/line_add_friends/btn/ja.png" alt="LINE 友だち追加" height="42" className="h-12 w-auto shadow-md" />
                                </a>
                                <p className="text-xs font-bold text-gray-400">
                                    ※完全無料登録・いつでも解約可能
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Paid Apps Section */}
                <section className="py-20 bg-gray-50">
                    <div className="container mx-auto px-4 max-w-4xl">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-5xl font-black text-gray-800 mb-4 tracking-tighter italic">
                                <RiShieldCheckFill className="inline-block w-8 h-8 text-emerald-500 mr-2 mb-2" />
                                PREMIUM SERVICES
                            </h2>
                            <p className="text-lg text-gray-600 font-bold">
                                さらに豊かな那須ライフを。月額480円課金で全機能開放
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <MenuButton
                                href="/premium/referral"
                                icon={<RiGiftFill size={28} />}
                                title="紹介プログラム"
                                label="アプリや各サービスを友人・知人に紹介することで、報酬や特典がもらえる仕組み。地域のお店・個人の紹介がそのまま収益につながります。"
                                color="from-amber-400 to-orange-600"
                            />

                            <MenuButton
                                href="/premium/skill"
                                icon={<RiExchangeFundsLine size={28} />}
                                title="那須スキル交換所"
                                label="「できること」と「困っていること」を地域内でマッチング。専門資格がなくても、日常スキルや経験を価値に変えられます。"
                                color="from-blue-700 to-indigo-950"
                            />

                            <MenuButton
                                href="/premium/akihata"
                                icon={<RiLeafLine size={28} />}
                                title="那須あき畑速報"
                                label="使われていない畑・農地の最新情報をまとめて確認。貸したい人と使いたい人をつなぐ、那須地域限定の畑マッチング速報です。"
                                color="from-emerald-700 to-emerald-900"
                            />

                            <MenuButton
                                href="/premium/akiya"
                                icon={<RiHome4Line size={28} />}
                                title="那須あき家速報"
                                label="空き家・空き店舗の新着情報をいち早くチェック。移住・開業・利活用を考えている人向けの地域特化情報サービス。"
                                color="from-slate-700 to-slate-900"
                            />

                            <MenuButton
                                href="/premium/tasukeai"
                                icon={<RiLightbulbFlashLine size={28} />}
                                title="那須たすけあい速報"
                                label="「ちょっと困った」「誰か手を貸してほしい」をすぐ共有。高齢者・子育て世帯・単身者の“ご近所助け合い”を支える速報機能です。"
                                color="from-orange-400 to-yellow-500"
                            />

                            <MenuButton
                                href="/premium/osuso"
                                icon={<RiPlantFill size={28} />}
                                title="おすそわけ畑"
                                label="家庭菜園や畑で余った野菜・果物を地域でシェア。捨てない・無駄にしない・つながるを実現するご近所おすそわけ。"
                                color="from-emerald-500 to-green-600"
                            />

                            <MenuButton
                                href="/premium/half-price/create"
                                icon={<RiFlashlightFill size={28} />}
                                title="爆安セール速報"
                                label="地元スーパー・小売店の「本当に安い」情報だけを厳選配信。見逃しがちなタイムセールや数量限定情報もまとめて確認できます。"
                                color="from-orange-500 to-red-500"
                            />

                            <MenuButton
                                href="/premium/flea-market"
                                icon={<RiShoppingBagFill size={28} />}
                                title="Nasuフリマ"
                                label="那須地域限定のフリーマーケット掲示板。送料なし・近場取引で、安心・手軽に売買ができます。"
                                color="from-pink-500 to-rose-500"
                            />

                            <MenuButton
                                href="/premium/helper"
                                icon={<RiHandHeartFill size={28} />}
                                title="ちょい手伝い"
                                label="草刈り・雪かき・荷物運びなど、短時間のお手伝い募集。「少しだけ助けてほしい」と「空いた時間に稼ぎたい」をつなぎます。"
                                color="from-teal-500 to-cyan-500"
                            />

                            <MenuButton
                                href="/premium/rental"
                                icon={<RiExchangeBoxFill size={28} />}
                                title="使ってない貸します"
                                label="使っていない道具・機材・スペースを必要な人へ。買わずに借りる、地域内シェアで無駄を減らします。"
                                color="from-blue-500 to-indigo-500"
                            />

                            <MenuButton
                                href="/premium/pet-board/create"
                                icon={<RiHeartFill size={28} />}
                                title="ペット掲示板"
                                label="里親募集・迷子情報・ペットに関する地域掲示板。那須エリア限定だからこそ、すぐに動けて安心です。"
                                color="from-purple-500 to-indigo-500"
                            />
                        </div>
                    </div>
                </section>

                {/* Reason Free */}
                <section className="py-20 bg-white">
                    <div className="container mx-auto px-6 text-center max-w-3xl">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
                            「どうして無料なの？」<br />怪しくないですか？
                        </h2>
                        <div className="mt-6 text-gray-600 leading-relaxed text-lg">
                            ご安心ください。これは地域の企業様が「那須に住むあなたを応援したい」という想いでスポンサーになってくれているからです。<br className="my-2" />
                            <strong>だから、あなたは遠慮なく、堂々と無料で使い倒してください。</strong><br />
                            あなたが便利に暮らすことが、地域の元気につながるのです。
                        </div>
                    </div>
                </section>

                {/* CTA (LINEのみ・連動対応) */}
                <section id="cta" className="bg-pink-900 text-white">
                    <div className="container mx-auto px-6 py-20 text-center">
                        <div className="max-w-3xl mx-auto">
                            <h2 className="text-3xl md:text-4xl font-bold">
                                迷う必要はありません。<br />
                                だって、<span>完全無料</span>なんですから。
                            </h2>
                            <p className="mt-4 text-pink-200">● 追加課金なし ● 解約も自由</p>

                            {/* LINE Button Only */}
                            <div className="mt-10 flex flex-col items-center justify-center space-y-6">

                                <div className="flex flex-col items-center space-y-2">
                                    <p className="text-lg font-bold text-pink-100">
                                        最速！LINEで友だち追加
                                    </p>
                                    {/* stateのlineUrl (例: ...?ref=7X7...) を使用 */}
                                    <a href={lineUrl} target="_blank" rel="noopener noreferrer" className="inline-block transition-transform transform hover:scale-105">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src="https://scdn.line-apps.com/n/line_add_friends/btn/ja.png" alt="LINE 友だち追加" height="42" className="h-14 w-auto shadow-xl" />
                                    </a>
                                </div>

                            </div>

                            {/* Tagline below buttons */}
                            <div className="mt-10 text-pink-300 text-sm md:text-base">
                                <p>このボタンを押すだけで、</p>
                                <p>あなたの毎日は、もっとやさしく、もっと楽になります。</p>
                            </div>

                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-400 text-sm">
                <div className="container mx-auto py-10 px-6 text-center space-y-3">
                    {/* Next.jsの推奨に従い、Linkコンポーネントを使用 */}
                    <Link href="/legal" className="hover:text-white">
                        特定商取引法に基づく表記
                    </Link>
                    <p>みんなのNasuアプリ運営 | 株式会社adtown</p>
                    <p>
                        〒329-2711 栃木県那須塩原市石林698-35 | TEL:0287-39-7577
                    </p>
                </div>
            </footer>
        </div>
    );
};

// Featured App Component
const FeaturedAppCard = ({
    title,
    description,
    detail,
    features,
    recommend,
    oneWord,
    color,
    badge,
    badgeColor
}: {
    title: string;
    description: React.ReactNode;
    detail: string;
    features: string[];
    recommend: string[];
    oneWord: string;
    color: string;
    badge: string;
    badgeColor: string;
}) => (
    <div className={`p-8 rounded-[2.5rem] border ${color} relative overflow-hidden`}>
        <div className="relative z-10">
            <div className="flex flex-col md:flex-row gap-6 md:items-start">
                <div className="flex-1 space-y-4">
                    <div className="space-y-2">
                        <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black tracking-widest ${badgeColor}`}>
                            {badge}
                        </span>
                        <h3 className="text-2xl font-black text-gray-800 leading-tight">
                            {title}
                        </h3>
                    </div>
                    <p className="text-lg font-bold text-gray-700 leading-relaxed">
                        {description}
                    </p>
                    <p className="text-sm text-gray-500 leading-relaxed">
                        {detail}
                    </p>
                </div>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/60 rounded-2xl p-5">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">できること</h4>
                    <ul className="space-y-2">
                        {features.map((f, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm font-bold text-gray-600">
                                <span className="text-green-500 mt-0.5">✔</span>
                                {f}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="bg-white/60 rounded-2xl p-5">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">こんな人に</h4>
                    <ul className="space-y-2">
                        {recommend.map((r, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm font-bold text-gray-600">
                                <span className="text-pink-400 mt-0.5">●</span>
                                {r}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200/50 text-center">
                <p className="text-xl font-black italic text-gray-800">
                    "{oneWord}"
                </p>
            </div>
        </div>
    </div>
);

export default IndexPage;