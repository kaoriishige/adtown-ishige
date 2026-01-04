import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router'; 
import {
    Loader2, ArrowLeft, Fuel, Settings, MapPin, ExternalLink, Trash2, Calendar, X
} from 'lucide-react';

// --- 型定義 ---
type Region = '那須塩原市' | '大田原市' | '那須町' | '';

interface GasPriceEntry {
    id: string;
    stationName: string;
    price: number;
    region: Region;
    date: string; 
    createdAt: Date | string; 
}

interface GasPriceSummaryItem {
    region: Region;
    average: number;
    ranking: GasPriceEntry[];
    latestUpdate: string;
}

// --- 定数 ---
const REGIONS: { value: Region, label: string }[] = [
    { value: '', label: '--- 地域を選択 ---' },
    { value: '那須塩原市', label: '那須塩原市' },
    { value: '大田原市', label: '大田原市' },
    { value: '那須町', label: '那須町' },
];

const GAS_PRICE_LINKS: { region: Region, label: string, url: string }[] = [
    { region: '那須塩原市', label: '那須塩原市の価格情報サイトへ', url: 'https://gogo.gs/ranking/9?city%5B%5D=09213&span=1&submit=1' },
    { region: '大田原市', label: '大田原市の価格情報サイトへ', url: 'https://gogo.gs/ranking/9?city%5B%5D=09210&span=1&submit=1' },
    { region: '那須町', label: '那須町の価格情報サイトへ', url: 'https://gogo.gs/ranking/9?city%5B%5D=09407&span=1&submit=1' },
];

/**
 * 数値フォーマット関数
 */
const formatNum = (n: number | string): string => {
    const num = typeof n === 'string' ? parseFloat(n) : n;
    if (isNaN(num)) return 'N/A';
    return new Intl.NumberFormat('ja-JP', { maximumFractionDigits: 1, minimumFractionDigits: 0 }).format(num);
};


// --- メインコンポーネント ---
const AIGasPriceTrackerApp = () => {
    const router = useRouter(); 

    // モーダル管理用の状態
    const [externalUrl, setExternalUrl] = useState<string | null>(null);

    const [globalError] = useState<string | null>(null);
    const [isPageLoading, setIsPageLoading] = useState(true); 
    const [isSubmitting, setIsSubmitting] = useState(false); 
    const [isAuthReady, setIsAuthReady] = useState(false); 

    // 入力フォーム状態
    const [newStationName, setNewStationName] = useState('');
    const [newPrice, setNewPrice] = useState('');
    const [newRegion, setNewRegion] = useState<Region>('');
    const [currentDate, setCurrentDate] = useState(new Date().toISOString().substring(0, 10));

    const [prices, setPrices] = useState<GasPriceEntry[]>([]); 
    
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsAuthReady(true);
            setIsPageLoading(false); 
        }, 500);
        return () => clearTimeout(timer);
    }, []); 

    const handleAddPrice = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRegion || !newStationName || !newPrice) return;
        setIsSubmitting(true);
        try {
            console.log("Firebase投稿シミュレーション成功:", { newStationName, newPrice, newRegion, currentDate });
            setNewStationName('');
            setNewPrice('');
            setNewRegion('');
            setCurrentDate(new Date().toISOString().substring(0, 10));
        } catch (error) {
            alert("投稿に失敗しました。");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('本当にこの価格情報を削除しますか？')) return;
        try {
            console.log("Firebase削除シミュレーション成功:", id);
        } catch (error) {
            alert("削除に失敗しました。");
        }
    };

    const gasPriceSummary: GasPriceSummaryItem[] = useMemo(() => {
        if (prices.length === 0) return [];
        return []; 
    }, [prices]);


    if (globalError) return <div className="p-10 text-center text-red-500">Error: {globalError}</div>;
    if (isPageLoading || !isAuthReady) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin w-10 h-10 text-blue-500"/></div>;

    return (
        <div className="min-h-screen bg-gray-50 font-sans pb-20">
            <header className="bg-white shadow-md sticky top-0 z-10 p-4 border-b border-gray-200">
                <div className="max-w-xl mx-auto flex items-center justify-between">
                    <button 
                        onClick={() => router.back()} 
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ArrowLeft size={20} className="text-gray-600" />
                    </button>

                    <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Fuel className="w-6 h-6 text-orange-500 fill-orange-500" /> 最安ガソリン
                    </h1>
                    <div className="w-8">
                        <button onClick={() => console.log("設定画面へ遷移")} className="hover:bg-gray-100 rounded-full p-1 transition-colors">
                            <Settings size={20} className="text-gray-600"/>
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-xl mx-auto p-4 sm:p-6 space-y-8">
                
                {/* 1. リンクボタン (モーダルで開く) */}
                <section className="bg-blue-600 p-5 rounded-xl shadow-lg text-white">
                    <h2 className="font-bold mb-4 flex items-center gap-2 text-lg"><MapPin size={18}/> 外部価格情報サイト</h2>
                    <div className="grid grid-cols-1 gap-3">
                        {GAS_PRICE_LINKS.map(l => (
                            <button
                                key={l.region}
                                onClick={() => setExternalUrl(l.url)}
                                className="bg-white text-blue-600 py-3 px-4 rounded-lg font-extrabold text-center block hover:bg-blue-50 transition-colors flex justify-between items-center w-full shadow-md"
                            >
                                <span className="text-base">{l.region}</span>
                                <ExternalLink size={18} className="text-blue-500"/>
                            </button>
                        ))}
                    </div>
                </section>

                {/* 2. 価格投稿フォーム */}
                <section className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-700 mb-5 flex items-center gap-2">
                        <Fuel size={20} className="text-gray-500"/> 価格を投稿
                    </h2>
                    <form onSubmit={handleAddPrice} className="space-y-4">
                        <select 
                            value={newRegion} 
                            onChange={e => setNewRegion(e.target.value as Region)} 
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500" 
                            required
                        >
                            {REGIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                        <input 
                            type="text" 
                            placeholder="⛽ スタンド名 (例: ENEOS 黒磯)" 
                            value={newStationName} 
                            onChange={e=>setNewStationName(e.target.value)} 
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500" 
                            required 
                        />
                        <div className="flex gap-3">
                            <div className="relative w-2/3">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg font-bold">¥</span>
                                <input
                                    type="number"
                                    placeholder="価格(円/L)"
                                    value={newPrice}
                                    onChange={e=>setNewPrice(e.target.value)}
                                    className="w-full p-3 pl-8 border border-gray-300 rounded-lg font-bold text-lg focus:ring-green-500"
                                    required
                                    min="0"
                                    step="0.1"
                                />
                            </div>
                            <div className="relative w-1/3">
                                <Calendar size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"/>
                                <input 
                                    type="date" 
                                    value={currentDate} 
                                    onChange={e=>setCurrentDate(e.target.value)} 
                                    className="w-full p-3 pl-9 border border-gray-300 rounded-lg text-gray-600 focus:ring-blue-500" 
                                />
                            </div>
                        </div>
                        <button 
                            type="submit" 
                            disabled={isSubmitting} 
                            className={`w-full text-white py-3 rounded-lg font-bold shadow-md flex justify-center items-center gap-2 transition-colors ${
                                isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                            }`}
                        >
                            {isSubmitting ? (
                                <><Loader2 className="animate-spin w-5 h-5"/> 投稿中...</>
                            ) : (
                                '価格を投稿する'
                            )}
                        </button>
                    </form>
                </section>

                {/* 3. ランキング */}
                <section className="space-y-6">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Calendar size={20} className="text-blue-500"/> 最新ランキング
                    </h2>
                    {gasPriceSummary.length === 0 ? (
                        <p className="text-center text-gray-500 py-8 bg-white rounded-xl shadow">データがありません。最新情報を投稿してください。</p>
                    ) : (
                        gasPriceSummary.map(s => (
                            <div key={s.region} className="border border-gray-200 rounded-xl overflow-hidden shadow-lg">
                                <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
                                    <span className="font-extrabold text-xl">{s.region}</span>
                                    <div className="text-right">
                                        <span className="text-xs opacity-75 block">平均価格 (円/L)</span>
                                        <span className="text-2xl font-extrabold">{formatNum(s.average)}円</span>
                                    </div>
                                </div>
                                <div className="bg-white divide-y divide-gray-100">
                                    {s.ranking.map((entry: GasPriceEntry, i: number) => (
                                        <div key={entry.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                                            <div className="flex items-center gap-3">
                                                <span className={`w-6 h-6 flex items-center justify-center rounded-full font-extrabold text-sm ${i === 0 ? 'bg-yellow-400 text-black border-2 border-yellow-600' : 'bg-gray-200 text-gray-600'}`}>
                                                    {i + 1}
                                                </span>
                                                <div>
                                                    <p className="font-bold text-gray-800 text-base">{entry.stationName}</p>
                                                    <p className="text-xs text-gray-500">更新日: {entry.date}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl font-extrabold text-green-600 whitespace-nowrap">{formatNum(entry.price)}円</span>
                                                <button onClick={() => handleDelete(entry.id)} className="text-gray-400 hover:text-red-500 p-1"><Trash2 size={18}/></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </section>
            </main>

            {/* --- 外部サイト用 iframe モーダル --- */}
            {externalUrl && (
                <div className="fixed inset-0 z-[100] flex flex-col bg-white animate-in slide-in-from-bottom duration-300">
                    <div className="p-4 border-b flex justify-between items-center bg-white sticky top-0 z-10 shadow-sm">
                        <button onClick={() => setExternalUrl(null)} className="flex items-center text-gray-600 font-bold gap-2">
                            <ArrowLeft size={20} /> 戻る
                        </button>
                        <button onClick={() => setExternalUrl(null)} className="text-gray-300"><X size={28} /></button>
                    </div>
                    <div className="flex-1 w-full h-full overflow-hidden">
                        <iframe src={externalUrl} className="w-full h-full border-none" title="gas-price-external" />
                    </div>
                </div>
            )}

            <footer className="text-center py-6 text-xs text-gray-400 border-t mt-8">© 2026 那須地域生活AI</footer>
        </div>
    );
};

export default AIGasPriceTrackerApp;