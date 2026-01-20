import { useState, useEffect, useMemo } from 'react';
import { NextPage, GetServerSideProps } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';
import nookies from 'nookies';

// Firebase - pages/premium/ 階層に合わせて ../../ に修正
import { adminAuth, adminDb } from '../../lib/firebase-admin';
import { getAuth, signOut } from 'firebase/auth';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import { app } from '../../lib/firebase-client';

// Icons
import * as RiIcons from 'react-icons/ri';
import * as LucideIcons from 'lucide-react';
import { IoSparklesOutline } from 'react-icons/io5';

type EmergencyContact = {
    name: string;
    number?: string;
    description: string;
    url: string;
};

// --- アプリ定義 (33個完全版) ---
const PREMIUM_APPS = [
    { title: "紹介プログラム", href: "/premium/referral", Icon: RiIcons.RiGiftFill, color: "from-amber-400 to-orange-600" },
    { title: "スキル交換", href: "/premium/skill", Icon: RiIcons.RiExchangeFundsLine, color: "from-blue-700 to-indigo-950" },
    { title: "あき畑情報", href: "/premium/akihata", Icon: RiIcons.RiLeafLine, color: "from-emerald-700 to-emerald-900" },
    { title: "あき家情報", href: "/premium/akiya", Icon: RiIcons.RiHome4Line, color: "from-slate-700 to-slate-900" },
    { title: "たすけあい", href: "/premium/tasukeai", Icon: RiIcons.RiLightbulbFlashLine, color: "from-orange-400 to-yellow-500" },
    { title: "おすそわけ", href: "/premium/osuso", Icon: RiIcons.RiPlantFill, color: "from-emerald-500 to-green-600" },
    { title: "爆安セール速報", href: "/premium/half-price", Icon: RiIcons.RiFlashlightFill, color: "from-orange-500 to-red-500" },
    { title: "Nasuフリマ", href: "/premium/flea-market", Icon: RiIcons.RiShoppingBagFill, color: "from-pink-500 to-rose-500" },
    { title: "ちょっとお手伝い", href: "/premium/helper", Icon: RiIcons.RiHandHeartFill, color: "from-teal-500 to-cyan-500" },
    { title: "それ貸します", href: "/premium/rental", Icon: RiIcons.RiExchangeBoxFill, color: "from-blue-500 to-indigo-500" },
    { title: "ペット掲示板", href: "/premium/pet-board", Icon: RiIcons.RiHeartFill, color: "from-purple-500 to-indigo-500" },
];

const FREE_APPS = [
    { title: "スーパー特売&AI献立", href: "/nasu/kondate", Icon: LucideIcons.Utensils, category: "節約" },
    { title: "ドラッグストア特売ナビ", href: "/nasu", Icon: LucideIcons.Store, category: "節約" },
    { title: "最安ガソリンナビ", href: "/apps/AIGasPriceTracker", Icon: LucideIcons.Fuel, category: "生活" },
    { title: "アレどこ", href: "/apps/Aredoko", Icon: LucideIcons.Filter, category: "収納" },
    { title: "断捨離AI", href: "/apps/ClosetSlimmerAI", Icon: LucideIcons.WashingMachine, category: "収納" },
    { title: "生活の裏技", href: "/apps/LifeHacksAI", Icon: LucideIcons.Lightbulb, category: "生活" },
    { title: "ファッション診断", href: "/apps/FashionAI", Icon: LucideIcons.Shirt, category: "生活" },
    { title: "引越しナビ", href: "/apps/MovingHelperAI", Icon: LucideIcons.Mail, category: "生活" },
    { title: "BMI管理", href: "/apps/BodyMassTracker", Icon: LucideIcons.Heart, category: "健康" },
    { title: "育児ログ", href: "/apps/BabyLog", Icon: LucideIcons.Gift, category: "子育て" },
    { title: "子育てナビ", href: "/apps/ParentingInfo", Icon: LucideIcons.User, category: "子育て" },
    { title: "脳力診断", href: "/apps/BrainTest", Icon: LucideIcons.Brain, category: "エンタメ" },
    { title: "那須クイズ", href: "/apps/QuizGame", Icon: LucideIcons.Gamepad, category: "エンタメ" },
    { title: "防災ナビ", href: "/apps/DisasterInfo", Icon: LucideIcons.Shield, category: "防災" },
    { title: "運勢占い", href: "/apps/DailyFortune", Icon: LucideIcons.Droplet, category: "診断" },
    { title: "適職診断", href: "/apps/AptitudeTest", Icon: LucideIcons.Target, category: "診断" },
    { title: "褒め言葉AI", href: "/apps/MorningComplimentAI", Icon: LucideIcons.Sun, category: "診断" },
    { title: "AI手相占い", href: "/apps/Palmistry", Icon: LucideIcons.Sparkles, category: "診断" },
    { title: "苦手攻略", href: "/apps/RelationshipHint", Icon: LucideIcons.Users, category: "人間関係" },
    { title: "学習ログ", href: "/apps/SkillTimeTracker", Icon: LucideIcons.TrendingUp, category: "スキル" },
    { title: "気分ログ", href: "/apps/MoodTracker", Icon: LucideIcons.Smile, category: "趣味" },
];

const SPONSORS = [
    { name: '株式会社おまかせオート', image: '/images/partner-omakaseauto.png', url: 'https://www.omakase-auto.jp/' },
    { name: '株式会社大輪', image: '/images/partner-dairin.png', url: 'https://www.jp-dairin.jp/' },
    { name: '社会福祉法人 小春福祉会', image: '/images/partner-koharu.png', url: 'https://koharu-fukushikai.com/' },
];

const PremiumDashboardPage: NextPage<{ user: any, isPaid: boolean }> = ({ user, isPaid: initialPaid }) => {
    const router = useRouter();
    const [isPaid, setIsPaid] = useState(initialPaid);
    const [stats, setStats] = useState({ earnings: 0, userCount: 0 });
    const [showEmergencyModal, setShowEmergencyModal] = useState(false);
    const [selectedSponsorUrl, setSelectedSponsorUrl] = useState<string | null>(null);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

    const handleLogout = async () => {
        try {
            const auth = getAuth(app);
            await signOut(auth);
            await fetch('/api/auth/logout', { method: 'POST' }); // セッションクッキー削除用
            router.push('/users/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    // --- SPONSOR MODAL HANDLER Removed auto-open to use iframe ---

    const emergencyContacts: EmergencyContact[] = useMemo(() => [
        { name: '救急安心センター', number: '#7119', description: '急な病気やケガで救急車を呼ぶか迷った時', url: 'https://www.fdma.go.jp/publication/portal/post2.html', },
        { name: '那須塩原市の休日当番医', description: '那須塩原市の休日・夜間の急病対応', url: 'https://www.city.nasushiobara.tochigi.jp/soshikikarasagasu/kenkozoshinka/kyukyu_kyumei/1/3340.html', },
        { name: '大田原市の休日当番医', description: '大田原市の休日・夜間の急病対応', url: 'https://www.city.ohtawara.tochigi.jp/docs/2013082771612/', },
        { name: '那須町の休日当番医', description: '那須町の休日・夜間の急病対応', url: 'https://www.town.nasu.lg.jp/0130/info-0000003505-1.html', },
        { name: '水道のトラブル (有)クリプトン', number: '090-2463-6638', description: '地元で40年。那須エリアの水道修理・緊急対応', url: 'https://xn--bbkyao7065bpyck41as89d.com/emergency/', },
        { name: '消費者ホットライン', number: '188', description: '商品やサービスのトラブル相談', url: 'https://www.caa.go.jp/policies/policy/local_cooperation/local_consumer_administration/hotline/', },
    ], []);

    useEffect(() => {
        const db = getFirestore(app);
        return onSnapshot(doc(db, 'users', user.uid), (snap) => {
            const data = snap.data();
            setIsPaid(data?.plan === 'paid_480' || data?.isPaid === true);
            setStats({
                earnings: data?.totalEarnings || 0,
                userCount: data?.referralCounts?.users || 0
            });
        });
    }, [user.uid]);

    return (
        <div className="bg-[#FAF9F6] min-h-screen text-[#4A4A4A] font-sans">
            <Head><title>みんなのNasuアプリ - ダッシュボード</title></Head>

            <div className="max-w-md mx-auto min-h-screen relative pb-12 bg-white shadow-sm">

                {/* --- HEADER --- */}
                <header className="sticky top-0 z-50 p-6 bg-white/90 backdrop-blur-md flex justify-between items-center border-b border-gray-50">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-[#2D2D2D]">みんなのNasuアプリ</h1>
                        <p className="text-xs text-gray-500 mt-1">ログイン中: {user.email}</p>
                    </div>
                    <button onClick={() => setShowEmergencyModal(true)} className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-400 active:scale-90 transition-transform shadow-sm">
                        <RiIcons.RiAlarmWarningLine size={22} />
                    </button>
                </header>

                <main className="p-6 space-y-10">

                    {/* --- 1. REWARD CARD --- */}
                    <section className="bg-gradient-to-br from-[#FFF8F8] to-[#F5F9FF] rounded-[2.5rem] p-8 border border-white shadow-[0_15px_30px_rgba(0,0,0,0.02)] relative overflow-hidden">
                        <div className="relative z-10 text-center">
                            <p className="text-rose-400 font-bold text-[10px] tracking-widest uppercase mb-1 flex justify-center items-center gap-1">
                                <IoSparklesOutline /> 有料プラン紹介報酬
                            </p>
                            <p className="text-gray-400 font-bold text-[10px] mb-2">現在の報酬実績</p>
                            <span className="text-4xl font-serif font-bold text-[#2D2D2D]">¥{stats.earnings.toLocaleString()}</span>

                            <div className="mt-8 space-y-2">
                                <div className="grid grid-cols-1 gap-2">
                                    <div className="py-2.5 bg-white/80 rounded-2xl text-[10px] font-bold text-gray-500 border border-white text-center">
                                        ユーザー紹介: {stats.userCount}名
                                    </div>
                                    <div className="py-2.5 bg-white/80 rounded-2xl text-[10px] font-bold text-gray-500 border border-white text-center">
                                        集客広告紹介: 0名
                                    </div>
                                    <div className="py-2.5 bg-white/80 rounded-2xl text-[10px] font-bold text-gray-500 border border-white text-center">
                                        求人広告紹介: 0名
                                    </div>
                                </div>
                            </div>
                        </div>
                        <RiIcons.RiLeafLine size={150} className="absolute -right-10 -bottom-10 opacity-[0.03] -rotate-12" />
                    </section>

                    {/* --- EMERGENCY CONTACT TRIGGER --- */}
                    <section className="mt-[-1.5rem]">
                        <button onClick={() => setShowEmergencyModal(true)} className="w-full bg-rose-50/50 border border-rose-100/50 rounded-[2rem] p-5 flex flex-col gap-3 transform active:scale-[0.98] transition-all shadow-sm">
                            <div className="flex items-center gap-2 text-rose-500">
                                <RiIcons.RiAlarmWarningLine size={24} className="animate-pulse" />
                                <span className="text-lg font-bold">緊急連絡先を確認</span>
                            </div>
                            <div className="flex items-center justify-between w-full">
                                <p className="text-[10px] text-gray-500 leading-relaxed text-left font-medium">
                                    休日当番医・夜間診療・水道のトラブルなど<br />
                                    地域の「困った」にすぐ対応。
                                </p>
                                <RiIcons.RiArrowRightSLine className="text-rose-200" size={24} />
                            </div>
                        </button>
                    </section>

                    {/* --- 2. MATCHING (求人・店舗) --- */}
                    <section className="grid grid-cols-2 gap-4">
                        {/* お仕事探し (Disabled) */}
                        <div className="p-6 rounded-[2.2rem] bg-gray-50 text-gray-400 border border-gray-100 relative shadow-sm opacity-80 overflow-hidden">
                            <LucideIcons.Briefcase size={22} className="mb-4 opacity-40" />
                            <p className="text-sm font-bold tracking-tight mb-0.5">お仕事探し</p>
                            <p className="text-[9px] font-bold opacity-60 uppercase tracking-widest mb-2">求人マッチング</p>
                            <p className="text-[8px] font-bold text-rose-400 bg-rose-50 p-2 rounded-xl leading-tight">
                                只今の期間、企業様を募集中です。公開までしばらくお待ちください。
                            </p>
                        </div>
                        {/* 店舗マッチング (Disabled) */}
                        <div className="p-6 rounded-[2.2rem] bg-gray-50 text-gray-400 border border-gray-100 relative shadow-sm opacity-80 overflow-hidden">
                            <LucideIcons.Store size={22} className="mb-4 opacity-40" />
                            <p className="text-sm font-bold tracking-tight mb-0.5">店舗マッチング</p>
                            <p className="text-[9px] font-bold opacity-60 uppercase tracking-widest mb-2">店舗マッチング</p>
                            <p className="text-[8px] font-bold text-amber-500 bg-amber-50 p-2 rounded-xl leading-tight">
                                只今の期間、店舗様を募集中です。公開までしばらくお待ちください。
                            </p>
                        </div>
                    </section>

                    {/* --- 3. PREMIUM LIBRARY (11個) --- */}
                    <section>
                        <div className="flex justify-between items-center mb-5 px-2">
                            <h3 className="text-[11px] font-black text-gray-400 tracking-widest uppercase">有料アプリ</h3>
                            {!isPaid && <span className="text-[9px] bg-rose-50 text-rose-400 px-2 py-0.5 rounded-full font-bold">会員限定解除中</span>}
                        </div>
                        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 snap-x px-1">
                            {PREMIUM_APPS.map((app, i) => (
                                <div key={i} onClick={() => isPaid ? router.push(app.href) : router.push('/premium')} className="snap-center shrink-0 w-20 text-center group">
                                    <div className={`w-20 h-20 rounded-[2.2rem] flex items-center justify-center mb-2 transition-all shadow-sm border ${isPaid ? 'bg-white border-rose-100 text-rose-400 group-active:scale-90' : 'bg-gray-50 text-gray-300'}`}>
                                        {isPaid ? <app.Icon size={26} /> : <RiIcons.RiLockFill size={22} />}
                                    </div>
                                    <p className="text-[9px] font-bold text-gray-500 tracking-tighter leading-tight break-keep px-1">{app.title}</p>
                                </div>
                            ))}
                        </div>

                        {/* --- PREMIUM UPSELL (Always visible for testing/promotion) --- */}
                        <div className="mt-8 px-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <div className="bg-pink-50 rounded-[2rem] p-5 border border-pink-100 space-y-4 shadow-sm">
                                <div className="space-y-1 text-center">
                                    <h4 className="text-sm font-black text-pink-600">プレミアムプラン月額480円</h4>
                                    <p className="text-[10px] font-bold text-pink-400 leading-relaxed">
                                        合わなければ、いつでも解約できます。<br />
                                        まずは1ヶ月だけ試してみてください。
                                    </p>
                                </div>
                                <button
                                    onClick={() => router.push('/premium')}
                                    className="w-full py-4 bg-pink-500 text-white rounded-2xl font-black text-sm shadow-lg shadow-pink-100 flex items-center justify-center gap-2 active:scale-95 transition-all"
                                >
                                    プレミアムを見てみる
                                    <RiIcons.RiArrowRightSLine size={18} />
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* --- 4. FREE TOOLS (22個) --- */}
                    <section className="space-y-4">
                        <h3 className="text-[11px] font-black text-gray-400 tracking-widest uppercase px-2">無料アプリ</h3>
                        <div className="grid gap-3">
                            {FREE_APPS.map((app, i) => (
                                <button key={i} onClick={() => router.push(app.href)} className="group flex items-center gap-4 bg-white hover:bg-gray-50/50 p-4 rounded-[1.8rem] border border-gray-100 transition-all text-left shadow-sm active:scale-[0.98]">
                                    <div className="w-12 h-12 rounded-2xl bg-[#F8F9FB] flex items-center justify-center text-gray-400 group-hover:bg-white transition-all group-hover:text-rose-400">
                                        <app.Icon size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-sm text-[#4A4A4A] tracking-tight">{app.title}</p>
                                        <p className="text-[9px] text-gray-300 font-bold uppercase tracking-widest mt-0.5">{app.category}</p>
                                    </div>
                                    <RiIcons.RiArrowRightSLine className="text-gray-200 group-hover:text-rose-300" size={20} />
                                </button>
                            ))}
                        </div>

                        {/* --- SECOND PREMIUM UPSELL (At the end of all apps) --- */}
                        <div className="mt-8 px-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <div className="bg-pink-50 rounded-[2rem] p-5 border border-pink-100 space-y-4 shadow-sm">
                                <div className="space-y-1 text-center">
                                    <h4 className="text-sm font-black text-pink-600">プレミアムプラン月額480円</h4>
                                    <p className="text-[10px] font-bold text-pink-400 leading-relaxed">
                                        合わなければ、いつでも解約できます。<br />
                                        まずは1ヶ月だけ試してみてください。
                                    </p>
                                </div>
                                <button
                                    onClick={() => router.push('/premium')}
                                    className="w-full py-4 bg-pink-500 text-white rounded-2xl font-black text-sm shadow-lg shadow-pink-100 flex items-center justify-center gap-2 active:scale-95 transition-all"
                                >
                                    プレミアムを見てみる
                                    <RiIcons.RiArrowRightSLine size={18} />
                                </button>
                            </div>
                        </div>
                    </section>



                    {/* --- 5. FOOTER --- */}
                    <footer className="pt-12 pb-6 text-center border-t border-gray-50 mt-10 space-y-10">
                        {/* 地域の協賛企業セクション */}
                        <section className="pt-4 border-t border-gray-100">
                            <h3 className="text-[10px] font-bold text-gray-400 text-center mb-4 tracking-widest uppercase italic">
                                地域の協賛企業
                            </h3>
                            <div className="space-y-3 px-2">
                                {SPONSORS.map((sponsor) => (
                                    <button
                                        key={sponsor.name}
                                        onClick={() => setSelectedSponsorUrl(sponsor.url)}
                                        className="w-full flex items-center bg-white rounded-2xl border border-gray-100 p-3 shadow-sm active:scale-95 transition-all group"
                                    >
                                        <div className="w-10 flex justify-start">
                                            <div className="bg-gray-50 p-2 rounded-full text-gray-300 group-hover:text-blue-500 transition-colors">
                                                <RiIcons.RiArrowGoBackLine size={16} />
                                            </div>
                                        </div>
                                        <div className="flex-1 flex justify-center">
                                            <div className="relative h-8 flex items-center justify-center">
                                                <img
                                                    src={sponsor.image}
                                                    alt={sponsor.name}
                                                    className="h-full object-contain max-w-[150px] opacity-90 transition-opacity hover:opacity-100"
                                                    onError={(e) => {
                                                        const target = e.currentTarget as HTMLImageElement;
                                                        target.style.display = 'none';
                                                        const next = target.nextElementSibling as HTMLElement;
                                                        if (next) next.classList.remove('hidden');
                                                    }}
                                                />
                                                <span className="hidden text-sm font-black text-gray-400 tracking-tighter uppercase italic">{sponsor.name}</span>
                                            </div>
                                        </div>
                                        <div className="w-10 flex justify-end text-gray-200 group-hover:text-gray-400 transition-colors">
                                            <RiIcons.RiArrowRightSLine size={24} />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* LINE & ACCOUNT CONTROLS */}
                        <div className="text-center pt-8 space-y-6 pb-6 border-t border-gray-50">
                            <div className="space-y-2">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">お問い合わせはLINEでお願いします</p>
                                <a href="https://lin.ee/Aac3C0d" target="_blank" rel="noopener noreferrer" className="inline-block active:scale-95 transition">
                                    <img src="https://scdn.line-apps.com/n/line_add_friends/btn/ja.png" alt="LINE" height="36" className="h-9" />
                                </a>
                            </div>

                            <div className="px-4 space-y-3">
                                <button onClick={handleLogout} className="w-full py-4 text-red-600 font-bold bg-red-50 rounded-xl border border-red-100 active:scale-95 transition-all shadow-sm">ログアウト</button>
                                <button onClick={() => setIsCancelModalOpen(true)} className="w-full py-2 text-gray-400 text-[10px] font-bold hover:text-gray-600 transition-colors">アカウントを解約する</button>
                            </div>

                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-8">© 2026 株式会社adtown</p>
                        </div>
                    </footer>
                </main>
            </div>

            {/* --- EMERGENCY MODAL --- */}
            {showEmergencyModal && (
                <div className="fixed inset-0 z-[100] bg-[#1A1F2C]/60 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-sm max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        {/* Modal Header */}
                        <div className="p-4 flex items-center border-b border-gray-50 bg-white sticky top-0 z-10">
                            <button
                                onClick={() => setShowEmergencyModal(false)}
                                className="text-[#007aff] text-base font-bold flex items-center gap-0.5 active:opacity-60 transition-opacity"
                            >
                                <LucideIcons.ChevronLeft size={20} />
                                戻る
                            </button>
                            <div className="flex-1 flex justify-center pr-12"> {/* pr-12 to offset the back button and center the title */}
                                <div className="flex items-center gap-2 text-rose-500">
                                    <RiIcons.RiAlarmWarningLine size={20} />
                                    <h2 className="text-base font-bold">緊急連絡先</h2>
                                </div>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar bg-gray-50/30">
                            {emergencyContacts.map((contact, i) => (
                                <div key={i} className="bg-white border border-white rounded-[1.8rem] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-3">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="space-y-1">
                                            <h3 className="font-bold text-[#2D2D2D] text-sm leading-tight">{contact.name}</h3>
                                            <p className="text-[10px] text-gray-400 font-medium leading-snug">{contact.description}</p>
                                        </div>
                                        {contact.number && (
                                            <a
                                                href={`tel:${contact.number.replace(/[^0-9#]/g, '')}`}
                                                className="shrink-0 px-3 py-1 bg-blue-50 text-blue-500 rounded-full text-[10px] font-bold active:scale-95 transition-all hover:bg-blue-100"
                                            >
                                                {contact.number}
                                            </a>
                                        )}
                                    </div>
                                    <a
                                        href={contact.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 text-[10px] text-blue-400 font-bold hover:text-blue-500 transition-colors group"
                                    >
                                        <span className="border-b border-blue-100 group-hover:border-blue-300">公式サイトを確認する</span>
                                        <LucideIcons.ExternalLink size={10} className="group-hover:translate-x-0.5 transition-transform" />
                                    </a>
                                </div>
                            ))}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 bg-white border-t border-gray-50">
                            <button
                                onClick={() => setShowEmergencyModal(false)}
                                className="w-full py-4 bg-[#1A1F2C] text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
                            >
                                <LucideIcons.CornerDownLeft size={18} />
                                ホームに戻る
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- CANCEL MODAL --- */}
            {isCancelModalOpen && (
                <div className="fixed inset-0 z-[110] bg-[#1A1F2C]/60 backdrop-blur-md flex items-center justify-center p-6">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-xs p-8 text-center space-y-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-400">
                            <RiIcons.RiInformationLine size={32} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-lg font-bold text-[#2D2D2D]">アカウントの解約</h3>
                            <p className="text-xs text-gray-500 leading-relaxed font-medium">
                                解約の手続きはLINE公式アカウントにて承っております。恐れ入りますが、トーク画面より「解約希望」とメッセージをお送りください。
                            </p>
                        </div>
                        <div className="space-y-3 pt-2">
                            <a
                                href="https://lin.ee/Aac3C0d"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full py-4 bg-[#06C755] text-white rounded-2xl font-bold active:scale-95 transition-all shadow-md"
                            >
                                LINEでお問い合わせ
                            </a>
                            <button
                                onClick={() => setIsCancelModalOpen(false)}
                                className="block w-full py-4 bg-gray-50 text-gray-400 rounded-2xl font-bold active:scale-95 transition-all"
                            >
                                戻る
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- EXTERNAL SITE MODAL --- */}
            {selectedSponsorUrl && (
                <div className="fixed inset-0 z-[200] flex flex-col bg-white">
                    <div className="p-4 border-b flex justify-between items-center bg-white sticky top-0 shadow-sm">
                        <button onClick={() => setSelectedSponsorUrl(null)} className="flex items-center text-[#007aff] font-bold gap-1 active:opacity-50">
                            <LucideIcons.ChevronLeft size={24} />
                            <span>アプリに戻る</span>
                        </button>
                        <button onClick={() => setSelectedSponsorUrl(null)} className="text-gray-300">
                            <RiIcons.RiCloseCircleLine size={32} />
                        </button>
                    </div>
                    <div className="flex-1 bg-gray-100 overflow-hidden">
                        <iframe
                            src={selectedSponsorUrl}
                            className="w-full h-full border-none"
                            title="Sponsor Site"
                            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
    try {
        const cookies = nookies.get(context);
        const session = cookies.session || '';
        if (!session) return { redirect: { destination: '/users/login', permanent: false } };
        const token = await adminAuth.verifySessionCookie(session, true);
        const userDoc = await adminDb.collection('users').doc(token.uid).get();
        return {
            props: {
                user: { uid: token.uid, email: token.email || null },
                isPaid: userDoc.data()?.plan === 'paid_480' || userDoc.data()?.isPaid === true
            }
        };
    } catch (err) {
        return { redirect: { destination: '/users/login', permanent: false } };
    }
};

export default PremiumDashboardPage;