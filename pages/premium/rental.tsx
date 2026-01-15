import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import nookies from 'nookies';
import {
    RiArrowLeftLine,
    RiAddLine,
    RiMapPin2Line,
    RiPriceTag3Line,
    RiFilter3Line,
    RiInformationLine,
    RiHandHeartLine
} from 'react-icons/ri';

interface RentalItem {
    id: string;
    title: string;
    description: string;
    price: number;
    unit: string;
    location: string;
    category: string;
    imageUrl: string;
    createdAt: number;
}

interface RentalProps {
    items: RentalItem[];
}

const RentalPage: NextPage<RentalProps> = ({ items }) => {
    const router = useRouter();
    const [category, setCategory] = useState('すべて');

    const categories = ['すべて', 'ツール', 'キャンプ', 'キッチン', 'スペース', 'その他'];
    const filteredItems = category === 'すべて' ? items : items.filter(item => item.category === category);

    return (
        <div className="min-h-screen bg-[#FDFCFD] pb-32 font-sans text-gray-900">
            <Head><title>那須レンタル | PREMIUM</title></Head>

            {/* HEADER */}
            <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50 px-6 py-4">
                <div className="max-w-xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.push('/premium/dashboard')} className="p-2 hover:bg-gray-100 rounded-full transition-all active:scale-90">
                            <RiArrowLeftLine size={24} />
                        </button>
                        <h1 className="text-xl font-black tracking-tighter uppercase italic">Rental</h1>
                    </div>
                    <Link href="/premium/rental/create" className="bg-gray-900 text-white w-10 h-10 flex items-center justify-center rounded-xl shadow-lg active:scale-90 transition-all">
                        <RiAddLine size={24} />
                    </Link>
                </div>
            </header>

            <main className="max-w-xl mx-auto px-6 pt-6">

                {/* HERO CARD */}
                <section className="bg-gradient-to-br from-gray-900 to-gray-700 rounded-[2.5rem] p-8 text-white mb-10 shadow-xl relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3 opacity-60">
                            <RiHandHeartLine size={18} />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Community Sharing</span>
                        </div>
                        <h2 className="text-2xl font-black leading-tight tracking-tight">
                            那須の仲間と、<br />賢くシェア。
                        </h2>
                        <p className="text-[10px] mt-4 font-bold opacity-50 uppercase tracking-widest">Premium Members Only Service</p>
                    </div>
                    <RiHandHeartLine size={120} className="absolute -right-4 -bottom-4 text-white/5 rotate-12" />
                </section>

                {/* CATEGORY FILTER */}
                <section className="flex gap-2 overflow-x-auto pb-6 no-scrollbar">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setCategory(cat)}
                            className={`px-6 py-3 rounded-2xl text-[11px] font-black whitespace-nowrap transition-all uppercase tracking-wider ${category === cat
                                    ? 'bg-pink-500 text-white shadow-lg shadow-pink-100'
                                    : 'bg-white text-gray-400 border border-gray-100 hover:border-gray-200'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </section>

                {/* ITEM GRID */}
                <section className="grid grid-cols-2 gap-4">
                    {filteredItems.length > 0 ? (
                        filteredItems.map((item) => (
                            <Link key={item.id} href={`/premium/rental/${item.id}`} className="group bg-white rounded-[2rem] overflow-hidden shadow-sm border border-gray-100 flex flex-col active:scale-[0.97] transition-all">
                                <div className="aspect-[1/1] bg-gray-100 relative overflow-hidden">
                                    <img
                                        src={item.imageUrl || 'https://via.placeholder.com/400x400?text=No+Photo'}
                                        alt={item.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute top-3 left-3">
                                        <span className="bg-white/90 backdrop-blur-md text-[9px] font-black px-2.5 py-1 rounded-lg shadow-sm uppercase tracking-tighter">
                                            {item.category}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-5 flex-1">
                                    <h3 className="font-black text-sm text-gray-800 line-clamp-1 tracking-tight">{item.title}</h3>
                                    <div className="mt-3 space-y-1.5">
                                        <div className="flex items-center gap-1.5 text-gray-900">
                                            <RiPriceTag3Line size={13} className="text-pink-500" />
                                            <p className="text-[13px] font-black">
                                                ¥{item.price.toLocaleString()} <span className="text-[9px] text-gray-400 font-bold uppercase">/ {item.unit}</span>
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-gray-400">
                                            <RiMapPin2Line size={13} />
                                            <p className="text-[10px] font-black truncate uppercase tracking-tighter">{item.location}</p>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div className="col-span-2 py-32 text-center">
                            <RiFilter3Line size={40} className="text-gray-100 mx-auto mb-4" />
                            <p className="text-gray-300 text-[10px] font-black uppercase tracking-[0.3em]">No items available</p>
                        </div>
                    )}
                </section>
            </main>
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
        const userData = userDoc.data() || {};

        const isAllowed = userData.isPaid === true || userData.subscriptionStatus === 'active';
        if (!isAllowed) return { redirect: { destination: '/home', permanent: false } };

        const snapshot = await adminDb.collection('rentals').orderBy('createdAt', 'desc').limit(50).get();
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        return { props: { items: JSON.parse(JSON.stringify(items)) } };
    } catch (err) {
        return { props: { items: [] } };
    }
};

export default RentalPage;