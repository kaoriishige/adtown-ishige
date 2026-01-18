import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { app, db } from '../../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import {
    Users, Store, Building2,
} from 'lucide-react';
import {
    RiBankCardFill, RiShieldCheckFill, RiHistoryFill,
    RiShoppingBagFill, RiAddCircleFill, RiSettings4Fill, RiLogoutBoxRLine,
    RiPlantFill, RiFlashlightFill, RiHandHeartFill, RiExchangeBoxFill,
    RiArrowRightSLine, RiGiftFill, RiHeartFill,
    RiLightbulbFlashLine, RiHome4Line, RiLeafLine,
    RiExchangeFundsLine
} from 'react-icons/ri';
import Link from 'next/link';

export default function PremiumDashboard() {
    const router = useRouter();
    const auth = getAuth(app);
    // const [stripeId, setStripeId] = useState<string | null>(null); // Removed Stripe logic
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (u) => {
            if (u) {
                setUser(u);
                // onSnapshot(doc(db, 'users', u.uid), (s) => {
                //     setStripeId(s.data()?.stripeConnectId || null);
                // });
                setLoading(false);
            } else {
                router.push('/users/login');
            }
        });
        return () => unsubscribe();
    }, [auth, router]);

    // const handleStripeLink = async () => { ... } // Removed Stripe logic

    const handleLogout = async () => {
        await signOut(auth);
        router.push('/users/login');
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#F4F7F6]">
            <div className="animate-pulse font-black text-emerald-600 tracking-widest">
                PREMIUM CONSOLE STARTING...
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F4F7F6] pb-20 font-sans">
            <header className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
                <div className="flex items-center gap-2">
                    <RiShieldCheckFill className="text-emerald-500" size={24} />
                    <h1 className="text-xl font-black italic text-emerald-600 uppercase tracking-tighter">Premium Console</h1>
                </div>
                <div className="flex gap-4">
                    <button onClick={() => router.push('/premium/upload')} className="text-emerald-500 active:scale-90 transition-transform">
                        <RiAddCircleFill size={28} />
                    </button>
                    <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 active:scale-90 transition-transform">
                        <RiLogoutBoxRLine size={24} />
                    </button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto p-6">

                {/* 1. 全体ステータス (Database Stats) */}
                <section className="mb-10">
                    <h3 className="font-black text-gray-400 text-sm mb-6 px-2 tracking-widest uppercase flex items-center gap-2">
                        <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
                        紹介データ
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        {/* ユーザー数 */}
                        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col justify-between h-40">
                            <div className="flex items-center gap-3 text-gray-400">
                                <Users size={20} />
                                <span className="text-[10px] font-black tracking-widest uppercase">Users</span>
                            </div>
                            <p className="text-3xl font-black text-gray-800 tracking-tighter">
                                0<span className="text-sm text-gray-400 ml-1">人</span>
                            </p>
                        </div>

                        {/* 店舗数 */}
                        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col justify-between h-40">
                            <div className="flex items-center gap-3 text-gray-400">
                                <Store size={20} />
                                <span className="text-[10px] font-black tracking-widest uppercase">Shops</span>
                            </div>
                            <p className="text-3xl font-black text-gray-800 tracking-tighter">
                                0<span className="text-sm text-gray-400 ml-1">店舗</span>
                            </p>
                        </div>

                        {/* 企業数 */}
                        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col justify-between h-40">
                            <div className="flex items-center gap-3 text-gray-400">
                                <Building2 size={20} />
                                <span className="text-[10px] font-black tracking-widest uppercase">Companies</span>
                            </div>
                            <p className="text-3xl font-black text-gray-800 tracking-tighter">
                                0<span className="text-sm text-gray-400 ml-1">社</span>
                            </p>
                        </div>

                        {/* 金額・流通額 */}
                        <div className="bg-gray-900 p-6 rounded-[2rem] shadow-xl text-white flex flex-col justify-between h-40 relative overflow-hidden">
                            <div className="relative z-10 flex items-center gap-3 text-emerald-400">
                                <RiBankCardFill size={20} />
                                <span className="text-[10px] font-black tracking-widest uppercase">Total</span>
                            </div>
                            <div className="relative z-10">
                                <p className="text-2xl font-black tracking-tighter">
                                    ¥0
                                </p>
                            </div>
                            {/* Decorative bg */}
                            <div className="absolute -right-4 -bottom-4 text-white/5">
                                <RiBankCardFill size={100} />
                            </div>
                        </div>
                    </div>
                </section>

                {/* 2. プレミアムサービス一覧 */}
                <section className="mb-12">
                    <h3 className="font-black text-gray-400 text-sm mb-6 px-2 tracking-widest uppercase flex items-center gap-2">
                        <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
                        Premium Services
                    </h3>

                    <div className="grid grid-cols-1 gap-4">
                        {/* 紹介プログラムをリストの先頭に配置 */}
                        <MenuButton
                            href="/premium/referral"
                            icon={<RiGiftFill size={28} />}
                            title="紹介プログラム"
                            label="友人を招待して、地域で使えるギフト券やポイントを獲得"
                            color="from-amber-400 to-orange-600"
                        />

                        <MenuButton
                            href="/premium/skill"
                            icon={<RiExchangeFundsLine size={28} />}
                            title="那須スキル交換所"
                            label="得意な技術や知識を、地域の人と交換・売買できます"
                            color="from-blue-700 to-indigo-950"
                        />

                        <MenuButton
                            href="/premium/akihata"
                            icon={<RiLeafLine size={28} />}
                            title="那須あき畑速報"
                            label="耕作放棄地を再生。貸したい・借りたい畑の最新情報"
                            color="from-emerald-700 to-emerald-900"
                        />

                        <MenuButton
                            href="/premium/akiya"
                            icon={<RiHome4Line size={28} />}
                            title="那須あき家速報"
                            label="不動産サイトに載る前の「掘り出し物件」をいち早く共有"
                            color="from-slate-700 to-slate-900"
                        />

                        <MenuButton
                            href="/premium/tasukeai"
                            icon={<RiLightbulbFlashLine size={28} />}
                            title="那須たすけあい速報"
                            label="地域の困りごとを即時解決。セーフティネット掲示板"
                            color="from-orange-400 to-yellow-500"
                        />

                        <MenuButton
                            href="/premium/osuso"
                            icon={<RiPlantFill size={28} />}
                            title="おすそわけ畑"
                            label="採れすぎた野菜や果物を、地域のみんなにシェア"
                            color="from-emerald-500 to-green-600"
                        />

                        <MenuButton
                            href="/premium/half-price/create"
                            icon={<RiFlashlightFill size={28} />}
                            title="爆安セール速報"
                            label="店舗の閉店間際セールや、当日限定の割引情報を発信"
                            color="from-orange-500 to-red-500"
                        />

                        <MenuButton
                            href="/premium/flea-market"
                            icon={<RiShoppingBagFill size={28} />}
                            title="Nasuフリマ"
                            label="那須エリア限定のフリマ。手渡し取引で送料もカット"
                            color="from-pink-500 to-rose-500"
                        />

                        <MenuButton
                            href="/premium/helper"
                            icon={<RiHandHeartFill size={28} />}
                            title="ちょい手伝い"
                            label="電球交換から草むしりまで、有償で手伝いを依頼・提供"
                            color="from-teal-500 to-cyan-500"
                        />

                        <MenuButton
                            href="/premium/rental"
                            icon={<RiExchangeBoxFill size={28} />}
                            title="使ってない貸します"
                            label="たまにしか使わない工具やキャンプ用品の貸し借り市場"
                            color="from-blue-500 to-indigo-500"
                        />

                        <MenuButton
                            href="/premium/pet-board/create"
                            icon={<RiHeartFill size={28} />}
                            title="ペット掲示板"
                            label="迷子・里親募集・ペットシッターの相談コミュニティ"
                            color="from-purple-500 to-indigo-500"
                        />
                    </div>
                </section>

                {/* LINE登録の案内 (Bottom) */}
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-emerald-100 mt-10 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="font-black text-gray-700">ログインはLINEからなので、必ず登録をおこなってください。</p>
                    <a href="https://lin.ee/fwvipcZ" target="_blank" rel="noopener noreferrer" className="shrink-0 active:scale-95 transition-transform">
                        <img src="https://scdn.line-apps.com/n/line_add_friends/btn/ja.png" alt="友だち追加" height="36" />
                    </a>
                </div>
            </main>
        </div>
    );
}

function MenuButton({ href, icon, title, label, color }: any) {
    return (
        <Link href={href} className="group relative bg-white p-6 rounded-[2.2rem] shadow-sm border border-gray-100 active:scale-[0.98] transition-all flex items-center gap-5 hover:shadow-md hover:border-gray-200">
            <div className={`w-16 h-16 flex items-center justify-center bg-gradient-to-br ${color} rounded-2xl text-white shadow-lg group-hover:scale-105 transition-transform shrink-0`}>
                {icon}
            </div>
            <div className="flex-1">
                <h3 className="font-black text-xl tracking-tighter text-gray-800">{title}</h3>
                <p className="text-[11px] font-medium text-gray-500 mt-1 leading-relaxed">{label}</p>
            </div>
            <RiArrowRightSLine className="text-gray-300 group-hover:translate-x-1 transition-transform" size={24} />
        </Link>
    );
}