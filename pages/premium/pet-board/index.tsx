import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { RiShieldCheckFill, RiMapPin2Fill, RiAddLine, RiTimeLine, RiArrowLeftLine } from 'react-icons/ri'; // RiArrowLeftLineを追加
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

interface PetPost {
    id: string;
    category: string;
    imageUrl: string;
    description: string;
    area: string;
    nickname: string;
    isPaid: boolean;
    createdAt: any;
}

export default function PublicPetBoard() {
    const [posts, setPosts] = useState<PetPost[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, "pet_posts"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const postData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as PetPost[];
            setPosts(postData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const formatTime = (timestamp: any) => {
        if (!timestamp) return '';
        try {
            const date = timestamp.toDate();
            return formatDistanceToNow(date, { addSuffix: true, locale: ja });
        } catch (e) {
            return '';
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFCFD] pb-32 font-sans text-gray-800">
            {/* ヘッダー */}
            <header className="bg-white/90 backdrop-blur-md px-6 py-5 border-b border-gray-100 sticky top-0 z-40 shadow-sm">
                <div className="max-w-md mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        {/* 戻るボタン */}
                        <Link href="/premium/dashboard" className="text-gray-400 hover:text-gray-900 transition-colors p-1">
                            <RiArrowLeftLine size={24} />
                        </Link>
                        <div>
                            <h1 className="text-xl font-black text-gray-900 italic tracking-tighter">
                                Nasu <span className="text-emerald-600">ペット掲示板</span>
                            </h1>
                            <p className="text-[10px] font-bold text-gray-400">地域で支え合う、ペットとの暮らし</p>
                        </div>
                    </div>

                    {/* 登録ボタン */}
                    <Link
                        href="/premium/pet-board/create"
                        className="bg-emerald-600 text-white px-4 py-2 rounded-xl flex items-center gap-1 shadow-lg shadow-emerald-100 active:scale-95 transition-all"
                    >
                        <RiAddLine size={18} />
                        <span className="text-sm font-black tracking-tighter">登録</span>
                    </Link>
                </div>
            </header>

            <main className="max-w-md mx-auto p-4 space-y-4">
                {loading ? (
                    <div className="text-center py-20 text-gray-400 animate-pulse font-bold italic">読み込み中...</div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-100">
                        <p className="text-gray-400 font-bold italic text-sm">現在、投稿はありません</p>
                    </div>
                ) : (
                    posts.map((post) => (
                        <Link
                            key={post.id}
                            href={`/pet-board/${post.id}`}
                            className="block bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm active:scale-[0.98] transition-all hover:border-emerald-100"
                        >
                            <div className="flex">
                                <div className="w-32 h-32 shrink-0 relative bg-gray-100">
                                    <img
                                        src={post.imageUrl || '/images/pet-placeholder.jpg'}
                                        className="w-full h-full object-cover"
                                        alt="pet"
                                        loading="lazy"
                                    />
                                    {post.isPaid && (
                                        <div className="absolute top-2 left-2 bg-blue-500 rounded-full p-1 shadow-md">
                                            <RiShieldCheckFill className="text-white" size={12} />
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 flex-1 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start mb-1.5">
                                            <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-tighter ${post.category === '里親募集' ? 'bg-orange-50 text-orange-600' :
                                                post.category === '迷子情報' ? 'bg-rose-50 text-rose-600' : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                {post.category}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-gray-400 font-bold flex items-center gap-0.5">
                                                    <RiMapPin2Fill size={10} /> {post.area}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-sm font-bold text-gray-700 line-clamp-2 leading-snug">
                                            {post.description}
                                        </p>
                                    </div>

                                    <div className="mt-2 flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 text-gray-400 font-black">
                                            <span className="text-[10px]">
                                                {post.isPaid ? post.nickname : '匿名ユーザー'}
                                            </span>
                                            {post.isPaid && (
                                                <span className="text-[8px] bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded-full">本人確認済</span>
                                            )}
                                        </div>
                                        <span className="text-[9px] text-gray-300 font-bold flex items-center gap-0.5 italic">
                                            <RiTimeLine size={10} /> {formatTime(post.createdAt)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </main>

            <div className="max-w-md mx-auto px-6 mt-4">
                <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                    <p className="text-[10px] font-bold text-emerald-700 leading-relaxed text-center italic">
                        ※ 本人確認済みの投稿は信頼性が高く、安心してやり取りいただけます。
                    </p>
                </div>
            </div>
        </div>
    );
}