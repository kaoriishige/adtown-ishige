import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useMemo, useState } from 'react';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import nookies from 'nookies';
import {
    RiCheckboxCircleFill,
    RiArrowRightLine,
    RiHandCoinFill,
    RiShieldCheckFill,
    RiGiftFill,
    RiExchangeFundsLine,
    RiLeafLine,
    RiHome4Line,
    RiLightbulbFlashLine,
    RiShoppingBagFill,
    RiExchangeBoxFill,
    RiHeartFill,
    RiArrowLeftSLine,
    RiSparkling2Fill,
    RiLock2Fill,
    RiInformationFill,
    RiMoneyCnyCircleFill,
} from 'react-icons/ri';
import { app } from '@/lib/firebase';
import { getAuth } from 'firebase/auth';

interface LPProps {
    uid: string | null;
}

const PREMIUM_PRICE = 480;

const PremiumLandingPage: NextPage<LPProps> = ({ uid }) => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // --- “つい課金したくなる”の中核：簡易シミュレーター ---
    const [inviteCount, setInviteCount] = useState<number>(2);
    const estimatedMonthlyReward = useMemo(() => {
        // 20%還元 * 紹介人数 * 480円 (PREMIUM_PRICE)
        return Math.round(0.2 * inviteCount * PREMIUM_PRICE);
    }, [inviteCount]);

    const roiLabel = useMemo(() => {
        if (estimatedMonthlyReward >= PREMIUM_PRICE * 3) return 'かなり回収しやすい';
        if (estimatedMonthlyReward >= PREMIUM_PRICE) return '回収ライン';
        return 'まずは体験して判断';
    }, [estimatedMonthlyReward]);

    const handleSubscribe = async () => {
        setLoading(true);
        try {
            const auth = getAuth(app);
            const user = auth.currentUser;
            if (!user) {
                router.push('/users/login?from=/premium');
                return;
            }
            const idToken = await user.getIdToken();
            const res = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                }
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                alert('決済ページの読み込みに失敗しました');
            }
        } catch (err) {
            console.error(err);
            alert('エラーが発生しました');
        } finally {
            setLoading(false);
        }
    };

    const handleSeeFree = () => {
        // 「無料のまま戻れる」安心導線を用意（離脱率を下げつつ信頼を上げる）
        router.push('/home');
    };

    return (
        <div className="min-h-screen bg-white font-sans text-[#4A3B3B]">
            <Head>
                <title>那須で暮らして、紹介して、還元。 | みんなのNasu</title>
                <meta name="description" content="みんなのNasuアプリは、使うだけじゃなく紹介でも得ができる地域アプリです。" />
            </Head>

            {/* --- Header --- */}
            <header className="bg-white/80 backdrop-blur-xl border-b border-[#E8E2D9] px-6 py-4 sticky top-0 z-50">
                <div className="max-w-xl mx-auto flex items-center gap-4">
                    <button
                        onClick={() => router.push('/home')}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-[#FDFCFD] border border-[#E8E2D9] text-[#A89F94] active:scale-90 transition-all"
                    >
                        <RiArrowLeftSLine size={24} />
                    </button>

                    <div className="flex-1">
                        <span className="text-[10px] tracking-[0.3em] uppercase text-[#A89F94] block font-bold">
                            Premium Plan
                        </span>
                        <h1 className="text-sm font-black italic">プレミアムプラン</h1>
                    </div>

                    {/* 右上に「安心要素」を常設（心理的抵抗を下げる） */}
                    <div className="flex items-center gap-2 text-[11px] font-black text-[#A89F94]">
                        <RiLock2Fill />
                        いつでも解約OK
                    </div>
                </div>
            </header>

            <main className="max-w-xl mx-auto pb-32">

                {/* --- Hero Section --- */}
                <section className="px-6 pt-16 pb-10 text-center bg-gradient-to-b from-[#FFF5F8] to-white">
                    <div className="inline-flex items-center gap-2 bg-pink-500 text-white text-[11px] font-black px-4 py-1 rounded-full mb-6 tracking-widest shadow-lg shadow-pink-100">
                        <RiSparkling2Fill />
                        月額 480円（紹介還元 20%）
                    </div>

                    <h2 className="text-2xl md:text-3xl font-black leading-tight mb-5">
                        那須で暮らして、使って、紹介して。<br />
                        <span className="text-pink-600 underline decoration-pink-200 decoration-8 underline-offset-4">
                            “回収できる”設計
                        </span>
                        の地域アプリ。
                    </h2>

                    <p className="text-sm font-bold text-[#8C8479] leading-relaxed">
                        便利機能だけじゃなく、<br />
                        「紹介で還元が発生する」から続けやすい。
                    </p>

                    {/* ヒーロー直下に “比較” への導線 */}
                    <div className="mt-8 flex gap-3 justify-center">
                        <a href="#compare" className="px-5 py-3 rounded-full bg-white border border-[#E8E2D9] text-[#4A3B3B] font-black text-sm active:scale-[0.98] transition-all">
                            無料との違いを見る
                        </a>
                        <a href="#simulator" className="px-5 py-3 rounded-full bg-pink-500 text-white font-black text-sm shadow-lg shadow-pink-100 active:scale-[0.98] transition-all">
                            回収シミュレーション
                        </a>
                    </div>
                </section>

                {/* --- Comparison (Free vs Premium) --- */}
                <section id="compare" className="px-6 py-10">
                    <div className="text-center mb-6">
                        <h3 className="text-xl font-black italic">無料プランとの違い</h3>
                        <p className="text-[12px] font-bold text-[#8C8479] mt-2">
                            “できる”の差より、<span className="text-pink-600">「回収できる導線」</span>の差が大きいです。
                        </p>
                    </div>

                    <div className="rounded-[2rem] border border-[#E8E2D9] overflow-hidden shadow-sm bg-white">
                        <div className="grid grid-cols-3">
                            <div className="p-4 bg-[#FDFCFD]">
                                <p className="text-[11px] font-black text-[#A89F94]">機能</p>
                            </div>
                            <div className="p-4 bg-[#FDFCFD] border-l border-[#E8E2D9]">
                                <p className="text-[11px] font-black text-[#A89F94]">Free</p>
                            </div>
                            <div className="p-4 bg-pink-50 border-l border-[#E8E2D9]">
                                <p className="text-[11px] font-black text-pink-700">Premium</p>
                            </div>

                            <CompareRow label="紹介報酬（銀行振込）" free="—" premium="20%（対象：すべて）" highlight />
                            <CompareRow label="おすすめ用リンク/導線" free="基本" premium="強化（回収導線）" />
                            <CompareRow label="地域機能（閲覧/利用）" free="◯" premium="◯" />
                            <CompareRow label="優先サポート" free="—" premium="◯" />
                            <CompareRow label="今後の追加機能" free="一部" premium="優先提供" />
                        </div>

                        <div className="p-5 bg-white border-t border-[#E8E2D9]">
                            <div className="flex items-start gap-3">
                                <RiInformationFill className="text-[#A89F94] mt-0.5" />
                                <p className="text-[12px] font-bold text-[#8C8479] leading-relaxed">
                                    プレミアムは「便利」だけじゃなく、<span className="text-[#4A3B3B]">還元が発生する前提</span>で設計しています。
                                    だから月額が“コスト”になりにくいです。
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- Simulator (ROI) --- */}
                <section id="simulator" className="px-6 py-10">
                    <div className="bg-[#4A4540] rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-xl font-black italic flex items-center justify-center gap-2">
                                <RiMoneyCnyCircleFill className="text-pink-400" />
                                月480円、回収できる？
                            </h3>
                            <p className="text-center text-[12px] text-gray-200 font-bold mt-2">
                                紹介人数を入れるだけの超ざっくり試算（20%還元）
                            </p>

                            <div className="mt-7 grid grid-cols-1 gap-4">
                                <div className="bg-white/10 rounded-2xl p-4">
                                    <label className="text-[11px] font-black text-gray-200">月の紹介人数（無料→有料に移行する想定）</label>
                                    <input
                                        type="range"
                                        min={0}
                                        max={20}
                                        value={inviteCount}
                                        onChange={(e) => setInviteCount(Number(e.target.value))}
                                        className="w-full mt-3"
                                    />
                                    <div className="flex justify-between text-[11px] text-gray-300 font-bold mt-2">
                                        <span>0</span>
                                        <span className="text-white font-black text-sm">{inviteCount} 人</span>
                                        <span>20</span>
                                    </div>
                                </div>


                                <div className="bg-white rounded-2xl p-5 text-[#4A3B3B]">
                                    <p className="text-[11px] font-black text-[#A89F94]">あなたの想定 月間還元</p>
                                    <p className="text-3xl font-black italic mt-1">
                                        {estimatedMonthlyReward.toLocaleString()} 円
                                    </p>
                                    <div className="mt-3 flex items-center justify-between">
                                        <p className="text-[12px] font-bold text-[#8C8479]">
                                            月額 {PREMIUM_PRICE}円に対して：<span className="text-pink-600 font-black">{roiLabel}</span>
                                        </p>
                                        <span className="text-[11px] font-black px-3 py-1 rounded-full bg-pink-50 text-pink-700 border border-pink-100">
                                            20%試算
                                        </span>
                                    </div>

                                    <div className="mt-4 text-[11px] font-bold text-[#8C8479] leading-relaxed">
                                        ※これは目安です。実際の還元は、紹介先の課金・広告掲載などの状況で変わります。<br />
                                        ただ「回収できる可能性」が見えると、続けやすくなります。
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 text-center">
                                <p className="text-sm font-black text-white">
                                    あなたは、知人にこれいいよと紹介ページを送るだけです
                                </p>
                            </div>

                            <div className="mt-4 flex gap-3">
                                <button
                                    onClick={handleSubscribe}
                                    disabled={loading}
                                    className="flex-1 py-4 bg-pink-500 text-white rounded-full font-black text-base shadow-xl shadow-pink-100 flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50"
                                >
                                    {loading ? '処理中...' : '回収できそう → はじめる'}
                                    {!loading && <RiArrowRightLine size={22} />}
                                </button>

                                <button
                                    onClick={handleSeeFree}
                                    className="px-5 py-4 rounded-full bg-white/10 border border-white/20 text-white font-black text-sm active:scale-[0.98] transition-all"
                                >
                                    いったん無料で戻る
                                </button>
                            </div>

                            <div className="mt-4 text-center text-[11px] font-bold text-gray-300">
                                <RiLock2Fill className="inline -mt-0.5 mr-1" />
                                料金・還元条件はページ内に明記。誤認させる表示はしません。
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- Mechanism Block (既存) --- */}
                <section className="px-6 py-12 space-y-8">
                    <div className="text-center">
                        <h3 className="text-xl font-black italic flex items-center justify-center gap-2">
                            <RiHandCoinFill className="text-pink-500" /> 稼げる仕組み
                        </h3>
                    </div>

                    <div className="bg-[#4A4540] rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                        <div className="relative z-10 space-y-6">
                            <div className="text-center">
                                <span className="text-4xl font-black italic">紹介報酬 20%</span>
                            </div>

                            <ul className="space-y-4 text-sm font-bold text-gray-200">
                                <li className="flex items-center gap-3 bg-white/10 p-4 rounded-2xl">
                                    <RiCheckboxCircleFill className="text-emerald-400 shrink-0" size={20} />
                                    <span>アプリ無料会員の紹介</span>
                                </li>
                                <li className="flex items-center gap-3 bg-white/10 p-4 rounded-2xl">
                                    <RiCheckboxCircleFill className="text-emerald-400 shrink-0" size={20} />
                                    <span>店舗集客広告の紹介</span>
                                </li>
                                <li className="flex items-center gap-3 bg-white/10 p-4 rounded-2xl">
                                    <RiCheckboxCircleFill className="text-emerald-400 shrink-0" size={20} />
                                    <span>企業求人広告の紹介</span>
                                </li>
                            </ul>

                            <div className="pt-4 border-t border-white/20 text-center space-y-2">
                                <p className="text-sm font-black italic">すべて対象。すべて20%。すべて銀行振込。</p>
                                <p className="text-[11px] text-gray-400">
                                    月末締め → 翌月15日お支払い<br />
                                    3,000円以上から振込対応
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- Examples Section (既存) --- */}
                <section className="px-6 py-12 bg-[#FDFCFD]">
                    <h3 className="text-sm font-black text-[#A89F94] uppercase tracking-widest text-center mb-10">
                        具体例（ここ超重要）
                    </h3>

                    <div className="space-y-6">
                        <ExampleCard title="ママ友にアプリを教える" tag="無料登録" description="無料から有料課金へ移行した利用料の20%があなたに" />
                        <ExampleCard title="知り合いのお店に教える" tag="有料広告掲載（AIマッチングシステム）" description="有料広告費の20%があなたに" />
                        <ExampleCard title="近所の会社に求人広告を教える" tag="無料掲載から有料掲載（AIマッチングシステム）へ" description="有料求人広告費の20%があなたに" />
                    </div>

                    <div className="mt-10 text-center bg-pink-50 p-6 rounded-[2rem] border border-pink-100">
                        <p className="text-sm font-black">👉 やることは「これいいよ」と教えるだけ。</p>
                    </div>
                </section>

                {/* --- Reassurance (既存) --- */}
                <section className="px-6 py-16 space-y-12">
                    <div className="text-center space-y-2">
                        <h3 className="text-sm font-black text-[#A89F94] uppercase tracking-widest">Safe & Local</h3>
                        <h2 className="text-2xl font-black italic">無理なく続けられる安心の理由</h2>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <SafeCard title="副業ではありません。" desc="面倒な手続きや報告は不要です。" />
                        <SafeCard title="ノルマもありません。" desc="自分のペースで紹介できます。" />
                        <SafeCard title="勧誘もありません。" desc="強引な誘いは必要ありません。" />
                    </div>

                    <div className="text-center space-y-4">
                        <p className="text-sm font-bold leading-relaxed">
                            那須の中で回る、地域限定の仕組みです。<br />
                            だから、無理がありません。
                        </p>
                    </div>
                </section>

                {/* --- App Features Section (既存) --- */}
                <section className="px-6 py-20 bg-[#FDFCFD] space-y-16">
                    <div className="text-center space-y-4">
                        <span className="bg-[#4A4540] text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">App Features</span>
                        <h2 className="text-2xl font-black">どんなことができるの？</h2>
                        <p className="text-sm text-[#8C8479] font-bold">那須の暮らしがもっと便利に、もっと楽しくなる機能が満載。</p>
                    </div>

                    <div className="space-y-12">
                        <FeatureBlock icon={<RiGiftFill className="text-amber-500" />} title="紹介プログラム" badge="REWARD" description="アプリや各サービスを友人・知人に紹介することで、報酬や特典がもらえる仕組み。地域のお店・個人の紹介がそのまま収益につながります。" color="bg-amber-50" />
                        <FeatureBlock icon={<RiExchangeFundsLine className="text-blue-600" />} title="那須スキル交換所" badge="SKILL" description="「できること」と「困っていること」を地域内でマッチング。専門資格がなくても、日常スキルや経験を価値に変えられます。" color="bg-blue-50" />
                        <FeatureBlock icon={<RiLeafLine className="text-emerald-600" />} title="那須あき畑速報" badge="FARM" description="使われていない畑・農地の最新情報をまとめて確認。貸したい人と使いたい人をつなぐ、那須地域限定の畑マッチング速報です。" color="bg-emerald-50" />
                        <FeatureBlock icon={<RiHome4Line className="text-slate-600" />} title="那須あき家速報" badge="HOUSE" description="空き家・空き店舗の新着情報をいち早くチェック。移住・開業・利活用を考えている人向けの地域特化情報サービス。" color="bg-slate-50" />
                        <FeatureBlock icon={<RiLightbulbFlashLine className="text-yellow-500" />} title="那須たすけあい速報" badge="SUPPORT" description="「ちょっと困った」「誰か手を貸してほしい」をすぐ共有。高齢者・子育て世帯・単身者の“ご近所助け合い”を支える速報機能です。" color="bg-yellow-50" />
                        <FeatureBlock icon={<RiLeafLine className="text-emerald-500" />} title="おすそわけ畑" badge="FREE" description="家庭菜園や畑で余った野菜・果物を地域でシェア。捨てない・無駄にしない・つながるを実現するご近所おすそわけ。" color="bg-emerald-50" />
                        <FeatureBlock icon={<RiLightbulbFlashLine className="text-rose-500" />} title="爆安セール速報" badge="LIVE" description="地元スーパー・小売店の「本当に安い」情報だけを厳選配信。見逃しがちなタイムセールや数量限定情報もまとめて確認できます。" color="bg-rose-50" />
                        <FeatureBlock icon={<RiShoppingBagFill className="text-pink-500" />} title="Nasuフリマ" badge="MARKET" description="那須地域限定のフリーマーケット掲示板。送料なし・近場取引で、安心・手軽に売買ができます。" color="bg-pink-50" />
                        <FeatureBlock icon={<RiHeartFill className="text-teal-500" />} title="ちょい手伝い" badge="HELP" description="草刈り・雪かき・荷物運びなど、短時間のお手伝い募集。「少しだけ助けてほしい」と「空いた時間に稼ぎたい」をつなぎます。" color="bg-teal-50" />
                        <FeatureBlock icon={<RiExchangeBoxFill className="text-indigo-500" />} title="使ってない貸します" badge="SHARE" description="使っていない道具・機材・スペースを必要な人へ。買わずに借りる、地域内シェアで無駄を減らします。" color="bg-indigo-50" />
                        <FeatureBlock icon={<RiHeartFill className="text-purple-500" />} title="ペット掲示板" badge="ADOPTION" description="里親募集・迷子情報・ペットに関する地域掲示板。那須エリア限定だからこそ、すぐに動けて安心です。" color="bg-purple-50" />
                    </div>
                </section>

                {/* --- Sticky CTA --- */}
                <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl border-t border-[#E8E2D9] z-[60]">
                    <div className="max-w-xl mx-auto space-y-2">
                        <p className="text-center text-xs font-bold text-gray-500 mb-1">
                            合わなければ、いつでも解約できます。<br />
                            まずは1ヶ月だけ試してみてください。
                        </p>
                        <button
                            onClick={handleSubscribe}
                            disabled={loading}
                            className="w-full py-5 bg-pink-500 text-white rounded-full font-black text-lg shadow-xl shadow-pink-100 flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                            {loading ? '処理中...' : 'プレミアムを使ってみる'}
                            {!loading && <RiArrowRightLine size={24} />}
                        </button>
                        <p className="text-center text-[11px] font-bold text-[#A89F94]">
                            <RiLock2Fill className="inline -mt-0.5 mr-1" />
                            いつでも解約OK・条件はページ内に明記
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
};

const CompareRow = ({
    label,
    free,
    premium,
    highlight,
}: {
    label: string;
    free: string;
    premium: string;
    highlight?: boolean;
}) => (
    <>
        <div className="p-4 border-t border-[#E8E2D9]">
            <p className="text-[12px] font-black text-[#4A3B3B]">{label}</p>
        </div>
        <div className="p-4 border-t border-l border-[#E8E2D9]">
            <p className="text-[12px] font-bold text-[#8C8479]">{free}</p>
        </div>
        <div className={`p-4 border-t border-l border-[#E8E2D9] ${highlight ? 'bg-pink-50' : ''}`}>
            <p className={`text-[12px] font-black ${highlight ? 'text-pink-700' : 'text-[#4A3B3B]'}`}>
                {premium}
            </p>
        </div>
    </>
);


const SafeCard = ({ title, desc }: { title: string; desc: string }) => (
    <div className="bg-white border-2 border-[#E8E2D9] p-6 rounded-[2rem] flex items-center gap-4 shadow-sm">
        <RiShieldCheckFill className="text-emerald-500" size={32} />
        <div>
            <h4 className="font-black">{title}</h4>
            <p className="text-[11px] text-[#A89F94] font-bold">{desc}</p>
        </div>
    </div>
);

const ExampleCard = ({ title, tag, description }: { title: string; tag: string; description: string }) => (
    <div className="bg-white p-6 rounded-[2rem] border border-[#E8E2D9] shadow-sm flex items-start gap-4">
        <div className="flex-1 space-y-1">
            <h4 className="text-sm font-black text-gray-800 italic">例えば…</h4>
            <p className="text-sm font-black">
                {title} → <span className="text-pink-500 underline decoration-pink-100">{tag}</span>
            </p>
            <p className="text-xs font-bold text-[#8C8479]">→ {description}</p>
        </div>
    </div>
);

const FeatureBlock = ({
    icon,
    title,
    badge,
    description,
    color,
}: {
    icon: React.ReactNode;
    title: string;
    badge: string;
    description: string;
    color: string;
}) => (
    <div className="flex gap-6 items-start">
        <div className={`w-14 h-14 ${color} rounded-2xl shrink-0 flex items-center justify-center shadow-inner`}>
            {React.cloneElement(icon as React.ReactElement, { size: 28 })}
        </div>
        <div className="space-y-2">
            <div className="flex items-center gap-3">
                <h3 className="text-lg font-black">{title}</h3>
                <span className="text-[9px] font-black px-2 py-0.5 rounded bg-gray-100 text-gray-400 tracking-widest">
                    {badge}
                </span>
            </div>
            <p className="text-sm font-bold text-[#8C8479] leading-relaxed">{description}</p>
        </div>
    </div>
);

export const getServerSideProps: GetServerSideProps = async (context) => {
    try {
        const cookies = nookies.get(context);
        const session = cookies.session || '';
        if (!session) return { props: { uid: null } };

        const token = await adminAuth.verifySessionCookie(session, true);
        const userDoc = await adminDb.collection('users').doc(token.uid).get();
        const userData = userDoc.data() || {};

        // isPaid はこのページ内ではまだ使ってないけど、
        // もし「課金中ならCTAを変える」などやるならここで判定して props に渡すのがベスト
        const isPaid = userData.isPaid === true || userData.subscriptionStatus === 'active';

        return {
            props: {
                uid: token.uid,
                // isPaid を使いたい場合はここで返す（型も更新）
                // isPaid,
            },
        };
    } catch (err) {
        return { props: { uid: null } };
    }
};

export default PremiumLandingPage;
