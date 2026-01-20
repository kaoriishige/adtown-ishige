import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { app } from '../../lib/firebase';
import {
    Users, Store, Building2,
} from 'lucide-react';
import {
    RiBankCardFill, RiShieldCheckFill, RiLogoutBoxRLine,
    RiPlantFill, RiFlashlightFill, RiHandHeartFill, RiExchangeBoxFill,
    RiArrowRightSLine, RiGiftFill, RiHeartFill,
    RiLightbulbFlashLine, RiHome4Line, RiLeafLine,
    RiExchangeFundsLine,
    RiShoppingBagFill,
    RiUserForbidLine
} from 'react-icons/ri';
import Link from 'next/link';
import nookies from 'nookies';

export default function PremiumDashboard() {
    const router = useRouter();
    const auth = getAuth(app);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (u) => {
            if (u) {
                setLoading(false);
            } else {
                router.push('/users/login');
            }
        });
        return () => unsubscribe();
    }, [auth, router]);

    // ログアウト処理
    const handleLogout = async () => {
        if (!window.confirm("ログアウトしますか？")) return;
        try {
            nookies.destroy(null, 'session', { path: '/' });
            await signOut(auth);
            router.push('/users/login');
        } catch (error) {
            console.error("Logout error:", error);
            router.push('/users/login');
        }
    };

    // 解約処理（Stripeポータルへ）
    const handleSubscriptionCancel = async () => {
        if (!window.confirm("お支払い管理・解約画面へ移動しますか？")) return;
        try {
            const res = await fetch('/api/stripe/create-portal-session', { method: 'POST' });
            if (!res.ok) throw new Error('Portal session error');
            const { url } = await res.json();
            window.location.href = url;
        } catch (err) {
            console.error("Stripe Portal Error:", err);
            alert("管理画面への接続に失敗しました。");
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#F4F7F6]">
            <div className="animate-spin h-8 w-8 border-4 border-emerald-600 rounded-full border-t-transparent" />
        </div>
    );

    // LINEメッセージコンポーネント
    const LineMessage = () => (
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-emerald-100 my-8 text-center">
            <p className="font-black text-gray-700 text-[14px]">
                ログインは、みんなのNasuアプリのLINEからとなります。
            </p>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F4F7F6] pb-20 font-sans">
            {/* --- HEADER --- */}
            <header className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
                <div className="flex items-center gap-2">
                    <RiShieldCheckFill className="text-emerald-500" size={24} />
                    <h1 className="text-xl font-black italic text-emerald-600 uppercase tracking-tighter">Premium Console</h1>
                </div>

                <button onClick={handleLogout} className="flex items-center gap-1.5 bg-gray-50 text-gray-500 hover:text-red-600 px-4 py-2 rounded-xl border border-gray-200 transition-all active:scale-95 shadow-sm">
                    <RiLogoutBoxRLine size={18} />
                    <span className="text-[11px] font-black uppercase tracking-widest">Logout</span>
                </button>
            </header>

            <main className="max-w-4xl mx-auto p-6">

                <LineMessage />

                {/* --- 実績データ --- */}
                <section className="mb-10 text-left">
                    <h3 className="font-black text-gray-400 text-[11px] mb-6 px-2 tracking-[0.2em] uppercase flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> DATA ANALYTICS
                    </h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard icon={<Users size={20} />} label="Users" value="0" unit="人" />
                        <StatCard icon={<Store size={20} />} label="Shops" value="0" unit="店舗" />
                        <StatCard icon={<Building2 size={20} />} label="Companies" value="0" unit="社" />
                        <div className="bg-gray-900 p-6 rounded-[2rem] shadow-xl text-white flex flex-col justify-between h-40 relative overflow-hidden">
                            <div className="relative z-10 flex items-center gap-3 text-emerald-400">
                                <RiBankCardFill size={20} />
                                <span className="text-[10px] font-black tracking-widest uppercase text-emerald-500/80">Earnings</span>
                            </div>
                            <div className="relative z-10">
                                <p className="text-3xl font-black italic">¥0</p>
                            </div>
                            <RiBankCardFill className="absolute -right-4 -bottom-4 text-white/5" size={100} />
                        </div>
                    </div>
                </section>

                {/* --- プレミアムサービス一覧（全項目） --- */}
                <section className="mb-12 text-left">
                    <h3 className="font-black text-gray-400 text-[11px] mb-6 px-2 tracking-[0.2em] uppercase flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Premium Services
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <MenuButton href="/premium/referral" icon={<RiGiftFill size={28} />} title="紹介プログラム" label="友人を招待して、地域で使えるポイントを獲得" color="from-amber-400 to-orange-600" />
                        <MenuButton href="/premium/skill" icon={<RiExchangeFundsLine size={28} />} title="那須スキル交換所" label="得意な技術や知識を、地域の人と交換・売買" color="from-blue-700 to-indigo-950" />
                        <MenuButton href="/premium/akihata" icon={<RiLeafLine size={28} />} title="那須あき畑速報" label="貸したい・借りたい畑の最新情報を共有" color="from-emerald-700 to-emerald-900" />
                        <MenuButton href="/premium/akiya" icon={<RiHome4Line size={28} />} title="那須あき家速報" label="不動産サイト掲載前の掘り出し物件情報を公開" color="from-slate-700 to-slate-900" />
                        <MenuButton href="/premium/tasukeai" icon={<RiLightbulbFlashLine size={28} />} title="那須たすけあい速報" label="地域の困りごとを即時解決するセーフティネット" color="from-orange-400 to-yellow-500" />
                        <MenuButton href="/premium/osuso" icon={<RiPlantFill size={28} />} title="おすそわけ畑" label="採れすぎた野菜や果物を地域のみんなにシェア" color="from-emerald-500 to-green-600" />
                        <MenuButton href="/premium/half-price" icon={<RiFlashlightFill size={28} />} title="爆安セール速報" label="店舗の閉店間際や当日限定の割引情報を発信" color="from-orange-500 to-red-500" />
                        <MenuButton href="/premium/flea-market" icon={<RiShoppingBagFill size={28} />} title="Nasuフリマ" label="那須エリア限定。手渡し取引で送料カット" color="from-pink-500 to-rose-500" />
                        <MenuButton href="/premium/helper" icon={<RiHandHeartFill size={28} />} title="ちょい手伝い" label="電球交換から草むしりまで有償でお手伝い" color="from-teal-500 to-cyan-500" />
                        <MenuButton href="/premium/rental" icon={<RiExchangeBoxFill size={28} />} title="使ってない貸します" label="工具やキャンプ用品の貸し借りコミュニティ" color="from-blue-500 to-indigo-500" />
                        <MenuButton href="/premium/pet-board" icon={<RiHeartFill size={28} />} title="ペット掲示板" label="迷子・里親募集・ペットシッター相談" color="from-purple-500 to-indigo-500" />
                    </div>
                </section>

                <LineMessage />

                {/* --- 解約ボタン --- */}
                <div className="mt-20 pt-10 border-t border-gray-200 text-center">
                    <button
                        onClick={handleSubscriptionCancel}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-100 hover:bg-red-50 transition-all font-black text-xs uppercase tracking-widest shadow-sm group"
                    >
                        <RiUserForbidLine className="group-hover:animate-pulse" size={18} />
                        プレミアムプランを解約する
                    </button>
                    <p className="mt-4 text-[10px] text-gray-300 font-bold italic">
                        ※解約後も現在の契約期間終了までは全ての機能を利用可能です。
                    </p>
                </div>
            </main>
        </div>
    );
}

function StatCard({ icon, label, value, unit }: any) {
    return (
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col justify-between h-40 text-left">
            <div className="flex items-center gap-3 text-gray-400">
                {icon}
                <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
            </div>
            <p className="text-3xl font-black text-gray-800 tracking-tighter">
                {value}<span className="text-sm text-gray-400 ml-1 font-bold">{unit}</span>
            </p>
        </div>
    );
}

function MenuButton({ href, icon, title, label, color }: any) {
    return (
        <Link href={href} className="group relative bg-white p-6 rounded-[2.2rem] shadow-sm border border-gray-100 active:scale-[0.98] transition-all flex items-center gap-5 hover:shadow-md hover:border-gray-200 text-left">
            <div className={`w-16 h-16 flex items-center justify-center bg-gradient-to-br ${color} rounded-2xl text-white shadow-lg shrink-0`}>
                {icon}
            </div>
            <div className="flex-1">
                <h3 className="font-black text-lg tracking-tighter text-gray-800 uppercase italic leading-none">{title}</h3>
                <p className="text-[10px] font-medium text-gray-400 mt-1.5 leading-tight">{label}</p>
            </div>
            <RiArrowRightSLine className="text-gray-300 group-hover:translate-x-1 transition-transform" size={24} />
        </Link>
    );
}