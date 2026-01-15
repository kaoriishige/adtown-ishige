import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { RiShieldCheckFill, RiMapPin2Fill, RiLockLine, RiAddLine } from 'react-icons/ri';

export default function PublicPetBoard() {
    const [posts, setPosts] = useState<any[]>([]);

    useEffect(() => {
        // ログインチェックなし。誰でも取得可能
        const q = query(collection(db, "pet_posts"), orderBy("createdAt", "desc"));
        return onSnapshot(q, (snapshot) => {
            setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
    }, []);

    return (
        <div className="min-h-screen bg-[#FDFCFD] pb-24 font-sans text-gray-800">
            {/* 無料ゾーンのヘッダー：オープンな雰囲気 */}
            <header className="bg-white px-6 py-6 border-b border-gray-100 sticky top-0 z-40">
                <div className="max-w-md mx-auto flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-black text-gray-900 italic">みんなのNasu ペット掲示板</h1>
                        <p className="text-[10px] font-bold text-gray-400">地域で支え合う安心掲示板</p>
                    </div>
                    {/* 投稿は誰でも可能だが、本名確認なしの「無料投稿」扱いになる [cite: 2] */}
                    <Link href="/premium/pet-board/create" className="bg-emerald-600 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg">
                        <RiAddLine size={24} />
                    </Link>
                </div>
            </header>

            <main className="max-w-md mx-auto p-4 space-y-4">
                {posts.map((post) => (
                    <Link key={post.id} href={`/pet-board/${post.id}`} className="block bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm active:opacity-70 transition-all">
                        <div className="flex">
                            {/* 写真1枚 [cite: 10] */}
                            <div className="w-28 h-28 shrink-0 relative">
                                <img src={post.imageUrl} className="w-full h-full object-cover" alt="pet" />
                                {post.isPaid && (
                                    <div className="absolute top-1 left-1 bg-white/90 rounded-full p-0.5">
                                        <RiShieldCheckFill className="text-blue-500" size={14} />
                                    </div>
                                )}
                            </div>
                            
                            <div className="p-4 flex-1">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-[9px] font-black bg-gray-100 px-2 py-0.5 rounded text-gray-500 uppercase tracking-tighter">
                                        {post.category} [cite: 3]
                                    </span>
                                    <span className="text-[10px] text-gray-400 font-bold flex items-center gap-0.5">
                                        <RiMapPin2Fill size={10} /> {post.area} [cite: 12]
                                    </span>
                                </div>
                                {/* 一言 [cite: 11] */}
                                <p className="text-sm font-bold text-gray-700 line-clamp-2">{post.description}</p>
                                
                                <div className="mt-2 flex items-center gap-1">
                                    {/* 有料会員ならニックネーム固定、無料は「知らん人」扱い [cite: 20, 23] */}
                                    <span className="text-[10px] font-black text-gray-400">
                                        {post.isPaid ? post.nickname : '（無料掲示板ユーザー）'}
                                    </span>
                                    {post.isPaid && <span className="text-[8px] bg-blue-50 text-blue-500 px-1 rounded font-black">本人確認済 [cite: 19]</span>}
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </main>
        </div>
    );
}