import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { db } from '../../../lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import {
    RiHome4Line,
    RiStore2Line,
    RiArchiveDrawerLine,
    RiMapPinUserFill,
    RiArrowLeftLine,
    RiSearchLine,
    RiAddLine // アイコンをシンプルな「＋」に変更
} from 'react-icons/ri';
import Head from 'next/head';

const TYPE_ICONS: any = {
    house: <RiHome4Line />,
    store: <RiStore2Line />,
    warehouse: <RiArchiveDrawerLine />,
    other: <RiMapPinUserFill />
};

export default function AkiyaIndex() {
    const router = useRouter();
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'akiya_posts'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        }, (error) => {
            console.error("Firestore Error:", error);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 pb-20 font-sans text-left">
            <Head>
                <title>那須あき家速報 | PREMIUM</title>
            </Head>

            {/* HEADER */}
            <header className="bg-white border-b px-6 py-5 sticky top-0 z-50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {/* 戻るボタン：ダッシュボードへ戻る */}
                    <button
                        onClick={() => router.push('/premium/dashboard')}
                        className="text-slate-400 p-1 hover:text-slate-800 transition-colors group"
                    >
                        <RiArrowLeftLine size={24} className="group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <h1 className="text-lg font-black text-slate-800 tracking-tighter italic leading-none">那須あき家速報</h1>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Pre-Real Estate Alert</p>
                    </div>
                </div>

                {/* 「＋」から「登録」ボタンへ変更 */}
                <button
                    onClick={() => router.push('/premium/akiya/create')}
                    className="bg-slate-900 text-white px-5 py-2 rounded-full flex items-center gap-1 shadow-lg active:scale-95 transition-all hover:bg-slate-800"
                >
                    <RiAddLine size={18} />
                    <span className="text-xs font-black tracking-widest">登録</span>
                </button>
            </header>

            <main className="p-4 max-w-2xl mx-auto space-y-4">
                {/* コンセプト */}
                <div className="bg-slate-900 text-white p-6 rounded-[2rem] shadow-lg mb-6 relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-[10px] font-black italic opacity-40 uppercase tracking-[0.2em] mb-2">Unlisted Property Service</p>
                        <p className="text-sm font-bold leading-relaxed">
                            不動産市場に出る前の「先行情報」を共有。<br />
                            空き家を、新たな価値へ。
                        </p>
                    </div>
                    <RiHome4Line className="absolute -bottom-6 -right-6 text-white/5" size={120} />
                </div>

                {loading ? (
                    <div className="py-20 text-center font-black text-slate-300 animate-pulse italic">
                        SEARCHING UNLISTED PROPERTIES...
                    </div>
                ) : posts.length > 0 ? (
                    posts.map((post) => (
                        <div
                            key={post.id}
                            onClick={() => router.push(`/premium/akiya/${post.id}`)}
                            className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-slate-100 active:scale-[0.98] transition-all cursor-pointer group hover:shadow-md"
                        >
                            <div className="relative h-48 bg-slate-200">
                                {post.imageUrl ? (
                                    <img src={post.imageUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt="" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400 font-black italic text-xs tracking-tighter">
                                        NO PHOTO AVAILABLE
                                    </div>
                                )}
                                <div className="absolute top-4 left-4 bg-white/95 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black shadow-sm">
                                    {post.area}
                                </div>
                                <div className="absolute bottom-4 right-4 bg-slate-900/90 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider">
                                    {post.intent === 'rent' ? '賃貸希望' : post.intent === 'sale' ? '売却希望' : 'まずは相談'}
                                </div>
                            </div>

                            <div className="p-5">
                                <div className="flex items-center gap-2 mb-3 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                    <span className="p-1 bg-slate-100 rounded-md text-slate-600">
                                        {TYPE_ICONS[post.type] || <RiHome4Line />}
                                    </span>
                                    {post.type} / {post.condition}
                                </div>
                                <h3 className="text-xl font-black text-slate-800 mb-2 leading-tight tracking-tighter italic">{post.title}</h3>
                                <p className="text-xs text-slate-500 line-clamp-2 font-bold mb-5 leading-relaxed">{post.description}</p>
                                <div className="flex items-center justify-between border-t border-slate-50 pt-4">
                                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter italic">
                                        Secret Listing #{post.id.substring(0, 6)}
                                    </span>
                                    <span className="text-[10px] font-black text-slate-800 bg-slate-50 px-4 py-2 rounded-full group-hover:bg-slate-900 group-hover:text-white transition-all uppercase tracking-widest">
                                        View Detail
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="py-24 px-6 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
                        <RiSearchLine className="mx-auto text-slate-200 mb-4" size={48} />
                        <p className="text-slate-400 font-black">現在、公開可能な物件情報はありません</p>
                        <p className="text-[10px] text-slate-300 font-bold mt-2 uppercase tracking-[0.2em]">Stay tuned for unlisted updates</p>
                    </div>
                )}
            </main>
        </div>
    );
}