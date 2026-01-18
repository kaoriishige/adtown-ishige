import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { db } from '../../../lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { RiLeafLine, RiPlantLine, RiArrowLeftLine, RiMessage3Fill, RiSearchLine, RiAddCircleFill } from 'react-icons/ri';
import Link from 'next/link';

export default function AkihataIndex() {
    const router = useRouter();
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // コレクション名: akihata_posts を監視
        const q = query(collection(db, 'akihata_posts'), orderBy('createdAt', 'desc'));
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
        <div className="min-h-screen bg-[#FDFCF8] pb-20 font-sans text-left">
            <header className="bg-white/80 backdrop-blur-md border-b border-emerald-100 px-6 py-5 sticky top-0 z-50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/premium')} className="text-emerald-800 p-2 hover:bg-emerald-50 rounded-full transition-colors">
                        <RiArrowLeftLine size={24} />
                    </button>
                    <div>
                        <h1 className="text-lg font-black text-emerald-900 tracking-tighter italic flex items-center gap-1">
                            <RiLeafLine /> 那須あき畑速報
                        </h1>
                        <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest leading-none">Save the Nasu Soil</p>
                    </div>
                </div>
                {/* 新規投稿への導線を追加（一貫性のため） */}
                <Link href="/premium/akihata/create" className="bg-emerald-600 text-white p-2 rounded-full shadow-lg shadow-emerald-100 active:scale-95 transition-transform">
                    <RiAddCircleFill size={24} />
                </Link>
            </header>

            <main className="p-4 max-w-2xl mx-auto space-y-6">
                {/* コンセプトメッセージ */}
                <div className="bg-emerald-900 text-white p-6 rounded-[2.5rem] shadow-xl italic relative overflow-hidden">
                    <p className="relative z-10 text-sm font-bold leading-relaxed">
                        「使われていない畑を、もう一度、那須の力に。」<br />
                        ここは、眠っている土地と、耕したい人を繋ぐ血流装置です。
                    </p>
                    <RiPlantLine className="absolute -bottom-4 -right-4 text-white/10" size={120} />
                </div>

                {loading ? (
                    <div className="py-20 text-center font-black text-emerald-200 animate-pulse italic">DIGGING FOR FIELDS...</div>
                ) : posts.length > 0 ? (
                    // データがある場合
                    posts.map((post) => (
                        <div key={post.id} className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-emerald-50 relative group">
                            <div className="relative h-56 bg-emerald-50">
                                {post.imageUrl ? (
                                    <img src={post.imageUrl} className="w-full h-full object-cover" alt={post.title} />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-emerald-200">
                                        <RiPlantLine size={48} />
                                        <p className="text-[10px] font-black uppercase mt-2 italic tracking-widest text-emerald-300">Secret Field</p>
                                    </div>
                                )}
                                <div className="absolute top-4 left-4 bg-emerald-900/80 backdrop-blur text-white px-4 py-1 rounded-full text-[10px] font-black italic">
                                    {post.area}
                                </div>
                            </div>

                            <div className="p-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-3 py-1 rounded-lg uppercase">
                                        {post.condition || '状態未確認'}
                                    </span>
                                </div>
                                <h3 className="text-xl font-black text-slate-800 mb-3 leading-tight italic">{post.title}</h3>
                                <p className="text-xs text-slate-500 leading-relaxed font-bold mb-6">{post.description}</p>

                                <a
                                    href={`https://line.me/ti/p/${post.lineId || 'YOUR_LINE_ID'}`}
                                    className="flex items-center justify-center gap-2 w-full py-4 bg-[#06C755] text-white rounded-2xl font-black text-sm shadow-lg active:scale-95 transition-all"
                                >
                                    <RiMessage3Fill size={20} /> この畑について相談する
                                </a>
                            </div>
                        </div>
                    ))
                ) : (
                    // ★ここが「真っ白」を防ぐポイント：データがない時の表示
                    <div className="bg-white py-20 px-6 rounded-[2.5rem] border-2 border-dashed border-emerald-100 text-center">
                        <RiSearchLine className="mx-auto text-emerald-100 mb-4" size={48} />
                        <p className="text-emerald-900 font-black mb-2">現在、開墾待ちの畑はありません</p>
                        <p className="text-xs text-slate-400 font-bold leading-relaxed">
                            新しいあき畑情報が入るまでお待ちいただくか、<br/>
                            あなたの知っている情報を教えてください。
                        </p>
                    </div>
                )}

                {/* 情報提供セクション */}
                <div className="bg-white p-8 rounded-[2rem] border-2 border-emerald-50 text-center shadow-sm">
                    <p className="text-xs font-black text-emerald-800 mb-4 italic uppercase tracking-widest">Inform us / 情報提供</p>
                    <p className="text-sm font-bold text-slate-500 leading-relaxed mb-6">
                        「使っていない畑がある」「隣が空いている」<br />
                        そんな情報をLINEで送ってください。匿名でOKです。
                    </p>
                    <a href="https://line.me/ti/p/YOUR_LINE_ID" className="inline-block px-10 py-4 bg-slate-900 text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">
                        LINEで情報を送る
                    </a>
                </div>
            </main>
        </div>
    );
}