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
    RiInformationLine,
    RiHandHeartLine,
    RiInboxLine
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

            {/* HEADER - 右上の＋ボタンを削除しスッキリさせました */}
            <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50 px-6 py-4">
                <div className="max-w-xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.push('/premium/dashboard')} className="w-10 h-10 flex items-center justify-center bg-white border border-gray-100 rounded-full shadow-sm hover:bg-gray-50 transition-all active:scale-90">
                            <RiArrowLeftLine size={20} />
                        </button>
                        <div>
                            <span className="text-[9px] font-black text-pink-500 uppercase tracking-widest block leading-none mb-1">Nasu Sharing</span>
                            <h1 className="text-sm font-black tracking-tighter uppercase italic text-gray-800">那須レンタル</h1>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-xl mx-auto px-6 pt-6 animate-in fade-in duration-700 text-left">

                {/* HERO CARD */}
                <section className="bg-gray-900 rounded-[2.5rem] p-8 text-white mb-8 shadow-xl relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3 opacity-60">
                            <RiHandHeartLine size={18} />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Community Sharing</span>
                        </div>
                        <h2 className="text-2xl font-black leading-tight tracking-tight text-left">
                            那須の仲間と、<br />賢くシェア。
                        </h2>
                        <p className="text-[10px] mt-4 font-bold text-pink-400 uppercase tracking-widest text-left">Premium Members Only Service</p>
                    </div>
                    <RiHandHeartLine size={140} className="absolute -right-6 -bottom-6 text-white/5 rotate-12" />
                </section>

                {/* CATEGORY FILTER */}
                <section className="flex gap-2 overflow-x-auto pb-8 no-scrollbar scroll-smooth">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setCategory(cat)}
                            className={`px-6 py-3 rounded-2xl text-[11px] font-black whitespace-nowrap transition-all uppercase tracking-wider ${category === cat
                                ? 'bg-pink-500 text-white shadow-lg shadow-pink-100 scale-105'
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
                            <Link key={item.id} href={`/premium/rental/${item.id}`} className="group bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-100 flex flex-col active:scale-[0.97] transition-all hover:shadow-md text-left">
                                <div className="aspect-square bg-gray-100 relative overflow-hidden">
                                    <img
                                        src={item.imageUrl || 'https://via.placeholder.com/400x400?text=No+Photo'}
                                        alt={item.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute top-3 left-3">
                                        <span className="bg-white/90 backdrop-blur-md text-[8px] font-black px-2.5 py-1 rounded-full shadow-sm uppercase tracking-tighter text-gray-600">
                                            {item.category}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-5 flex-1 flex flex-col justify-between">
                                    <h3 className="font-black text-sm text-gray-800 line-clamp-2 tracking-tight leading-snug mb-3 text-left">{item.title}</h3>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-1.5 text-gray-900">
                                            <RiPriceTag3Line size={14} className="text-pink-500" />
                                            <p className="text-[13px] font-black text-left">
                                                {item.price === 0 ? '無料' : `¥${item.price.toLocaleString()}`}
                                                <span className="text-[9px] text-gray-400 font-bold uppercase ml-1">/ {item.unit}</span>
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-gray-400">
                                            <RiMapPin2Line size={13} />
                                            <p className="text-[9px] font-black truncate uppercase tracking-tighter text-left">{item.location}</p>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div className="col-span-2 py-24 text-center bg-gray-50/50 rounded-[3rem] border border-dashed border-gray-200">
                            <RiInboxLine size={40} className="text-gray-200 mx-auto mb-4" />
                            <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">現在、アイテムはありません</p>
                        </div>
                    )}
                </section>

                {/* INFO FOOTER */}
                <div className="mt-12 p-6 bg-pink-50/30 rounded-[2rem] border border-pink-100/50 flex items-start gap-4 mb-20">
                    <RiInformationLine className="text-pink-400 shrink-0" size={20} />
                    <p className="text-[10px] font-bold text-pink-700/60 leading-relaxed italic text-left">
                        那須レンタルはプレミアム会員限定のシェアリングサービスです。
                        対面での受け渡しが基本となります。ルールを守って活用しましょう。
                    </p>
                </div>
            </main>

            {/* 「＋」から「登録」に変更したフローティングボタン */}
            <div className="fixed bottom-8 left-0 right-0 flex justify-center z-[100] px-6 pointer-events-none">
                <button
                    onClick={() => router.push('/premium/rental/create')}
                    className="pointer-events-auto flex items-center gap-2 px-8 py-4 bg-gray-900 text-white rounded-full shadow-[0_20px_40px_rgba(0,0,0,0.2)] active:scale-95 transition-all border border-gray-800"
                >
                    <RiAddLine size={24} />
                    <span className="font-black tracking-[0.2em] text-sm">登録</span>
                </button>
            </div>
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
        const items = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.seconds ? doc.data().createdAt.seconds * 1000 : Date.now()
        }));

        return { props: { items: JSON.parse(JSON.stringify(items)) } };
    } catch (err) {
        return { props: { items: [] } };
    }
};

export default RentalPage;