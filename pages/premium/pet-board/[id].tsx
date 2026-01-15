import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link'; // ← これを追加しエラーを解消
import { db, auth } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import {
    RiArrowLeftLine,
    RiLineFill,
    RiLockLine,
    RiInformationLine,
    RiShieldCheckFill,
    RiHistoryLine
} from 'react-icons/ri';

export default function PublicPetDetail() {
    const router = useRouter();
    const { id } = router.query;
    const [post, setPost] = useState<any>(null);
    const [isPremium, setIsPremium] = useState(false);

    useEffect(() => {
        const fetchContent = async () => {
            if (!id) return;
            // 投稿データは誰でも(無料でも)取得可能
            const postDoc = await getDoc(doc(db, "pet_posts", id as string));
            if (postDoc.exists()) setPost(postDoc.data());

            // 閲覧ユーザーが有料会員かチェック
            const user = auth.currentUser;
            if (user) {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                const userData = userDoc.data();
                setIsPremium(!!(userData?.isPaid || userData?.subscriptionStatus === 'active'));
            }
        };
        fetchContent();
    }, [id]);

    if (!post) return null;

    return (
        <div className="min-h-screen bg-white pb-24 font-sans text-gray-800">
            {/* 画像エリア */}
            <div className="relative aspect-square w-full">
                <button onClick={() => router.back()} className="absolute top-6 left-6 z-10 w-10 h-10 bg-white/80 backdrop-blur rounded-full flex items-center justify-center shadow-lg text-gray-600">
                    <RiArrowLeftLine size={24} />
                </button>
                <img src={post.imageUrl} className="w-full h-full object-cover" alt="pet" />
            </div>

            <main className="max-w-md mx-auto p-6 space-y-8">
                {/* 投稿内容：無料でも見れる */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{post.category}</span>
                        <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{post.area}</span>
                    </div>
                    <p className="text-xl font-black leading-relaxed">{post.description}</p>

                    {/* 投稿者の信頼情報：無料でも「この人は安心だ」とわかるようにする */}
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
                        <span className="text-xs font-bold text-gray-400">{post.isPaid ? post.nickname : '無料掲示板ユーザー'}</span>
                        {post.isPaid && (
                            <div className="flex gap-1">
                                <RiShieldCheckFill className="text-blue-500" size={16} />
                                <RiHistoryLine className="text-emerald-500" size={16} />
                            </div>
                        )}
                    </div>
                </div>

                {/* 有料・無料の壁：LINE ID（ここが設計の肝） */}
                <section className="space-y-4">
                    <h3 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Contact</h3>

                    {isPremium ? (
                        <div className="bg-[#06C755] rounded-3xl p-6 text-white flex justify-between items-center shadow-xl shadow-emerald-100">
                            <div className="flex items-center gap-3">
                                <RiLineFill size={32} />
                                <div>
                                    <p className="text-[9px] font-black opacity-60 uppercase">Line ID</p>
                                    <p className="text-xl font-black tracking-tight">{post.lineId}</p>
                                </div>
                            </div>
                            <button onClick={() => { navigator.clipboard.writeText(post.lineId); alert("IDをコピーしました"); }}
                                className="bg-white text-[#06C755] px-4 py-2 rounded-xl text-xs font-black active:scale-95 transition-all">
                                COPY
                            </button>
                        </div>
                    ) : (
                        <div className="bg-gray-50 rounded-[2.5rem] p-10 text-center border-2 border-dashed border-gray-200">
                            <RiLockLine size={32} className="mx-auto text-gray-300 mb-3" />
                            <p className="text-sm font-black text-gray-800 mb-1">連絡先はプレミアム会員限定です</p>
                            <p className="text-[10px] font-bold text-gray-400 mb-6 leading-relaxed">本人確認済みの安心な方と<br />繋がるための機能です</p>
                            <Link href="/premium/join" className="inline-block px-10 py-3 bg-gray-900 text-white rounded-full text-xs font-black shadow-lg active:scale-95 transition-all">
                                詳しく見る
                            </Link>
                        </div>
                    )}
                </section>

                {/* PAGE 2-3：絶対に入れる注意文（全員に見せる） */}
                <div className="bg-orange-50/50 p-6 rounded-3xl border border-orange-100 space-y-3">
                    <div className="flex items-center gap-2 text-[10px] font-black text-orange-600 uppercase tracking-widest">
                        <RiInformationLine size={18} /> ご利用前に必ずお読みください
                    </div>
                    <ul className="text-[10px] leading-relaxed text-orange-800/60 font-bold space-y-1.5">
                        <li>• 本サービスは個人間の出会いの場を提供する掲示板です。</li>
                        <li>• 譲渡・飼育・引き渡しの判断はすべて当事者同士で行ってください。</li>
                        <li>• 運営は一切の仲介・斡旋・判断・責任を負いません。</li>
                        <li>• 金銭のやり取り・条件の交渉についても運営は関与しません。</li>
                        <li>• 少しでも不安を感じた場合は、やり取りを中止してください。</li>
                    </ul>
                </div>
            </main>
        </div>
    );
}