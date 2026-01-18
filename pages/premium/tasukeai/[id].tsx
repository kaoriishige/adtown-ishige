import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { db } from '../../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import {
    RiArrowLeftSLine, RiMapPin2Fill, RiTimeLine, RiInformationFill,
    RiShareLine, RiExternalLinkLine, RiUserHeartLine
} from 'react-icons/ri';

export default function TasukeaiDetail() {
    const router = useRouter();
    const { id } = router.query;
    const [item, setItem] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        const fetchDetail = async () => {
            const docRef = doc(db, 'support_alerts', id as string);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setItem({ id: docSnap.id, ...docSnap.data() });
            }
            setLoading(false);
        };
        fetchDetail();
    }, [id]);

    if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-gray-300 animate-pulse uppercase tracking-widest">Loading Detail...</div>;
    if (!item) return <div className="p-10 text-center font-bold">情報が見つかりませんでした</div>;

    // Googleマップ検索URLの生成
    const googleMapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.provider + ' ' + item.area)}`;

    return (
        <div className="min-h-screen bg-[#F8F9FA] pb-24">
            {/* ヒーロー画像エリア */}
            <div className="relative h-[40vh] w-full bg-gray-900">
                {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover opacity-80" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-400 to-red-500">
                        <RiInformationFill size={80} className="text-white opacity-30" />
                    </div>
                )}
                <button
                    onClick={() => router.back()}
                    className="absolute top-6 left-6 w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white border border-white/30 active:scale-90 transition-all"
                >
                    <RiArrowLeftSLine size={32} />
                </button>
            </div>

            {/* コンテンツカード */}
            <main className="max-w-2xl mx-auto px-6 -mt-12 relative z-10">
                <div className="bg-white rounded-[3rem] p-8 shadow-xl shadow-gray-200/50">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="bg-orange-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                            {item.category}
                        </span>
                        <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                            ID: {item.id.substring(0, 8)}
                        </span>
                    </div>

                    <h1 className="text-3xl font-black text-gray-800 leading-tight mb-6 italic">
                        {item.title}
                    </h1>

                    <div className="space-y-6">
                        {/* 概要セクション */}
                        <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
                            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <RiInformationFill className="text-orange-500" /> Description
                            </h2>
                            <p className="text-gray-700 font-bold leading-relaxed whitespace-pre-wrap">
                                {item.description}
                            </p>
                        </div>

                        {/* 詳細スペック */}
                        <div className="grid grid-cols-1 gap-4">
                            <div className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-2xl">
                                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
                                    <RiUserHeartLine size={24} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase">Provider / 提供元</p>
                                    <p className="font-black text-gray-800">{item.provider}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-2xl">
                                <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-red-500">
                                    <RiTimeLine size={24} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase">Deadline / 掲載終了</p>
                                    <p className="font-black text-red-500">{item.dateEnd?.toDate().toLocaleDateString()}まで</p>
                                </div>
                            </div>
                        </div>

                        {/* マップボタン */}
                        <a
                            href={googleMapUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between w-full p-6 bg-emerald-500 text-white rounded-[2rem] shadow-lg shadow-emerald-200 active:scale-[0.98] transition-all group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                    <RiMapPin2Fill size={24} />
                                </div>
                                <div className="text-left">
                                    <p className="text-[10px] font-black text-emerald-100 uppercase tracking-widest leading-none mb-1">Navigation</p>
                                    <p className="font-black text-lg leading-none">場所をマップで確認</p>
                                </div>
                            </div>
                            <RiExternalLinkLine size={24} className="opacity-50 group-hover:translate-x-1 transition-transform" />
                        </a>
                    </div>
                </div>

                {/* シェア・フッター */}
                <div className="mt-10 flex justify-center">
                    <button className="flex items-center gap-2 text-gray-400 font-black text-xs uppercase tracking-widest hover:text-gray-600 transition-colors">
                        <RiShareLine size={20} /> Share this info
                    </button>
                </div>
            </main>
        </div>
    );
}