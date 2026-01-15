import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { app, db } from '../../lib/firebase';
import { doc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';
import {
    RiBankCardFill, RiShieldCheckFill, RiHistoryFill,
    RiShoppingBagFill, RiAddCircleFill, RiSettings4Fill, RiLogoutBoxRLine,
    RiPlantFill, RiFlashlightFill, RiHandHeartFill, RiExchangeBoxFill,
    RiArrowRightSLine, RiGiftFill, RiHeartFill
} from 'react-icons/ri';
import Link from 'next/link';

export default function PremiumDashboard() {
    const router = useRouter();
    const auth = getAuth(app);
    const [stripeId, setStripeId] = useState<string | null>(null);
    const [user, setUser] = useState<any>(null);
    const [myItems, setMyItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (u) => {
            if (u) {
                setUser(u);
                // Stripe連携状態の監視
                onSnapshot(doc(db, 'users', u.uid), (s) => {
                    setStripeId(s.data()?.stripeConnectId || null);
                });

                // 自分の出品データの取得
                const q = query(collection(db, 'items'), where('sellerId', '==', u.uid));
                const querySnapshot = await getDocs(q);
                setMyItems(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

                setLoading(false);
            } else {
                router.push('/users/login');
            }
        });
        return () => unsubscribe();
    }, [auth, router]);

    const handleStripeLink = async () => {
        const res = await fetch('/api/stripe/connect');
        const data = await res.json();
        if (data.url) window.location.href = data.url;
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#F4F7F6]">
            <div className="animate-pulse font-black text-emerald-600">プレミアムサービスを起動中...</div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F4F7F6] pb-20 font-sans">
            {/* ヘッダー */}
            <header className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
                <div className="flex items-center gap-2">
                    <RiShieldCheckFill className="text-emerald-500" size={24} />
                    <h1 className="text-xl font-black italic text-emerald-600">PREMIUM CONSOLE</h1>
                </div>
                <div className="flex gap-4">
                    <button onClick={() => router.push('/premium/upload')} className="text-emerald-500"><RiAddCircleFill size={28} /></button>
                    <button onClick={() => auth.signOut()} className="text-gray-400 hover:text-red-500 transition-colors"><RiLogoutBoxRLine size={24} /></button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto p-6">

                {/* 1. Stripe決済・収益管理アプリ */}
                <section className="bg-gray-900 rounded-[32px] p-8 text-white shadow-xl mb-10 relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <p className="text-emerald-400 text-[10px] font-bold mb-1 tracking-widest uppercase">My Earnings (Net)</p>
                                <h2 className="text-5xl font-black tracking-tighter italic">¥0</h2>
                            </div>
                            <div className={`p-3 rounded-2xl ${stripeId ? 'bg-emerald-500/20 text-emerald-500' : 'bg-white/10 text-white/20'}`}>
                                <RiBankCardFill size={32} />
                            </div>
                        </div>
                        <button
                            onClick={handleStripeLink}
                            className={`w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${stripeId ? 'bg-white text-gray-900 hover:bg-gray-100' : 'bg-emerald-500 text-white hover:bg-emerald-400'
                                }`}
                        >
                            <RiBankCardFill size={20} />
                            {stripeId ? 'Stripe売上管理・口座設定' : '振込先口座を連携する'}
                        </button>
                    </div>
                </section>

                {/* 2. お友達紹介アプリ */}
                <section className="mb-10">
                    <Link href="/premium/referral" className="group block relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-px shadow-xl active:scale-[0.98] transition-all">
                        <div className="bg-white/10 backdrop-blur-sm p-6 rounded-[2.4rem] flex items-center justify-between">
                            <div className="flex items-center gap-4 text-white">
                                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-lg group-hover:rotate-12 transition-transform">
                                    <RiGiftFill size={32} />
                                </div>
                                <div>
                                    <h3 className="font-black text-lg leading-tight italic text-white">お友達紹介プログラム</h3>
                                    <p className="text-indigo-100 text-[9px] font-bold mt-1 tracking-widest uppercase">Referral Rewards System</p>
                                </div>
                            </div>
                            <RiArrowRightSLine className="text-white opacity-50" size={24} />
                        </div>
                    </Link>
                </section>

                {/* 3. プレミアム専用サービス群（あなたが作ったアプリ全部） */}
                <section className="mb-12">
                    <h3 className="font-black text-gray-800 text-sm mb-6 px-2 tracking-widest uppercase text-gray-400 flex items-center gap-2">
                        <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
                        Premium Services
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                        <MenuButton
                            href="/premium/osuso"
                            icon={<RiPlantFill size={28} />}
                            title="おすそわけ畑"
                            label="Farm to Table Sharing"
                            color="from-emerald-500 to-green-600"
                        />
                        <MenuButton
                            href="/premium/half-price/create"
                            icon={<RiFlashlightFill size={28} />}
                            title="爆安セール速報"
                            label="Post Sale Alert (Direct)"
                            color="from-orange-500 to-red-500"
                        />
                        <MenuButton
                            href="/premium/flea-market"
                            icon={<RiShoppingBagFill size={28} />}
                            title="Nasuフリマ"
                            label="Local Marketplace"
                            color="from-pink-500 to-rose-500"
                        />
                        <MenuButton
                            href="/premium/helper"
                            icon={<RiHandHeartFill size={28} />}
                            title="ちょい手伝い"
                            label="Quick Help & Support"
                            color="from-teal-500 to-cyan-500"
                        />
                        <MenuButton
                            href="/premium/rental"
                            icon={<RiExchangeBoxFill size={28} />}
                            title="使ってない貸します"
                            label="Item & Space Share"
                            color="from-blue-500 to-indigo-500"
                        />
                    </div>
                </section>

                {/* 4. アプリ管理・履歴 */}
                <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => router.push('/premium/history')} className="bg-white p-6 rounded-[2rem] shadow-sm text-left group border border-gray-50 hover:border-emerald-200 transition-all">
                        <RiHistoryFill className="text-gray-300 group-hover:text-emerald-500 mb-2 transition-colors" size={24} />
                        <p className="font-black text-[11px] text-gray-500 tracking-widest uppercase">Sales History</p>
                        <p className="font-black text-gray-800">販売履歴</p>
                    </button>
                    <button onClick={() => router.push('/premium/settings')} className="bg-white p-6 rounded-[2rem] shadow-sm text-left group border border-gray-50 hover:border-emerald-200 transition-all">
                        <RiSettings4Fill className="text-gray-300 group-hover:text-emerald-500 mb-2 transition-colors" size={24} />
                        <p className="font-black text-[11px] text-gray-500 tracking-widest uppercase">Shop Config</p>
                        <p className="font-black text-gray-800">店舗設定</p>
                    </button>
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
                <p className="text-[9px] font-bold text-gray-400 mt-0.5 uppercase tracking-widest italic">{label}</p>
            </div>
            <RiArrowRightSLine className="text-gray-300 group-hover:translate-x-1 transition-transform" size={24} />
        </Link>
    );
}
