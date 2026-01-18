import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import {
    RiPlantLine,
    RiAddLine,
    RiMapPin2Fill,
    RiShieldCheckFill,
    RiCloseLine,
    RiArrowLeftSLine,
    RiUser6Fill,
    RiLineLine,
    RiInformationLine,
    RiHeartFill
} from 'react-icons/ri';
import Link from 'next/link';
import Head from 'next/head';
import { useRouter } from 'next/router';

interface OsusoPost {
    id: string;
    uid: string;
    nickname: string;
    comment: string;
    imageUrl: string;
    area: string;
    method: string;
    userType: string;
    isVerified: boolean;
    useCount: number;
    lineId: string;
    createdAt: any;
}

export default function OsusoPage() {
    const router = useRouter();
    const [posts, setPosts] = useState<OsusoPost[]>([]);
    const [selectedPost, setSelectedPost] = useState<OsusoPost | null>(null);

    useEffect(() => {
        const q = query(collection(db, "osuso_posts"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const postData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as OsusoPost[];
            setPosts(postData);
        });

        return () => unsubscribe();
    }, []);

    // モーダル表示時にスクロールを止める
    useEffect(() => {
        if (selectedPost) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [selectedPost]);

    return (
        <div className="min-h-screen bg-[#FDFCFD] pb-32 font-sans text-[#4A3B3B]">
            <Head><title>みんなのNasu おすそわけ畑 | Nasuプレミアム</title></Head>

            {/* Header */}
            <header className="bg-white/80 backdrop-blur-xl border-b border-[#E8E2D9] px-6 py-4 sticky top-0 z-50">
                <div className="max-w-xl mx-auto flex items-center justify-between">
                    <button 
                        onClick={() => router.push('/premium/dashboard')} 
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-[#FDFCFD] border border-[#E8E2D9] text-[#A89F94] active:scale-90 transition-all"
                    >
                        <RiArrowLeftSLine size={24} />
                    </button>
                    <div className="text-center">
                        <span className="text-[10px] tracking-[0.2em] uppercase text-emerald-500 block font-black">Nasu Osusowake</span>
                        <h1 className="text-sm font-black italic text-emerald-600">おすそわけ畑</h1>
                    </div>
                    <Link href="/premium/osuso/post" className="text-emerald-500 bg-emerald-50 p-2 rounded-full active:scale-95 transition-all">
                        <RiAddLine size={24} />
                    </Link>
                </div>
            </header>

            <main className="max-w-xl mx-auto p-6 animate-in fade-in duration-700">
                {/* Concept Banner */}
                <div className="mb-8 p-8 bg-emerald-500 rounded-[3rem] text-white overflow-hidden relative shadow-xl shadow-emerald-100/50">
                    <div className="absolute top-0 right-0 p-6 opacity-20 rotate-12">
                        <RiPlantLine size={120} />
                    </div>
                    <div className="relative z-10 space-y-4">
                        <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20">
                            <RiHeartFill className="text-rose-300" />
                            <span className="text-[10px] font-black italic tracking-wider">出逢いだけ、つなぎます。</span>
                        </div>
                        <div className="space-y-1 text-left">
                            <h2 className="text-2xl font-black italic leading-tight">那須の畑と、<br />台所をつなぐ。</h2>
                            <p className="text-xs font-bold opacity-90 leading-relaxed">
                                余った野菜、とれすぎた果物。<br />
                                捨てる前に、那須の誰かの台所へ届ける場所。
                            </p>
                        </div>
                    </div>
                </div>

                {/* Important Rule Notice */}
                <div className="mb-8 p-6 bg-white border border-[#E8E2D9] rounded-[2.5rem] shadow-sm text-center">
                    <p className="text-[11px] font-black text-[#8C8479] leading-relaxed italic">
                        「やり取り・お礼・金額などは当事者同士で自由に」<br />
                        <span className="text-[9px] opacity-60 mt-1 block font-bold">※運営は内容やトラブルに一切関与いたしません。</span>
                    </p>
                </div>

                {/* List of Posts */}
                <div className="grid grid-cols-1 gap-10">
                    {posts.map(post => (
                        <div
                            key={post.id}
                            onClick={() => setSelectedPost(post)}
                            className="bg-white rounded-[3.5rem] overflow-hidden border border-[#F3F0EC] shadow-sm active:scale-[0.98] transition-all group flex flex-col"
                        >
                            <div className="aspect-[16/11] bg-[#F3F0EC] relative overflow-hidden">
                                <img 
                                    src={post.imageUrl || '/images/placeholder-osuso.jpg'} 
                                    alt="おすそわけ" 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                                />
                                <div className="absolute top-4 left-4">
                                    <span className="bg-emerald-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black shadow-lg">
                                        {post.userType}
                                    </span>
                                </div>
                            </div>
                            <div className="p-8 space-y-6 text-left">
                                <h3 className="text-xl font-black text-[#4A3B3B] line-clamp-2 leading-snug">
                                    {post.comment}
                                </h3>

                                <div className="flex items-center justify-between border-t border-[#FDFCFD] pt-5">
                                    <div className="flex items-center gap-2">
                                        <RiMapPin2Fill className="text-[#D1C9BF]" size={16} />
                                        <span className="text-xs font-bold text-[#8C8479]">{post.area}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <p className="text-xs font-black text-[#4A3B3B] italic leading-none">{post.nickname}</p>
                                            <p className="text-[9px] font-black text-emerald-500 mt-1.5 bg-emerald-50 px-2 py-0.5 rounded-full">実績 {post.useCount || 0}回</p>
                                        </div>
                                        <div className="w-10 h-10 bg-[#FDFCFD] rounded-full flex items-center justify-center text-emerald-400 border border-emerald-50 shadow-inner">
                                            <RiUser6Fill size={20} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {posts.length === 0 && (
                    <div className="text-center py-24 bg-emerald-50/20 rounded-[4rem] border border-dashed border-emerald-100 italic font-bold text-[#D1C9BF]">
                        現在、おすそわけの投稿はありません
                    </div>
                )}
            </main>

            {/* Detail View Modal */}
            {selectedPost && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#4A3B3B]/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-[4rem] shadow-2xl relative animate-in zoom-in slide-in-from-bottom-10 duration-500">
                        <button 
                            onClick={() => setSelectedPost(null)} 
                            className="absolute top-6 right-6 w-10 h-10 bg-white/90 backdrop-blur-md text-[#A89F94] rounded-full shadow-lg flex items-center justify-center active:scale-90 transition-all z-10"
                        >
                            <RiCloseLine size={24} />
                        </button>

                        <div className="aspect-square md:aspect-[16/10] bg-[#F3F0EC]">
                            <img src={selectedPost.imageUrl} alt="詳細写真" className="w-full h-full object-cover" />
                        </div>

                        <div className="p-8 md:p-12 space-y-10 text-left">
                            <div className="space-y-4">
                                <div className="flex gap-2">
                                    <span className="bg-emerald-500 px-4 py-1.5 rounded-full text-[10px] font-black text-white shadow-md uppercase tracking-widest">
                                        {selectedPost.userType}
                                    </span>
                                    <span className="bg-[#FDFCFD] border border-[#E8E2D9] px-4 py-1.5 rounded-full text-[10px] font-black text-[#A89F94] tracking-widest uppercase">
                                        {selectedPost.area}
                                    </span>
                                </div>
                                <h2 className="text-2xl md:text-3xl font-black tracking-tighter leading-tight text-[#4A3B3B]">
                                    {selectedPost.comment}
                                </h2>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-[#A89F94] uppercase tracking-[0.2em] block italic">受け渡し方法</label>
                                <div className="bg-[#FDFCFD] p-8 rounded-[2.5rem] border border-[#E8E2D9] relative overflow-hidden">
                                    <RiMapPin2Fill className="absolute -top-2 -right-2 text-emerald-50/50" size={100} />
                                    <p className="text-sm font-bold text-[#8C8479] leading-relaxed relative z-10 whitespace-pre-wrap">{selectedPost.method}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-5 bg-white p-6 rounded-[3rem] border border-[#F3F0EC] shadow-sm">
                                <div className="w-16 h-16 bg-[#FDFCFD] rounded-full flex items-center justify-center text-emerald-400 border border-emerald-50 relative shadow-inner">
                                    <RiUser6Fill size={32} />
                                    {selectedPost.isVerified && (
                                        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                                            <RiShieldCheckFill className="text-blue-500" size={24} />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p className="text-base font-black text-[#4A3B3B]">{selectedPost.nickname}</p>
                                    <p className="text-[10px] font-black text-[#A89F94] mt-1 flex items-center gap-2">
                                        <span>那須おすそわけ実績</span>
                                        <span className="text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">{selectedPost.useCount || 0}回</span>
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-6 pt-4">
                                <button
                                    onClick={() => window.open(`https://line.me/ti/p/~${selectedPost.lineId}`, '_blank')}
                                    className="w-full py-6 bg-[#06C755] text-white rounded-full font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-emerald-100 active:scale-[0.98] transition-all"
                                >
                                    <RiLineLine size={26} /> LINEで相談してみる
                                </button>

                                <div className="p-8 bg-rose-50/50 rounded-[2.5rem] border border-rose-100 space-y-3">
                                    <div className="flex items-center gap-2 text-rose-500">
                                        <RiInformationLine size={18} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">おすそわけの基本ルール</span>
                                    </div>
                                    <ul className="text-[10px] font-bold text-rose-700/60 leading-relaxed italic space-y-1 list-disc pl-4">
                                        <li>お礼や金額の有無は、LINEで直接話し合ってください。</li>
                                        <li>受け渡しの場所は、人目の多い公共の場をお勧めします。</li>
                                        <li>運営は、マッチング後のやり取りに一切責任を負いません。</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}