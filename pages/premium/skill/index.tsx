import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { 
    RiExchangeFundsLine, 
    RiMapPinRangeLine, 
    RiInformationLine, 
    RiAddLine, 
    RiTimeLine,
    RiLineFill,
    RiArrowRightUpLine
} from 'react-icons/ri';

// スキル投稿の型定義
interface SkillPost {
    id: string;
    title: string;
    description: string;
    type: 'provide' | 'request';
    rewardDetail: string;
    rewardType: 'cash' | 'barter' | 'both';
    area: string;
    contactInfo: string;
    createdAt: any;
}

export default function SkillIndex() {
    const [posts, setPosts] = useState<SkillPost[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const q = query(collection(db, 'skill_posts'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SkillPost[]);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // 日付表示用の簡易関数
    const formatTime = (timestamp: any) => {
        if (!timestamp) return '';
        try {
            const date = timestamp.toDate();
            const now = new Date();
            const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
            if (diff < 3600) return `${Math.floor(diff / 60)}分前`;
            if (diff < 86400) return `${Math.floor(diff / 3600)}時間前`;
            return new Intl.DateTimeFormat('ja-JP').format(date);
        } catch (e) { return ''; }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-32 font-sans">
            <Head><title>那須スキル交換所 | PREMIUM</title></Head>

            {/* HEADER */}
            <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-6 sticky top-0 z-50">
                <div className="max-w-2xl mx-auto flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-black italic tracking-tighter text-slate-900 uppercase leading-none">那須スキル交換所</h1>
                        <p className="text-[9px] font-bold text-slate-400 tracking-[0.1em] uppercase mt-1">Nasu Skill Exchange</p>
                    </div>
                    <button 
                        onClick={() => router.push('/premium/skill/create')} 
                        className="bg-slate-900 text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-lg active:scale-90 transition-all"
                    >
                        <RiAddLine size={24} />
                    </button>
                </div>
            </header>

            <main className="max-w-2xl mx-auto p-4 space-y-6">
                {loading ? (
                    <div className="py-20 text-center text-slate-400 font-black italic animate-pulse">Loading Skills...</div>
                ) : posts.length === 0 ? (
                    <div className="py-20 text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-100 text-slate-300 font-bold italic">
                        まだ投稿がありません
                    </div>
                ) : (
                    posts.map((post) => (
                        <article key={post.id} className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                            {/* ラベルセクション */}
                            <div className={`px-6 py-2 flex justify-between items-center ${
                                post.type === 'provide' ? 'bg-blue-600' : 'bg-rose-600'
                            }`}>
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">
                                    {post.type === 'provide' ? 'Skill Provision / 提供' : 'Skill Request / 依頼'}
                                </span>
                                <span className="text-[9px] font-bold text-white/70 flex items-center gap-1">
                                    <RiTimeLine size={12} /> {formatTime(post.createdAt)}
                                </span>
                            </div>

                            <div className="p-6 md:p-8 space-y-6">
                                <h2 className="text-xl md:text-2xl font-black text-slate-800 leading-tight">
                                    {post.title}
                                </h2>

                                <div className="space-y-6 text-sm">
                                    <section>
                                        <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2 flex items-center gap-1">
                                            <RiInformationLine /> Description
                                        </h4>
                                        <p className="text-slate-600 font-bold leading-relaxed whitespace-pre-wrap">{post.description}</p>
                                    </section>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                                <RiExchangeFundsLine className="text-slate-900" /> Reward
                                            </h4>
                                            <p className="text-base font-black text-slate-900 italic">{post.rewardDetail}</p>
                                            <div className="mt-1 flex gap-2">
                                                <span className="text-[8px] font-black bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded uppercase">
                                                    {post.rewardType === 'cash' ? '現金' : post.rewardType === 'barter' ? '物々交換' : '現金・交換可'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col justify-center gap-1 px-2">
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <RiMapPinRangeLine size={16} />
                                                <span className="text-[11px] font-black uppercase tracking-wider">{post.area}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* CONTACT SECTION */}
                                <div className="pt-6">
                                    <div className="bg-slate-900 text-white p-5 rounded-[1.5rem] relative overflow-hidden group">
                                        <div className="relative z-10">
                                            <p className="text-[9px] font-black uppercase tracking-[0.2em] mb-3 text-white/50">Contact via LINE</p>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-[#06C755] rounded-full flex items-center justify-center shadow-lg">
                                                        <RiLineFill size={24} />
                                                    </div>
                                                    <div>
                                                        <span className="text-lg font-black tracking-widest block leading-none">{post.contactInfo}</span>
                                                        <span className="text-[9px] font-bold text-white/40">IDをコピーしてLINEで検索</span>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(post.contactInfo);
                                                        alert('IDをコピーしました！');
                                                    }}
                                                    className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                                                >
                                                    <RiArrowRightUpLine size={20} />
                                                </button>
                                            </div>
                                        </div>
                                        {/* 背景の装飾アイコン */}
                                        <RiLineFill className="absolute -right-4 -bottom-4 text-white/5 rotate-12" size={100} />
                                    </div>
                                </div>
                            </div>
                        </article>
                    ))
                )}
            </main>
        </div>
    );
}