import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { db } from '../../../lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { RiHome4Line, RiStore2Line, RiArchiveDrawerLine, RiMapPinUserFill, RiAddCircleFill, RiArrowLeftLine, RiSearchLine } from 'react-icons/ri';

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
        // コレクション名: akiya_posts
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
            <header className="bg-white border-b px-6 py-5 sticky top-0 z-50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/premium')} className="text-gray-400 p-1">
                        <RiArrowLeftLine size={24} />
                    </button>
                    <div>
                        <h1 className="text-lg font-black text-slate-800 tracking-tighter italic">那須あき家速報</h1>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none text-left">Pre-Real Estate Alert</p>
                    </div>
                </div>
                <button onClick={() => router.push('/premium/akiya/create')} className="text-slate-800 active:scale-90 transition-transform">
                    <RiAddCircleFill size={32} />
                </button>
            </header>

            <main className="p-4 max-w-2xl mx-auto space-y-4">
                {loading ? (
                    <div className="py-20 text-center font-black text-slate-300 animate-pulse italic">SEARCHING UNLISTED PROPERTIES...</div>
                ) : posts.length > 0 ? (
                    posts.map((post) => (
                        <div key={post.id} onClick={() => router.push(`/premium/akiya/${post.id}`)} className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-slate-100 active:scale-[0.98] transition-all cursor-pointer">
                            <div className="relative h-44 bg-slate-200">
                                {post.imageUrl ? (
                                    <img src={post.imageUrl} className="w-full h-full object-cover" alt="" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400 font-black italic text-xs tracking-tighter">NO PHOTO AVAILABLE</div>
                                )}
                                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black shadow-sm">
                                    {post.area}
                                </div>
                                <div className="absolute bottom-4 right-4 bg-slate-900 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase">
                                    {post.intent === 'rent' ? '賃貸希望' : post.intent === 'sale' ? '売却希望' : 'まずは相談'}
                                </div>
                            </div>

                            <div className="p-5">
                                <div className="flex items-center gap-2 mb-2 text-slate-400 text-[10px] font-black uppercase">
                                    <span className="p-1 bg-slate-100 rounded text-slate-600">
                                        {TYPE_ICONS[post.type] || <RiHome4Line />}
                                    </span>
                                    {post.type} / {post.condition}
                                </div>
                                <h3 className="text-xl font-black text-slate-800 mb-2 leading-tight">{post.title}</h3>
                                <p className="text-xs text-slate-500 line-clamp-2 font-bold mb-4">{post.description}</p>
                                <div className="flex items-center justify-between border-t pt-4">
                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter italic">Secret Listing #{post.id.substring(0, 5)}</span>
                                    <span className="text-xs font-black text-slate-800 bg-slate-100 px-3 py-1 rounded-lg">詳細を確認</span>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    // ★投稿がゼロの時の空の状態を表示
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