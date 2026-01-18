import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import {
    RiArrowLeftLine, RiNotification3Line, RiMapPinRangeLine,
    RiPlantLine, RiUserHeartLine, RiLightbulbFlashLine, RiCalendarCheckLine,
    RiImageLine, RiTimeLine, RiAddLine // RiAddLineを追加
} from 'react-icons/ri';

const CATEGORIES = [
    { id: 'all', name: 'すべて', icon: <RiLightbulbFlashLine />, color: 'orange' },
    { id: 'food', name: '野菜・食品', icon: <RiPlantLine />, color: 'emerald' },
    { id: 'child', name: '子ども・体験', icon: <RiUserHeartLine />, color: 'pink' },
    { id: 'facility', name: '施設・無料', icon: <RiMapPinRangeLine />, color: 'blue' },
    { id: 'admin', name: '行政・助成', icon: <RiCalendarCheckLine />, color: 'purple' },
];

interface SupportAlert {
    id: string;
    title: string;
    description: string;
    category: string;
    area: string;
    imageUrl?: string;
    provider: string;
    dateEnd: any;
    createdAt: any;
}

export default function TasukeaiIndex() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('all');
    const [alerts, setAlerts] = useState<SupportAlert[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const q = query(
            collection(db, 'support_alerts'),
            where('dateEnd', '>=', Timestamp.fromDate(today)),
            orderBy('dateEnd', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as SupportAlert[];
            setAlerts(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const filteredAlerts = activeTab === 'all'
        ? alerts
        : alerts.filter(a => a.category === activeTab);

    const getRemainingDays = (dateEnd: any) => {
        if (!dateEnd) return null;
        try {
            const end = dateEnd.toDate();
            const now = new Date();
            const diffTime = end.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays;
        } catch (e) {
            return null;
        }
    };

    return (
        <div className="min-h-screen bg-[#F8F9FA] pb-32 font-sans">
            <Head><title>那須たすけあい速報 | PREMIUM</title></Head>

            <header className="bg-white/90 backdrop-blur-md border-b px-6 py-4 sticky top-0 z-50">
                <div className="flex items-center justify-between mb-4 max-w-2xl mx-auto">
                    <button onClick={() => router.back()} className="text-gray-400 p-2 hover:bg-gray-50 rounded-full transition-all">
                        <RiArrowLeftLine size={24} />
                    </button>
                    <h1 className="text-lg font-black text-gray-800 tracking-tighter italic">那須たすけあい速報</h1>
                    <div className="bg-orange-500 p-2 rounded-full text-white shadow-lg shadow-orange-100 animate-pulse">
                        <RiNotification3Line size={20} />
                    </div>
                </div>

                <div className="flex gap-2 overflow-x-auto no-scrollbar py-1 max-w-2xl mx-auto">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveTab(cat.id)}
                            className={`flex items-center gap-1.5 px-5 py-2.5 rounded-2xl text-[11px] font-black transition-all shrink-0 uppercase tracking-wider ${activeTab === cat.id
                                    ? 'bg-gray-900 text-white shadow-xl scale-105'
                                    : 'bg-white text-gray-400 border border-gray-100 shadow-sm'
                                }`}
                        >
                            {cat.id !== 'all' && <span className="opacity-70">{cat.icon}</span>}
                            {cat.name}
                        </button>
                    ))}
                </div>
            </header>

            <main className="p-5 max-w-2xl mx-auto space-y-6">
                {loading ? (
                    <div className="py-20 text-center font-black text-gray-300 animate-pulse uppercase tracking-widest italic text-sm">
                        Receiving Alerts...
                    </div>
                ) : filteredAlerts.length === 0 ? (
                    <div className="py-24 text-center bg-white rounded-[3rem] border border-dashed border-gray-200">
                        <RiLightbulbFlashLine size={48} className="mx-auto text-gray-100 mb-4" />
                        <p className="font-black text-gray-300 italic uppercase text-xs tracking-widest">現在、進行中の速報はありません</p>
                    </div>
                ) : (
                    filteredAlerts.map((alert) => {
                        const daysLeft = getRemainingDays(alert.dateEnd);
                        return (
                            <div
                                key={alert.id}
                                onClick={() => router.push(`/premium/tasukeai/${alert.id}`)}
                                className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-100 group active:scale-[0.98] transition-all cursor-pointer"
                            >
                                <div className="relative h-56 w-full bg-gray-50 overflow-hidden">
                                    {alert.imageUrl ? (
                                        <img src={alert.imageUrl} alt={alert.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-200">
                                            <RiImageLine size={48} className="opacity-10" />
                                            <p className="text-[10px] font-black uppercase tracking-widest mt-2">No Photo</p>
                                        </div>
                                    )}
                                    <div className="absolute top-4 left-4">
                                        <span className="bg-black/50 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-black shadow-sm uppercase tracking-tighter">
                                            {alert.area}
                                        </span>
                                    </div>
                                    <div className={`absolute bottom-4 right-4 text-white px-4 py-1.5 rounded-full text-[10px] font-black italic shadow-lg flex items-center gap-1.5 ${daysLeft !== null && daysLeft <= 3 ? 'bg-red-500 animate-bounce' : 'bg-gray-900/80 backdrop-blur'
                                        }`}>
                                        <RiTimeLine size={12} />
                                        {daysLeft === 0 ? '今日まで' : daysLeft !== null && daysLeft < 0 ? '終了' : `あと${daysLeft}日`}
                                    </div>
                                </div>

                                <div className="p-6">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className={`w-2 h-2 rounded-full ${alert.category === 'food' ? 'bg-emerald-400' :
                                                alert.category === 'child' ? 'bg-pink-400' :
                                                    alert.category === 'admin' ? 'bg-purple-400' : 'bg-orange-400'
                                            }`} />
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                            {CATEGORIES.find(c => c.id === alert.category)?.name}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-black text-gray-800 leading-tight mb-3 group-hover:text-orange-600 transition-colors">
                                        {alert.title}
                                    </h3>
                                    <p className="text-sm text-gray-500 leading-relaxed mb-6 line-clamp-2 font-medium italic">
                                        {alert.description}
                                    </p>
                                    <div className="flex items-center justify-between border-t border-gray-50 pt-5">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100">
                                                <RiUserHeartLine size={18} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest">Provider</span>
                                                <span className="text-[11px] font-black text-gray-600 leading-none">{alert.provider}</span>
                                            </div>
                                        </div>
                                        <div className="text-[10px] font-black text-orange-500 uppercase flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                            Check Detail <RiArrowLeftLine className="rotate-180" size={14} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    }) // ← ここに閉じるための ) が不足していました
                )}
            </main>

            <div className="fixed bottom-8 right-8 z-[60]">
                <button
                    onClick={() => router.push('/premium/tasukeai/create')}
                    className="w-16 h-16 bg-orange-500 text-white rounded-full shadow-[0_20px_50px_rgba(249,115,22,0.3)] flex items-center justify-center active:scale-90 transition-all border-4 border-white group"
                >
                    <RiAddLine size={32} className="group-hover:rotate-90 transition-transform duration-500" />
                </button>
            </div>
        </div>
    );
}