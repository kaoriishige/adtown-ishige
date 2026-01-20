import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { db } from '@/lib/firebase'; // Firebaseの設定ファイルをインポート
import {
    collection,
    addDoc,
    query,
    orderBy,
    onSnapshot,
    deleteDoc,
    doc,
    serverTimestamp
} from 'firebase/firestore';
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
    createdAt: any;
}

interface GasPriceSummaryItem {
    region: Region;
    average: number;
    ranking: GasPriceEntry[];
}

const REGIONS: { value: Region, label: string }[] = [
    { value: '', label: '--- 地域を選択 ---' },
    { value: '那須塩原市', label: '那須塩原市' },
    { value: '大田原市', label: '大田原市' },
    { value: '那須町', label: '那須町' },
];

const GAS_PRICE_LINKS = [
    { region: '那須塩原市', url: 'https://gogo.gs/ranking/9?city%5B%5D=09213&span=1&submit=1' },
    { region: '大田原市', url: 'https://gogo.gs/ranking/9?city%5B%5D=09210&span=1&submit=1' },
    { region: '那須町', url: 'https://gogo.gs/ranking/9?city%5B%5D=09407&span=1&submit=1' },
];

const formatNum = (n: number | string): string => {
    const num = typeof n === 'string' ? parseFloat(n) : n;
    return isNaN(num) ? 'N/A' : new Intl.NumberFormat('ja-JP').format(num);
};

const AIGasPriceTrackerApp = () => {
    const router = useRouter();
    const [externalUrl, setExternalUrl] = useState<string | null>(null);
    const [isPageLoading, setIsPageLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [prices, setPrices] = useState<GasPriceEntry[]>([]);

    // 入力フォーム
    const [newStationName, setNewStationName] = useState('');
    const [newPrice, setNewPrice] = useState('');
    const [newRegion, setNewRegion] = useState<Region>('');
    const [currentDate, setCurrentDate] = useState(new Date().toISOString().substring(0, 10));

    // 1. リアルタイムデータの取得
    useEffect(() => {
        const q = query(collection(db, "gas_prices"), orderBy("date", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const priceData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as GasPriceEntry[];
            setPrices(priceData);
            setIsPageLoading(false);
        }, (error) => {
            console.error("Firestore Listen Error:", error);
            setIsPageLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // 2. 投稿処理（本番）
    const handleAddPrice = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRegion || !newStationName || !newPrice) {
            alert("すべての項目を入力してください");
            return;
        }
        setIsSubmitting(true);
        try {
            await addDoc(collection(db, "gas_prices"), {
                region: newRegion,
                stationName: newStationName,
                price: parseFloat(newPrice),
                date: currentDate,
                createdAt: serverTimestamp()
            });
            // フォームリセット
            setNewStationName('');
            setNewPrice('');
            alert("投稿が完了しました！");
        } catch (error) {
            console.error("Post Error:", error);
            alert("投稿に失敗しました。権限を確認してください。");
        } finally {
            setIsSubmitting(false);
        }
    };

    // 3. 削除処理
    const handleDelete = async (id: string) => {
        if (!confirm('削除しますか？')) return;
        try {
            await deleteDoc(doc(db, "gas_prices", id));
        } catch (error) {
            alert("削除権限がありません。");
        }
    };

    // 4. ランキング計算
    const gasPriceSummary: GasPriceSummaryItem[] = useMemo(() => {
        const regions: Region[] = ['那須塩原市', '大田原市', '那須町'];
        return regions.map(reg => {
            const regPrices = prices.filter(p => p.region === reg)
                .sort((a, b) => a.price - b.price);
            const avg = regPrices.length > 0
                ? regPrices.reduce((sum, p) => sum + p.price, 0) / regPrices.length
                : 0;
            return { region: reg, average: avg, ranking: regPrices.slice(0, 5) };
        }).filter(s => s.ranking.length > 0);
    }, [prices]);

    if (isPageLoading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin w-10 h-10 text-blue-500" /></div>;

    return (
        <div className="min-h-screen bg-gray-50 font-sans pb-20">
            <header className="bg-white shadow-md sticky top-0 z-10 p-4 border-b border-gray-200">
                <div className="max-w-xl mx-auto flex items-center justify-between">
                    <button onClick={() => window.location.href = '/premium/dashboard'} className="p-2 hover:bg-gray-100 rounded-full"><ArrowLeft size={20} /></button>
                    <h1 className="text-xl font-bold flex items-center gap-2"><Fuel className="text-orange-500" /> 最安ガソリン</h1>
                    <Settings size={20} className="text-gray-400" />
                </div>
            </header>

            <main className="max-w-xl mx-auto p-4 space-y-8">
                {/* リンク */}
                <section className="bg-blue-600 p-5 rounded-xl text-white shadow-lg">
                    <h2 className="font-bold mb-4 flex items-center gap-2"><MapPin size={18} /> 外部サイトを確認</h2>
                    <div className="grid gap-2">
                        {GAS_PRICE_LINKS.map(l => (
                            <button key={l.region} onClick={() => setExternalUrl(l.url)} className="bg-white text-blue-600 p-3 rounded-lg font-bold flex justify-between">
                                {l.region} <ExternalLink size={18} />
                            </button>
                        ))}
                    </div>
                </section>

                {/* 投稿フォーム */}
                <section className="bg-white p-6 rounded-xl shadow-md border">
                    <h2 className="text-lg font-bold mb-4">価格を投稿</h2>
                    <form onSubmit={handleAddPrice} className="space-y-4">
                        <select value={newRegion} onChange={e => setNewRegion(e.target.value as Region)} className="w-full p-3 border rounded-lg">
                            {REGIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                        <input type="text" placeholder="スタンド名" value={newStationName} onChange={e => setNewStationName(e.target.value)} className="w-full p-3 border rounded-lg" />
                        <div className="flex gap-2">
                            <input type="number" step="0.1" placeholder="価格" value={newPrice} onChange={e => setNewPrice(e.target.value)} className="flex-1 p-3 border rounded-lg font-bold" />
                            <input type="date" value={currentDate} onChange={e => setCurrentDate(e.target.value)} className="w-1/3 p-3 border rounded-lg text-sm" />
                        </div>
                        <button disabled={isSubmitting} className="w-full bg-green-600 text-white py-4 rounded-lg font-bold shadow-lg disabled:bg-gray-400">
                            {isSubmitting ? "投稿中..." : "この内容で投稿する"}
                        </button>
                    </form>
                </section>

                {/* ランキング表示 */}
                <section className="space-y-6">
                    {gasPriceSummary.map(s => (
                        <div key={s.region} className="bg-white rounded-xl overflow-hidden shadow-md border">
                            <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
                                <span className="font-bold">{s.region}</span>
                                <span className="text-xl font-black">{formatNum(s.average)}円<small className="text-[10px] ml-1 opacity-70">Avg</small></span>
                            </div>
                            <div className="divide-y">
                                {s.ranking.map((entry, i) => (
                                    <div key={entry.id} className="p-4 flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
                                            <div>
                                                <p className="font-bold text-sm">{entry.stationName}</p>
                                                <p className="text-[10px] text-gray-400">{entry.date}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-black text-green-600">{entry.price}円</span>
                                            <button onClick={() => handleDelete(entry.id)} className="text-gray-300 hover:text-red-500"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </section>
            </main>

            {/* モーダル */}
            {externalUrl && (
                <div className="fixed inset-0 z-[100] flex flex-col bg-white">
                    <div className="p-4 border-b flex justify-between items-center">
                        <button onClick={() => setExternalUrl(null)} className="flex items-center gap-2 font-bold"><ArrowLeft size={20} /> 戻る</button>
                        <X onClick={() => setExternalUrl(null)} />
                    </div>
                    <iframe src={externalUrl} className="flex-1 w-full border-none" />
                </div>
            )}
        </div>
    );
};

export default AIGasPriceTrackerApp;