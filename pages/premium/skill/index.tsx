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
    RiArrowRightUpLine,
    RiArrowLeftSLine // ← 追加
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

                    {/* プレミアムダッシュボードへ戻るボタン */}
                    <button
                        onClick={() => router.push('/premium/dashboard')}
                        className="flex items-center gap-1 text-slate-400 hover:text-slate-900 transition-colors group"
                    >
                        <RiArrowLeftSLine size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Back</span>
                    </button>

                    <div className="text-center">
                        <h1 className="text-xl font-black italic tracking-tighter text-slate-900 uppercase leading-none">那須スキル交換所</h1>
                        <p className="text-[9px] font-bold text-slate-400 tracking-[0.1em] uppercase mt-1">Nasu Skill Exchange</p>
                    </div>

                    <button
                        onClick={() => router.push('/premium/skill/create')}
                        className="bg-slate-900 text-white px-5 py-2.5 rounded-full flex items-center gap-2 shadow-lg active:scale-95 transition-all hover:bg-slate-800"
                    >
                        <RiAddLine size={18} />
                        <span className="text-xs font-black tracking-widest">登録</span>
                    </button>
                </div>
            </header>

            <main className="max-w-2xl mx-auto p-4 space-y-6">
                {/* 投稿一覧の表示ロジック（変更なし） */}
                {loading ? (
                    <div className="py-20 text-center text-slate-400 font-black italic animate-pulse">Loading Skills...</div>
                ) : posts.length === 0 ? (
                    <div className="py-20 text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-100 text-slate-300 font-bold italic">
                        まだ投稿がありません
                    </div>
                ) : (
                    posts.map((post) => (
                        <article key={post.id} className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                            {/* ...（投稿内容のカード部分は以前のまま） */}
                            <div className={`px-6 py-2 flex justify-between items-center ${post.type === 'provide' ? 'bg-blue-600' : 'bg-rose-600'}`}>
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">
                                    {post.type === 'provide' ? 'Skill Provision / 提供' : 'Skill Request / 依頼'}
                                </span>
                                <span className="text-[9px] font-bold text-white/70 flex items-center gap-1">
                                    <RiTimeLine size={12} /> {formatTime(post.createdAt)}
                                </span>
                            </div>
                            <div className="p-6 md:p-8 space-y-6">
                                <h2 className="text-xl md:text-2xl font-black text-slate-800 leading-tight">{post.title}</h2>
                                <p className="text-slate-600 font-bold leading-relaxed whitespace-pre-wrap text-sm">{post.description}</p>
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                        <RiExchangeFundsLine className="text-slate-900" /> Reward
                                    </h4>
                                    <p className="text-base font-black text-slate-900 italic">{post.rewardDetail}</p>
                                </div>
                                <div className="pt-4">
                                    <div className="bg-slate-900 text-white p-5 rounded-[1.5rem] flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-[#06C755] rounded-full flex items-center justify-center">
                                                <RiLineFill size={24} />
                                            </div>
                                            <div>
                                                <span className="text-lg font-black tracking-widest block leading-none">{post.contactInfo}</span>
                                                <span className="text-[9px] font-bold text-white/40">LINE ID</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(post.contactInfo);
                                                alert('IDをコピーしました！');
                                            }}
                                            className="p-2 bg-white/10 rounded-lg"
                                        >
                                            <RiArrowRightUpLine size={20} />
                                        </button>
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