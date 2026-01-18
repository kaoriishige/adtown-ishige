import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { db } from '../../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import {
    RiArrowLeftLine, RiMapPinRangeFill, RiHomeGearFill,
    RiDiscussLine, RiPriceTag3Fill, RiInformationFill
} from 'react-icons/ri';

export default function AkiyaDetail() {
    const router = useRouter();
    const { id } = router.query;
    const [item, setItem] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        const fetchDetail = async () => {
            const docRef = doc(db, 'akiya_posts', id as string);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setItem({ id: docSnap.id, ...docSnap.data() });
            }
            setLoading(false);
        };
        fetchDetail();
    }, [id]);

    if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-slate-400 animate-pulse uppercase italic">Accessing Secret Data...</div>;
    if (!item) return <div className="p-10 text-center font-bold">物件が見つかりません</div>;

    return (
        <div className="min-h-screen bg-white pb-24">
            {/* メイン画像 */}
            <div className="relative h-[45vh] w-full bg-slate-900">
                {item.imageUrl ? (
                    <img src={item.imageUrl} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-700 font-black italic">NO PHOTO</div>
                )}
                <button onClick={() => router.back()} className="absolute top-6 left-6 w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white border border-white/20">
                    <RiArrowLeftLine size={28} />
                </button>
            </div>

            {/* コンテンツ */}
            <main className="max-w-2xl mx-auto px-6 -mt-10 relative z-10">
                <div className="bg-white rounded-[3rem] p-8 shadow-2xl shadow-slate-200">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="bg-slate-900 text-white text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-widest italic">
                            {item.type}
                        </span>
                        <span className="text-slate-400 text-[10px] font-black tracking-widest uppercase">
                            Property ID: {item.id.substring(0, 8)}
                        </span>
                    </div>

                    <h1 className="text-3xl font-black text-slate-800 leading-tight mb-8">
                        {item.title}
                    </h1>

                    <div className="space-y-6">
                        {/* 物件概要 */}
                        <div className="bg-slate-50 rounded-3xl p-6">
                            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <RiInformationFill className="text-slate-900" /> Property Details
                            </h2>
                            <p className="text-slate-700 font-bold leading-relaxed whitespace-pre-wrap">
                                {item.description}
                            </p>
                        </div>

                        {/* スペックシート */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                                <RiMapPinRangeFill className="text-slate-300 mb-1" size={20} />
                                <p className="text-[9px] font-black text-slate-400 uppercase">Area</p>
                                <p className="font-black text-slate-800 text-sm">{item.area}</p>
                            </div>
                            <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                                <RiHomeGearFill className="text-slate-300 mb-1" size={20} />
                                <p className="text-[9px] font-black text-slate-400 uppercase">Condition</p>
                                <p className="font-black text-slate-800 text-sm">{item.condition}</p>
                            </div>
                        </div>

                        {/* アクションボタン */}
                        <div className="pt-4 space-y-3">
                            <button className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all">
                                <RiDiscussLine size={24} />
                                所有者に「相談」を送る
                            </button>
                            <p className="text-[9px] text-center font-bold text-slate-400 px-4 leading-relaxed uppercase tracking-tighter">
                                ※このボタンは不動産売買契約を成立させるものではありません。まずは所有者と直接メッセージのやり取りを開始します。
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}