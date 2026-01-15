import React, { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import {
    RiHandHeartFill,
    RiAddLine,
    RiMapPin2Fill,
    RiShieldCheckFill,
    RiVipCrownFill,
    RiCloseLine,
    RiArrowLeftSLine,
    RiCheckboxCircleFill,
    RiSearch2Fill,
    RiInformationLine,
    RiTimeLine,
    RiMoneyDollarCircleLine,
    RiChat3Line,
    RiUser6Fill,
    RiLineLine,
    RiHandHeartLine,
    RiArrowRightSLine
} from 'react-icons/ri';
import Link from 'next/link';
import Head from 'next/head';

interface HelperPost {
    id: string;
    uid: string;
    userName: string;
    userUsageCount: number;
    isVerified: boolean;
    title: string;
    content: string;
    category: string;
    area: string;
    date: string;
    duration: string;
    reward: string;
    lineId: string;
    status: 'active' | 'completed';
    createdAt: any;
}

export default function HelperLandingPage() {
    const [view, setView] = useState<'top' | 'list'>('top');
    const [posts, setPosts] = useState<HelperPost[]>([]);
    const [selectedPost, setSelectedPost] = useState<HelperPost | null>(null);
    const [isPaidUser, setIsPaidUser] = useState(false);

    useEffect(() => {
        const checkUser = async () => {
            const user = auth.currentUser;
            if (user) {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                const data = userDoc.data();
                setIsPaidUser(data?.isPaid === true || data?.subscriptionStatus === 'active');
            }
        };
        checkUser();

        const q = query(collection(db, "helper_posts"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const postData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as HelperPost[];
            setPosts(postData);
        });

        return () => unsubscribe();
    }, []);

    const handleComplete = async (postId: string) => {
        if (!confirm("手伝いが完了しましたか？依頼者の利用実績が+1されます。")) return;
        try {
            const postRef = doc(db, "helper_posts", postId);
            const postSnap = await getDoc(postRef);
            if (postSnap.exists()) {
                const uid = postSnap.data().uid;
                await updateDoc(doc(db, "users", uid), {
                    usageCount: increment(1)
                });
                await updateDoc(postRef, { status: 'completed' });
                alert("完了報告ありがとうございます！");
                setSelectedPost(null);
            }
        } catch (error) {
            console.error(error);
        }
    };

    if (view === 'top') {
        return (
            <div className="min-h-screen bg-[#FDFCFD] font-sans text-[#4A3B3B] pb-20">
                <Head><title>みんなのNasu ちょい手伝い | Nasuプレミアム</title></Head>

                <header className="px-6 py-12 text-center space-y-4">
                    <div className="inline-flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 mb-2">
                        <RiHandHeartFill className="text-emerald-500" />
                        <span className="text-[11px] font-black text-emerald-600 italic">Nasu Premium Helper</span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter italic">
                        みんなのNasu<br />
                        <span className="text-emerald-500">ちょい手伝い</span>
                    </h1>
                    <p className="text-xs font-bold text-[#A89F94] leading-relaxed">
                        近所でちょっと、助け合い。<br />
                        「誰かに頼みたい」と「手伝える」を繋ぐ。
                    </p>
                </header>

                <div className="px-6 space-y-6 max-w-xl mx-auto">
                    <Link href="/premium/helper/create">
                        <button className="w-full bg-white p-8 rounded-[3rem] shadow-xl shadow-emerald-100 border border-emerald-50 flex items-center justify-between group active:scale-[0.98] transition-all">
                            <div className="text-left">
                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] block mb-1">I need help</span>
                                <span className="text-2xl font-black">手伝ってほしい</span>
                            </div>
                            <div className="w-16 h-16 bg-emerald-500 rounded-[2rem] flex items-center justify-center text-white shadow-lg group-hover:rotate-12 transition-transform">
                                <RiAddLine size={32} />
                            </div>
                        </button>
                    </Link>

                    <button onClick={() => setView('list')} className="w-full bg-[#4A3B3B] p-8 rounded-[3rem] shadow-xl shadow-gray-200 border border-gray-700 flex items-center justify-between group active:scale-[0.98] transition-all text-white">
                        <div className="text-left">
                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] block mb-1">I can help</span>
                            <span className="text-2xl font-black">手伝えます</span>
                        </div>
                        <div className="w-16 h-16 bg-emerald-400/20 rounded-[2rem] flex items-center justify-center text-emerald-400 border border-emerald-400/30 group-hover:-rotate-12 transition-transform">
                            <RiHandHeartLine size={32} />
                        </div>
                    </button>

                    <div className="bg-emerald-50/50 p-8 rounded-[2.5rem] border border-emerald-100 text-center space-y-4">
                        <RiInformationLine className="mx-auto text-emerald-400" size={32} />
                        <p className="text-[11px] font-bold text-emerald-700/60 leading-relaxed italic">
                            これはバイトや派遣ではありません。<br />
                            「那須の掲示板 × ちょっとした頼みごと」<br />
                            それだけの、ご近所の助け合いです。
                        </p>
                    </div>

                    <div className="pt-10 space-y-6">
                        <h3 className="text-center text-[10px] font-black text-[#D1C9BF] uppercase tracking-[0.4em]">Trust & Safety</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <TrustBadge icon={<RiShieldCheckFill />} label="本人確認済" />
                            <TrustBadge icon={<RiVipCrownFill />} label="有料会員限定" />
                            <TrustBadge icon={<RiCheckboxCircleFill />} label="実績表示" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFCFD] pb-32 font-sans text-[#4A3B3B]">
            <Head><title>お手伝い募集一覧 | みんなのNasu ちょい手伝い</title></Head>

            <header className="bg-white/80 backdrop-blur-xl border-b border-[#E8E2D9] px-6 py-4 sticky top-0 z-50">
                <div className="max-w-xl mx-auto flex items-center justify-between">
                    <button onClick={() => setView('top')} className="w-10 h-10 flex items-center justify-center rounded-full bg-[#FDFCFD] border border-[#E8E2D9] text-[#A89F94] active:scale-90 transition-all">
                        <RiArrowLeftSLine size={24} />
                    </button>
                    <div className="text-center">
                        <span className="text-[10px] tracking-[0.2em] uppercase text-emerald-500 block font-bold">Helper List</span>
                        <h1 className="text-sm font-black italic text-emerald-600">手伝い募集一覧</h1>
                    </div>
                    <Link href="/premium/helper/create" className="text-emerald-500 bg-emerald-50 p-2 rounded-full active:scale-95 transition-all">
                        <RiAddLine size={24} />
                    </Link>
                </div>
            </header>

            <div className="max-w-xl mx-auto p-6 space-y-5 animate-in fade-in duration-700">
                {posts.filter(p => p.status === 'active').map(post => (
                    <div
                        key={post.id}
                        onClick={() => setSelectedPost(post)}
                        className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-[#F3F0EC] active:scale-[0.98] transition group flex flex-col gap-4"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                                <span className="text-[9px] font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                    {post.category.split(' > ')[1]}
                                </span>
                                <h3 className="text-base font-black text-[#4A3B3B] leading-tight line-clamp-2">{post.title}</h3>
                            </div>
                            <div className="text-right shrink-0">
                                <p className="text-emerald-600 font-black text-lg leading-none">{post.reward}</p>
                                <span className="text-[9px] font-bold text-[#A89F94]">{post.duration}</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-[#FDFCFD] pt-3">
                            <div className="flex items-center gap-2">
                                <RiMapPin2Fill className="text-[#D1C9BF]" size={14} />
                                <span className="text-[10px] font-bold text-[#8C8479]">{post.area}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-[#4A3B3B] italic">{post.userName}</span>
                                <span className="text-[9px] font-black text-emerald-500 bg-emerald-50 px-2 rounded-full">
                                    実績{post.userUsageCount}回
                                </span>
                            </div>
                        </div>
                    </div>
                ))}

                {posts.filter(p => p.status === 'active').length === 0 && (
                    <div className="text-center py-20 bg-emerald-50/20 rounded-[3rem] border border-dashed border-emerald-100 italic font-bold text-[#D1C9BF]">
                        現在、募集中の手伝い事はありません
                    </div>
                )}
            </div>

            {selectedPost && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#4A3B3B]/40 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-[3.5rem] shadow-2xl relative animate-in zoom-in slide-in-from-bottom-10 duration-500">
                        <button onClick={() => setSelectedPost(null)} className="absolute top-6 right-6 w-12 h-12 bg-[#F3F0EC] text-[#A89F94] rounded-full flex items-center justify-center active:scale-90 transition-all z-10">
                            <RiCloseLine size={28} />
                        </button>

                        <div className="p-10 space-y-10">
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest">{selectedPost.category}</span>
                                    <span className="text-[10px] font-black text-[#A89F94] border border-[#E8E2D9] px-2 py-0.5 rounded-md">{selectedPost.area}</span>
                                </div>
                                <h2 className="text-3xl font-black tracking-tighter leading-tight text-[#4A3B3B]">{selectedPost.title}</h2>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <DetailCard icon={<RiTimeLine />} label="日時・目安時間" value={`${selectedPost.date}（${selectedPost.duration}）`} />
                                <DetailCard icon={<RiMoneyDollarCircleLine />} label="謝礼" value={selectedPost.reward} color="emerald" />
                            </div>

                            <div className="space-y-4">
                                <span className="text-xs font-black text-[#A89F94] uppercase tracking-widest italic block">依頼内容</span>
                                <div className="bg-[#FDFCFD] p-8 rounded-[2rem] border border-[#E8E2D9] relative">
                                    <RiChat3Line className="absolute top-4 right-4 text-emerald-100" size={40} />
                                    <p className="text-sm font-bold text-[#8C8479] leading-relaxed whitespace-pre-wrap relative z-10">{selectedPost.content}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-5 bg-white p-6 rounded-[2.5rem] border border-[#F3F0EC]">
                                <div className="w-16 h-16 bg-[#FDFCFD] rounded-full flex items-center justify-center text-emerald-400 border border-emerald-50">
                                    <RiUser6Fill size={32} />
                                </div>
                                <div>
                                    <p className="text-base font-black text-[#4A3B3B]">{selectedPost.userName}</p>
                                    <p className="text-[10px] font-black text-[#A89F94] flex items-center gap-2 mt-0.5">
                                        <span className="text-emerald-500 font-black flex items-center gap-0.5"><RiShieldCheckFill /> 本人確認済み</span>
                                        <span>・</span>
                                        <span>実績 {selectedPost.userUsageCount}回</span>
                                    </p>
                                </div>
                            </div>

                            {isPaidUser ? (
                                <div className="space-y-5">
                                    <div className="bg-emerald-500 p-8 rounded-[2.5rem] text-white text-center shadow-xl relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-150 transition-transform duration-1000">
                                            <RiHandHeartFill size={100} />
                                        </div>
                                        <p className="text-[10px] font-black opacity-50 mb-3 tracking-[0.4em] uppercase relative z-10">Contact LINE ID</p>
                                        <p className="text-4xl font-black select-all tracking-tighter relative z-10">{selectedPost.lineId}</p>
                                        <p className="text-[10px] mt-6 font-bold opacity-60 italic leading-relaxed relative z-10">
                                            ※直接LINEして「那須アプリで見ました」と<br />チャットを送ってください。
                                        </p>
                                    </div>
                                    {auth.currentUser?.uid === selectedPost.uid && (
                                        <button
                                            onClick={() => handleComplete(selectedPost.id)}
                                            className="w-full py-6 bg-emerald-100 text-emerald-600 rounded-full font-black text-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                                        >
                                            <RiCheckboxCircleFill /> 手伝いが完了しました（報告）
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="bg-[#4A3B3B] p-10 rounded-[2.5rem] text-white text-center space-y-6">
                                    <RiVipCrownFill size={40} className="mx-auto text-emerald-400" />
                                    <div className="space-y-2">
                                        <p className="text-xl font-black">連絡先は有料会員限定です</p>
                                        <p className="text-[10px] font-medium opacity-60 leading-relaxed">
                                            いたずらやトラブル防止のため、連絡・手伝いは<br />
                                            月額制の有料会員（月額480円）のみとなります。
                                        </p>
                                    </div>
                                    <button className="w-full py-5 bg-emerald-500 rounded-full font-black text-sm active:scale-[0.95] transition-all">有料会員になって助け合う</button>
                                </div>
                            )}

                            <div className="p-6 bg-rose-50 rounded-[2rem] border border-rose-100 space-y-4">
                                <div className="flex items-center gap-2 text-rose-600">
                                    <RiShieldCheckFill size={20} />
                                    <div className="space-y-0.5">
                                        <h3 className="text-[10px] font-black italic">近所でちょっと、助け合い</h3>
                                        <p className="text-[8px] font-bold opacity-60">ご利用前に必ずお読みください</p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <RuleItem title="1. 業者の代わりではありません" description="これはプロへの依頼ではなく、あくまで近所同士の助け合いです。専門的な技術や高い完成度を求める内容はご遠慮ください。" />
                                    <RuleItem title="2. 個人間のやり取りです（運営は介入しません）" description="やり取り・作業・金銭授受に関するトラブルはすべて当事者同士で解決してください。運営は一切の責任・関与を行いません。" />
                                    <RuleItem title="3. 有料会員同士の掲示板です" description="投稿・連絡は有料会員（本人確認済み）のみが行えます。地域の一員として、責任ある行動をお願いします。" />
                                    <RuleItem title="4. 簡単な作業のみを想定しています" description="本サービスは、「電球を替えてほしい」「雪かき少し」「荷物運び」などの短時間・軽作業レベルの助け合いを想定しています。" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const TrustBadge = ({ icon, label }: { icon: any, label: string }) => (
    <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-emerald-400 border border-emerald-50 shadow-sm mx-auto">
            {icon}
        </div>
        <p className="text-[9px] font-black text-[#A89F94] tracking-tighter uppercase">{label}</p>
    </div>
);

const DetailCard = ({ icon, label, value, color = "gray" }: { icon: any, label: string, value: string, color?: "gray" | "emerald" }) => (
    <div className={`p-5 rounded-3xl border ${color === 'emerald' ? 'bg-emerald-50/50 border-emerald-100' : 'bg-[#FDFCFD] border-[#E8E2D9]'} space-y-1`}>
        <div className="flex items-center gap-2 text-[#A89F94]">
            <span className={color === 'emerald' ? 'text-emerald-500' : ''}>{icon}</span>
            <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
        </div>
        <p className={`text-sm font-black ${color === 'emerald' ? 'text-emerald-600' : 'text-[#4A3B3B]'}`}>{value}</p>
    </div>
);

const RuleItem = ({ title, description }: { title: string, description: string }) => (
    <div className="space-y-1">
        <p className="text-[10px] font-black text-[#4A3B3B] flex items-center gap-2">
            <span className="w-1 h-1 bg-rose-400 rounded-full"></span>
            {title}
        </p>
        <p className="text-[9px] font-bold text-[#8C8479] leading-relaxed pl-3 italic">
            {description}
        </p>
    </div>
);