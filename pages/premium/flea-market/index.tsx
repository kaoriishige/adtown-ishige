import React, { useState, useEffect } from 'react'; // useStateを追加
import { db, auth } from '../../../lib/firebase'; // パスを調整
import { collection, query, orderBy, onSnapshot, doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import {
    RiShoppingBag3Fill,
    RiAddLine,
    RiMapPin2Fill,
    RiShieldCheckFill,
    RiVipCrownFill,
    RiCloseLine,
    RiArrowLeftSLine,
    RiCheckboxCircleFill,
    RiSearch2Fill,
    RiInformationLine,
    RiHeartFill,
    RiInboxArchiveLine
} from 'react-icons/ri';
import Link from 'next/link';
import Head from 'next/head';

interface FurimaPost {
    id: string;
    uid: string;
    userName: string;
    userUsageCount: number;
    isVerified: boolean;
    title: string;
    category: string;
    price: string | number;
    area: string;
    location: string;
    description: string;
    image: string;
    lineId: string;
    status: 'active' | 'completed';
    createdAt: any;
}

export default function FleaMarketPage() {
    const [view, setView] = useState<'top' | 'list'>('top');
    const [posts, setPosts] = useState<FurimaPost[]>([]);
    const [selectedPost, setSelectedPost] = useState<FurimaPost | null>(null);
    const [isPaidUser, setIsPaidUser] = useState(false);
    const [loading, setLoading] = useState(true);

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

        // コレクション名: furima_posts を監視
        const q = query(collection(db, "furima_posts"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snap) => {
            const postData = snap.docs.map(d => ({ id: d.id, ...d.data() } as FurimaPost));
            setPosts(postData.filter(p => p.status === 'active'));
            setLoading(false);
        }, (err) => {
            console.error(err);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleComplete = async (postId: string) => {
        if (!confirm("取引は完了しましたか？募集を終了し、あなたの実績を+1します。")) return;
        try {
            await updateDoc(doc(db, "furima_posts", postId), { status: 'completed' });
            await updateDoc(doc(db, "users", auth.currentUser!.uid), {
                usageCount: increment(1)
            });
            setSelectedPost(null);
            alert("お疲れ様でした！実績が更新されました。");
        } catch (e) {
            console.error(e);
        }
    };

    if (view === 'top') {
        return (
            <div className="min-h-screen bg-[#FDFCFD] flex flex-col items-center justify-center p-8 gap-8 font-sans transition-all duration-500">
                <Head><title>みんなのNasuフリマ</title></Head>

                <div className="text-center space-y-2 mb-4 animate-in fade-in zoom-in duration-700">
                    <div className="w-20 h-20 bg-pink-500 rounded-[2.5rem] flex items-center justify-center text-white mx-auto shadow-xl shadow-pink-100 mb-6">
                        <RiShoppingBag3Fill size={40} />
                    </div>
                    <span className="text-[10px] tracking-[0.4em] uppercase text-[#A89F94] font-bold block">Community Flea Market</span>
                    <h1 className="text-2xl font-black italic text-[#4A3B3B]">みんなのNasuフリマ</h1>
                    <p className="text-[11px] font-bold text-[#A89F94]">那須塩原・大田原・那須町の掲示板</p>
                </div>

                <div className="w-full max-w-sm space-y-6 animate-in slide-in-from-bottom-8 duration-1000 text-center">
                    <Link href={isPaidUser ? "/premium/flea-market/create" : "/premium"} className="block group">
                        <button className="w-full py-10 bg-[#4A3B3B] text-white rounded-[3rem] font-black text-2xl shadow-2xl flex flex-col items-center gap-2 group-hover:scale-105 transition-all">
                            <span className="text-[10px] opacity-60 flex items-center gap-1 uppercase tracking-widest font-bold">
                                <RiAddLine /> 不要品を近所の人に
                            </span>
                            売ります
                        </button>
                    </Link>

                    <button
                        onClick={() => setView('list')}
                        className="w-full py-10 bg-pink-500 text-white rounded-[3rem] font-black text-2xl shadow-2xl shadow-pink-100 flex flex-col items-center gap-2 hover:scale-105 transition-all"
                    >
                        <span className="text-[10px] opacity-70 flex items-center gap-1 uppercase tracking-widest font-bold">
                            <RiSearch2Fill /> 掘り出し物を探す
                        </span>
                        探してます
                    </button>

                    <p className="text-[10px] text-center font-bold text-[#D1C9BF] leading-relaxed pt-4 italic">
                        家の中の邪魔な物を、近所で現金にする。<br />
                        手渡し限定の安心掲示板。
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFCFD] pb-32 font-sans text-[#4A3B3B] text-left">
            <Head><title>商品一覧 | みんなのNasuフリマ</title></Head>

            <header className="bg-white/80 backdrop-blur-xl border-b border-[#E8E2D9] px-6 py-4 sticky top-0 z-50">
                <div className="max-w-xl mx-auto flex items-center justify-between">
                    <button onClick={() => setView('top')} className="w-10 h-10 flex items-center justify-center rounded-full bg-[#FDFCFD] border border-[#E8E2D9] text-[#A89F94] active:scale-90 transition-all">
                        <RiArrowLeftSLine size={24} />
                    </button>
                    <div className="text-center">
                        <span className="text-[10px] tracking-[0.2em] uppercase text-[#A89F94] block font-bold">Listings</span>
                        <h1 className="text-sm font-black italic leading-none">みんなのNasuフリマ</h1>
                    </div>
                    <Link href="/premium/flea-market/create" className="text-pink-500 bg-pink-50 p-2 rounded-full active:scale-95 transition-all">
                        <RiAddLine size={24} />
                    </Link>
                </div>
            </header>

            <div className="max-w-xl mx-auto p-6">
                {loading ? (
                    <div className="py-20 text-center font-black text-pink-200 animate-pulse italic uppercase tracking-widest">Loading Items...</div>
                ) : posts.length > 0 ? (
                    <div className="grid grid-cols-2 gap-5 animate-in fade-in duration-700">
                        {posts.map(post => (
                            <div key={post.id} onClick={() => setSelectedPost(post)} className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-[#F3F0EC] active:scale-95 transition group cursor-pointer">
                                <div className="aspect-square bg-[#FDFCFD] relative">
                                    <img src={post.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                                    <div className="absolute top-2 left-2 bg-black/40 backdrop-blur-md text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">{post.area}</div>
                                    {post.category && (
                                        <div className="absolute bottom-2 left-2 bg-white/80 backdrop-blur-md text-pink-600 text-[8px] font-black px-2 py-0.5 rounded-full border border-pink-100">
                                            {post.category}
                                        </div>
                                    )}
                                </div>
                                <div className="p-4 space-y-1">
                                    <p className="text-pink-500 font-black text-base leading-none">
                                        {Number(post.price) === 0 ? "無料" : `¥${Number(post.price).toLocaleString()}`}
                                    </p>
                                    <h3 className="text-[11px] font-black text-[#4A3B3B] line-clamp-1">{post.title}</h3>
                                    <div className="flex items-center justify-between pt-1">
                                        <span className="text-[9px] font-bold text-[#A89F94] italic">{post.userName}</span>
                                        <span className="text-[8px] font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">
                                            利用{post.userUsageCount || 0}回
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    // ★投稿がゼロの時の表示
                    <div className="py-24 px-6 text-center bg-white rounded-[3rem] border-2 border-dashed border-[#F3F0EC]">
                        <RiInboxArchiveLine className="mx-auto text-pink-100 mb-4" size={60} />
                        <p className="text-[#4A3B3B] font-black mb-2 leading-relaxed">まだ掘り出し物はありません</p>
                        <p className="text-[10px] text-[#A89F94] font-bold mt-2 uppercase tracking-[0.2em]">Be the first to list an item!</p>
                        <Link href="/premium/flea-market/create" className="inline-block mt-8 px-8 py-3 bg-pink-500 text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all">
                            不要品を投稿する
                        </Link>
                    </div>
                )}
            </div>

            {/* モーダル表示部分（selectedPostがある場合） */}
            {selectedPost && (
                <div className="fixed inset-0 bg-[#4A3B3B]/40 backdrop-blur-sm flex items-end z-[60] animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-xl mx-auto rounded-t-[3rem] p-8 pb-12 shadow-2xl max-h-[95vh] overflow-y-auto animate-in slide-in-from-bottom duration-500 scrollbar-hide text-left">
                        <div className="flex justify-between items-start mb-6">
                            <div className="space-y-1">
                                <span className="text-[10px] font-black text-pink-500 bg-pink-50 px-3 py-1 rounded-full uppercase tracking-widest leading-none block w-fit mb-2">
                                    {selectedPost.category}
                                </span>
                                <h2 className="text-2xl font-black text-[#4A3B3B] leading-tight">{selectedPost.title}</h2>
                            </div>
                            <button onClick={() => setSelectedPost(null)} className="p-3 bg-[#FDFCFD] border border-[#E8E2D9] rounded-full text-[#A89F94] active:scale-90 transition-all shadow-sm">
                                <RiCloseLine size={24} />
                            </button>
                        </div>

                        <div className="relative group mb-8">
                            <img src={selectedPost.image} className="w-full aspect-square object-cover rounded-[2.5rem] shadow-xl" alt="" />
                            <div className="absolute bottom-4 left-4 right-4 flex gap-2 overflow-x-auto scrollbar-hide">
                                <div className="bg-black/40 backdrop-blur-md text-white text-[10px] font-black px-4 py-2 rounded-full flex items-center gap-2">
                                    <RiMapPin2Fill /> {selectedPost.area}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 mb-8 p-5 bg-[#FDFCFD] rounded-3xl border border-[#F3F0EC]">
                            <div className="w-12 h-12 bg-pink-100 rounded-2xl flex items-center justify-center text-pink-500 shadow-inner">
                                <RiHeartFill size={24} />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-black text-[#4A3B3B]">{selectedPost.userName}</p>
                                <p className="text-[10px] font-black text-[#A89F94] flex items-center gap-2 mt-0.5">
                                    <span className="text-emerald-500 font-black flex items-center gap-0.5"><RiShieldCheckFill /> 本人確認済み</span>
                                    <span>・</span>
                                    <span>実績 {selectedPost.userUsageCount || 0}回</span>
                                </p>
                            </div>
                        </div>

                        <div className="space-y-6 mb-10">
                            <div className="flex items-center justify-between border-b border-[#F3F0EC] pb-4">
                                <span className="text-xs font-black text-[#A89F94] uppercase tracking-widest italic">価格</span>
                                <span className="text-3xl font-black text-pink-500">
                                    {Number(selectedPost.price) === 0 ? "無料" : `¥${Number(selectedPost.price).toLocaleString()}`}
                                </span>
                            </div>
                            <div className="flex flex-col gap-2 border-b border-[#F3F0EC] pb-4">
                                <span className="text-xs font-black text-[#A89F94] uppercase tracking-widest italic">受け渡し場所</span>
                                <span className="font-black text-[#4A3B3B] text-lg bg-[#F3F0EC]/30 p-2 rounded-lg">{selectedPost.location}</span>
                            </div>
                            <div className="py-4">
                                <span className="text-xs font-black text-[#A89F94] uppercase tracking-widest italic block mb-3">商品説明</span>
                                <p className="text-sm font-bold text-[#8C8479] leading-relaxed whitespace-pre-wrap">{selectedPost.description}</p>
                            </div>
                        </div>

                        {isPaidUser ? (
                            <div className="space-y-5">
                                <div className="bg-[#4A3B3B] p-8 rounded-[2.5rem] text-white text-center shadow-xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-150 transition-transform duration-1000">
                                        <RiShoppingBag3Fill size={100} />
                                    </div>
                                    <p className="text-[10px] font-black opacity-50 mb-3 tracking-[0.4em] uppercase relative z-10">Seller LINE ID</p>
                                    <p className="text-4xl font-black select-all tracking-tighter relative z-10">{selectedPost.lineId}</p>
                                    <p className="text-[10px] mt-6 font-bold opacity-60 italic leading-relaxed relative z-10">
                                        ※直接LINEして「那須フリマで見ました」と<br />チャットを送ってください。
                                    </p>
                                </div>
                                {auth.currentUser?.uid === selectedPost.uid && (
                                    <button
                                        onClick={() => handleComplete(selectedPost.id)}
                                        className="w-full py-6 bg-emerald-500 text-white rounded-full font-black text-lg flex items-center justify-center gap-2 shadow-xl shadow-emerald-100 active:scale-[0.98] transition-all"
                                    >
                                        <RiCheckboxCircleFill /> 取引完了報告（実績を＋1）
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="bg-gradient-to-br from-pink-500 to-rose-500 p-10 rounded-[3rem] text-center shadow-2xl shadow-pink-100">
                                <RiVipCrownFill className="mx-auto text-yellow-300 mb-6" size={60} />
                                <h3 className="text-white font-black text-xl mb-3 leading-tight">この商品を買うには<br />有料会員登録が必要です</h3>
                                <p className="text-white/70 text-[10px] font-bold mb-8 uppercase tracking-widest">Only for Premium Members</p>
                                <Link href="/premium">
                                    <button className="bg-white text-pink-500 w-full py-5 rounded-full font-black text-lg shadow-lg hover:shadow-xl active:scale-95 transition-all">
                                        月額480円で参加する
                                    </button>
                                </Link>
                            </div>
                        )}

                        <div className="mt-12 p-6 bg-pink-50 rounded-[2rem] border border-pink-100 space-y-4 shadow-inner">
                            <div className="flex items-center gap-2 text-pink-600">
                                <RiInformationLine size={20} />
                                <span className="text-xs font-black uppercase tracking-widest">Nasu Furima Rules</span>
                            </div>
                            <div className="space-y-4">
                                <RuleItem title="1. 個人間取引・自己責任です" description="本サービスは掲示板です。取引・トラブル対応はすべて当事者同士で行ってください。" />
                                <RuleItem title="2. 直接の受け渡し限定" description="発送トラブル防止のため対面限定です。人目の多い公共の場所で待ち合わせをしてください。" />
                                <RuleItem title="3. 代金は商品と引き換え" description="事前の振込は絶対にしないでください。その場で物を確認してから支払ってください。" />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const RuleItem = ({ title, description }: { title: string, description: string }) => (
    <div className="space-y-1 text-left">
        <p className="text-[10px] font-black text-[#4A3B3B] flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-pink-500 rounded-full"></span>
            {title}
        </p>
        <p className="text-[9px] font-bold text-[#8C8479] leading-relaxed pl-3 italic">
            {description}
        </p>
    </div>
);