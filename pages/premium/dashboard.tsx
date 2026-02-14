import { useState, useEffect, useMemo } from 'react';
import { doc, onSnapshot, collection, query, where, orderBy } from 'firebase/firestore';
import { NextPage, GetServerSideProps } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';
import nookies from 'nookies';

// Firebase - pages/premium/ 階層に合わせて ../../ に修正
import { adminAuth, adminDb } from '../../lib/firebase-admin';
import { getAuth, signOut } from 'firebase/auth';
import { app, db } from '../../lib/firebase-client';

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
declare const __app_id: string;
const appId = process.env.NEXT_PUBLIC_APP_ID || (typeof __app_id !== 'undefined' ? __app_id : 'default-app-id');

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
    const [foodLossItems, setFoodLossItems] = useState<any[]>([]);
    const [foodLossLoading, setFoodLossLoading] = useState(true);
    const [foodLossError, setFoodLossError] = useState<string | null>(null);

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
        return onSnapshot(doc(db, 'users', user.uid), (snap) => {
            const data = snap.data();
            setIsPaid(data?.plan === 'paid_480' || data?.isPaid === true);
            setStats({
                earnings: data?.totalEarnings || 0,
                userCount: data?.referralCounts?.users || 0
            });
        });
    }, [user.uid]);

    useEffect(() => {
        const projectId = (db as any)._databaseId?.projectId || 'unknown';
        console.log("Dashboard: Starting Food Loss fetch. appId:", appId, "ProjectID:", projectId);
        setFoodLossLoading(true);
        const itemsRef = collection(db, 'artifacts', appId, 'food_loss_items');
        console.log("Dashboard: Items collection path:", itemsRef.path);
        const q = query(itemsRef, where('status', '==', 'available'));
        return onSnapshot(q, (snapshot) => {
            console.log("Dashboard: Fetched items count:", snapshot.size);
            const fetchedItems = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() as any }));
            // インデックス不要にするため、メモリ内でソート（最新順）
            fetchedItems.sort((a: any, b: any) => {
                const timeA = a.createdAt?.seconds || 0;
                const timeB = b.createdAt?.seconds || 0;
                return timeB - timeA;
            });
            setFoodLossItems(fetchedItems);
            setFoodLossLoading(false);
            setFoodLossError(null);
        }, (err) => {
            console.error("Dashboard: Food loss fetch error details:", err.code, err.message, "Path:", itemsRef.path, "ProjectID:", projectId);
            setFoodLossError(err.message);
            setFoodLossLoading(false);
        });
    }, []);

    return (
        <div className="bg-[#FFFDFC] min-h-screen text-[#5D5757] font-sans overflow-x-hidden">
            <Head><title>みんなのNasuアプリ - プレミアム</title></Head>
            
            {/* --- SOFT BACKGROUND DECORATION --- */}
            <div className="fixed inset-0 pointer-events-none opacity-40">
                <div className="absolute top-[-5%] right-[-10%] w-[60%] h-[40%] bg-pink-50 blur-[100px] rounded-full" />
                <div className="absolute bottom-[10%] left-[-5%] w-[50%] h-[50%] bg-orange-50/50 blur-[110px] rounded-full" />
            </div>

            <div className="max-w-md mx-auto min-h-screen relative pb-12 bg-white shadow-sm">

                {/* --- HEADER --- */}
                <header className="sticky top-0 z-50 p-6 bg-white/70 backdrop-blur-lg flex justify-between items-center border-b border-pink-50">
                    <div>
                        <div className="flex items-center gap-2 mb-0.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                            <h1 className="text-xl font-black tracking-tighter text-[#4A4444]">みんなのNasuアプリ</h1>
                        </div>
                        <p className="text-[10px] font-bold text-rose-300 tracking-[0.2em] pl-4.5 uppercase">LIFESTYLE PREMIUM</p>
                    </div>
                    <button onClick={() => setShowEmergencyModal(true)} className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-400 active:scale-90 transition-all shadow-sm border border-white">
                        <RiIcons.RiAlarmWarningLine size={24} />
                    </button>
                </header>

                <main className="p-6 space-y-10">

                    {/* --- 1. REWARD CARD (Soft & Inviting) --- */}
                    <section className="px-2">
                        <div className="bg-gradient-to-br from-[#FFF5F5] to-[#FFF9F0] rounded-[3.5rem] p-8 border-2 border-white shadow-[0_20px_40px_rgba(255,182,193,0.1)] relative overflow-hidden group">
                            <div className="relative z-10 text-center">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/60 backdrop-blur-sm rounded-full border border-pink-100 mb-6">
                                    <IoSparklesOutline className="text-rose-400 text-xs" />
                                    <p className="text-rose-400 font-black text-[9px] tracking-widest uppercase">
                                        マイご褒美実績
                                    </p>
                                </div>
                                
                                <p className="text-rose-300/80 font-bold text-[10px] mb-2 uppercase tracking-widest">現在の獲得報酬</p>
                                <div className="flex justify-center items-baseline gap-1">
                                    <span className="text-[20px] font-bold text-rose-400/60">¥</span>
                                    <span className="text-5xl font-black text-[#5D5757] tracking-tighter">
                                        {stats.earnings.toLocaleString()}
                                    </span>
                                </div>
    
                                <div className="mt-8 grid grid-cols-3 gap-2">
                                    <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-3 border border-white text-center transition-all hover:scale-105 active:scale-95 shadow-sm">
                                        <p className="text-[14px] font-black text-[#5D5757]">{stats.userCount}</p>
                                        <p className="text-[8px] font-black text-rose-300 mt-0.5">ユーザー</p>
                                    </div>
                                    <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-3 border border-white text-center transition-all hover:scale-105 active:scale-95 shadow-sm">
                                        <p className="text-[14px] font-black text-[#5D5757]">0</p>
                                        <p className="text-[8px] font-black text-rose-300 mt-0.5">集客広告</p>
                                    </div>
                                    <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-3 border border-white text-center transition-all hover:scale-105 active:scale-95 shadow-sm">
                                        <p className="text-[14px] font-black text-[#5D5757]">0</p>
                                        <p className="text-[8px] font-black text-rose-300 mt-0.5">求人広告</p>
                                    </div>
                                </div>
                            </div>
                            <RiIcons.RiLeafLine size={130} className="absolute -right-6 -bottom-6 text-rose-100/30 -rotate-12 pointer-events-none" />
                        </div>
                    </section>

                    {/* --- EMERGENCY CONTACT (Organic Soft Button) --- */}
                    <section className="px-2">
                        <button 
                            onClick={() => setShowEmergencyModal(true)} 
                            className="w-full bg-white/40 backdrop-blur-md border-[3px] border-white/80 rounded-[3rem] p-6 flex items-center gap-5 group active:scale-[0.98] transition-all shadow-lg shadow-rose-100/20"
                        >
                            <div className="w-16 h-16 rounded-[2rem] bg-rose-400 flex items-center justify-center text-white shadow-lg shadow-rose-200 group-active:scale-95 transition-all relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-50" />
                                <RiIcons.RiAlarmWarningLine size={32} className="animate-pulse relative z-10" />
                            </div>
                            <div className="flex-1 text-left">
                                <h4 className="text-[17px] font-black tracking-tight text-[#5D5757]">緊急連絡先リスト</h4>
                                <p className="text-[10px] font-bold text-rose-300 mt-0.5 tracking-tight flex items-center gap-1 italic">
                                    Your 24/7 Support Guide
                                </p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-200 border border-white">
                                <RiIcons.RiArrowRightSLine size={24} />
                            </div>
                        </button>
                    </section>

                    {/* --- 2. MATCHING (Lifestyle Cards) --- */}
                    <section className="grid grid-cols-2 gap-4 px-2">
                        <div className="p-7 rounded-[3rem] bg-white border-2 border-white shadow-[0_15px_30px_rgba(0,0,0,0.02)] relative overflow-hidden group hover:bg-[#FFFDFC] transition-colors">
                            <div className="w-11 h-11 rounded-2xl bg-[#FFF5F5] flex items-center justify-center text-rose-300 mb-5 border border-rose-50">
                                <LucideIcons.Briefcase size={22} />
                            </div>
                            <p className="text-[16px] font-black tracking-tighter text-[#5D5757] mb-0.5">お仕事探し</p>
                            <p className="text-[9px] font-black text-rose-200 uppercase tracking-widest mb-4">Rescue Jobs</p>
                            <div className="bg-rose-50/30 rounded-2xl p-3 border border-rose-50/50">
                                <p className="text-[9px] font-bold text-rose-300 leading-tight italic">Coming Soon...</p>
                            </div>
                        </div>
                        <div className="p-7 rounded-[3rem] bg-white border-2 border-white shadow-[0_15px_30px_rgba(0,0,0,0.02)] relative overflow-hidden group hover:bg-[#FFFDFC] transition-colors">
                            <div className="w-11 h-11 rounded-2xl bg-[#FFF9F0] flex items-center justify-center text-amber-300 mb-5 border border-amber-50">
                                <LucideIcons.Store size={22} />
                            </div>
                            <p className="text-[16px] font-black tracking-tighter text-[#5D5757] mb-0.5">お店探し</p>
                            <p className="text-[9px] font-black text-amber-200 uppercase tracking-widest mb-4">Cute Stores</p>
                            <div className="bg-amber-50/30 rounded-2xl p-3 border border-amber-50/50">
                                <p className="text-[9px] font-bold text-amber-300 leading-tight italic">Waiting for you...</p>
                            </div>
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

                        {/* --- FOOD LOSS FEED (Magazine Style) --- */}
                        <div className="mt-12 px-2">
                            <div className="flex justify-between items-end mb-8 px-2">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                                        <p className="text-[10px] font-black text-rose-400 tracking-widest uppercase italic">Daily News</p>
                                    </div>
                                    <h3 className="text-2xl font-black text-[#4A4444] tracking-tighter">
                                        フードロス格安商品速報
                                    </h3>
                                </div>
                                <div className="pb-1">
                                    <span className="px-3 py-1 bg-white border border-pink-100 rounded-full text-[10px] font-black text-rose-300 shadow-sm uppercase tracking-tighter italic">Live</span>
                                </div>
                            </div>

                            {foodLossLoading ? (
                                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-8 px-2">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="shrink-0 w-[200px] h-[300px] bg-white border border-pink-50 rounded-[4rem] animate-pulse shadow-sm" />
                                    ))}
                                </div>
                            ) : foodLossError ? (
                                <div className="p-8 bg-rose-50/30 rounded-[3rem] border-2 border-white mx-2 text-center">
                                    <p className="text-[13px] font-black text-rose-300">情報の更新に失敗しました</p>
                                    <p className="text-[10px] text-rose-200 mt-1 font-bold italic">Check your connection</p>
                                </div>
                            ) : foodLossItems.length === 0 ? (
                                <div className="p-12 bg-[#FFFDFC] rounded-[4rem] border-2 border-white mx-2 text-center shadow-inner">
                                    <div className="w-20 h-20 bg-rose-50/50 rounded-full flex items-center justify-center mx-auto mb-5 border border-white">
                                        <RiIcons.RiShoppingBagLine className="text-rose-100 text-4xl" />
                                    </div>
                                    <p className="text-[14px] font-black text-rose-300">掲載中の商品はお休み中</p>
                                    <p className="text-[10px] text-rose-200 mt-2 font-bold italic tracking-wide">Stay tuned for updates!</p>
                                </div>
                            ) : (
                                <div className="flex gap-5 overflow-x-auto no-scrollbar pb-8 snap-x px-2">
                                    {foodLossItems.map((item) => (
                                        <button 
                                            key={item.id} 
                                            onClick={() => router.push(`/food-loss/manage/${item.storeId}`)}
                                            className="snap-start shrink-0 w-[210px] bg-white rounded-[4rem] border-4 border-white shadow-[0_25px_50px_rgba(255,182,193,0.15)] overflow-hidden text-left active:scale-[0.97] transition-all relative group"
                                        >
                                            <div className="aspect-[3/4] relative bg-rose-50/30 overflow-hidden">
                                                {item.imageUrl ? (
                                                    <Image src={item.imageUrl} alt={item.title} layout="fill" objectFit="cover" className="transition-transform duration-1000 group-hover:scale-110" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-rose-100">
                                                        <RiIcons.RiImage2Line size={48} />
                                                    </div>
                                                )}
                                                
                                                {/* Soft Overlays */}
                                                <div className="absolute inset-0 bg-gradient-to-t from-white/40 via-transparent to-transparent opacity-80" />
                                                
                                                {/* Time Badge (Glassmorphism) */}
                                                <div className="absolute top-5 left-5">
                                                    <div className="bg-white/70 backdrop-blur-md px-4 py-1.5 rounded-full shadow-lg border border-white/40">
                                                        <p className="text-[10px] font-black text-rose-400 leading-none tracking-tight">
                                                            受取 {item.pickupTime}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Cute Rescue Badge */}
                                                <div className="absolute top-5 right-5">
                                                    <div className="w-10 h-10 bg-rose-400 text-white rounded-full flex items-center justify-center shadow-lg transform rotate-12 group-hover:rotate-0 transition-transform duration-500">
                                                        <RiIcons.RiHandHeartLine size={24} />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="p-6 space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 bg-rose-200 rounded-full" />
                                                    <p className="text-[11px] font-black text-rose-300 truncate tracking-tight uppercase">{item.storeName}</p>
                                                </div>
                                                <p className="text-[16px] font-black text-[#5D5757] leading-tight h-10 line-clamp-2 tracking-tighter mb-2 italic">"{item.title}"</p>
                                                
                                                <div className="pt-2 flex items-end justify-between border-t border-pink-50">
                                                    <div>
                                                        <p className="text-[11px] font-black text-rose-400 italic mb-[-3px]">Special Price</p>
                                                        <div className="flex items-baseline gap-2">
                                                            <p className="text-2xl font-black text-[#5D5757] tracking-tighter">¥{item.price.toLocaleString()}</p>
                                                            {item.originalPrice && (
                                                                <p className="text-[11px] font-bold text-rose-200 line-through decoration-rose-100">¥{item.originalPrice.toLocaleString()}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="w-10 h-10 bg-rose-50 rounded-full flex items-center justify-center text-rose-400 border border-white shadow-sm group-hover:bg-rose-400 group-hover:text-white transition-all">
                                                        <RiIcons.RiArrowRightSLine size={24} />
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
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

                    {/* --- FREE TOOLS (Soft List Design) --- */}
                    <section className="space-y-6 px-3">
                        <div className="flex items-center gap-3 px-2">
                            <h3 className="text-[11px] font-black text-rose-300 tracking-[0.3em] uppercase italic">Free Lifestyle Tools</h3>
                        </div>
                        <div className="grid gap-5">
                            {FREE_APPS.map((app, i) => (
                                <button key={i} onClick={() => router.push(app.href)} className="group flex items-center bg-white border-2 border-white hover:border-pink-50 p-6 rounded-[3.5rem] transition-all text-left shadow-[0_15px_40px_rgba(0,0,0,0.02)] active:scale-[0.98] relative overflow-hidden">
                                    <div className="w-16 h-16 rounded-[2rem] bg-rose-50/40 flex items-center justify-center text-rose-200 group-hover:bg-rose-400 group-hover:text-white transition-all shadow-inner border border-rose-50">
                                        <app.Icon size={28} />
                                    </div>
                                    <div className="flex-1 ml-6">
                                        <p className="font-black text-[15px] text-[#5D5757] tracking-tight group-hover:text-rose-400 transition-colors uppercase italic">{app.title}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="w-1 h-1 bg-rose-200 rounded-full" />
                                            <p className="text-[10px] text-rose-200 font-black uppercase tracking-widest">{app.category}</p>
                                        </div>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-rose-50/50 flex items-center justify-center text-rose-100 border border-white group-hover:bg-rose-50 group-hover:text-rose-300 transition-all">
                                        <RiIcons.RiArrowRightSLine size={24} />
                                    </div>
                                </button>
                            ))}
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