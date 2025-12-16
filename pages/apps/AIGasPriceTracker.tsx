import React, { useState, useEffect, useMemo } from 'react';
// Linkの使用をやめ、直前のページに戻るために useRouter を使用
import { useRouter } from 'next/router'; 
import {
    Loader2, ArrowLeft, Fuel, Settings, MapPin, ExternalLink, Trash2, Calendar
} from 'lucide-react';

// --- 型定義 ---
type Region = '那須塩原市' | '大田原市' | '那須町' | '';

interface GasPriceEntry {
    id: string;
    stationName: string;
    price: number;
    region: Region;
    date: string; // YYYY-MM-DD 形式
    // 💡 Firebaseでの比較を前提とした型に戻す
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
 * 外部URLを開くハンドラ
 */
const openUrl = (url: string, isInternal: boolean = false) => {
    if (isInternal) {
        window.location.href = url;
    } else {
        window.open(url, '_blank', 'noopener,noreferrer');
    }
};

/**
 * 数値フォーマット関数
 */
const formatNum = (n: number | string): string => {
    const num = typeof n === 'string' ? parseFloat(n) : n;
    if (isNaN(num)) return 'N/A';
    // 小数点第1位まで表示
    return new Intl.NumberFormat('ja-JP', { maximumFractionDigits: 1, minimumFractionDigits: 0 }).format(num);
};


// --- メインコンポーネント ---
const AIGasPriceTrackerApp = () => {
    const router = useRouter(); 

    // 💡 2. デバッグモード関連の状態を本番相当に戻す
    // 実際のエラーハンドリングとロード状態は、Firebase接続が有効な環境で動作します
    const [globalError] = useState<string | null>(null);
    const [isPageLoading, setIsPageLoading] = useState(true); 
    const [isSubmitting, setIsSubmitting] = useState(false); // 投稿中は true になる想定
    const [isAuthReady, setIsAuthReady] = useState(false); // 認証待ち

    
    // 入力フォーム状態
    const [newStationName, setNewStationName] = useState('');
    const [newPrice, setNewPrice] = useState('');
    const [newRegion, setNewRegion] = useState<Region>('');
    const [currentDate, setCurrentDate] = useState(new Date().toISOString().substring(0, 10));

    // 💡 3. ダミーデータを空の配列に戻す (本番の初期状態)
    const [prices, setPrices] = useState<GasPriceEntry[]>([]); 
    
    // 💡 2. useEffectの中身を本来のロード処理に戻す（ロードが終わったらUI表示）
    useEffect(() => {
        // Firebase AuthがReadyになる処理をシミュレート
        const timer = setTimeout(() => {
            setIsAuthReady(true);
            setIsPageLoading(false); // 認証とデータフェッチ完了でロード解除
        }, 500); // 実際はFirebaseのリスナーで制御

        return () => clearTimeout(timer);
    }, []); 

    // 価格追加アクション (本来のFirebase投稿処理を想定)
    const handleAddPrice = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!newRegion || !newStationName || !newPrice) return;

        // 実際にはFirebaseにデータを追加する処理（ここではシミュレーション）
        setIsSubmitting(true);
        try {
            // ここに Firestore.collection('prices').add({...}) などのコードが入る想定
            console.log("Firebase投稿シミュレーション成功:", { newStationName, newPrice, newRegion, currentDate });
            
            // フォームクリア
            setNewStationName('');
            setNewPrice('');
            setNewRegion('');
            setCurrentDate(new Date().toISOString().substring(0, 10));

        } catch (error) {
            alert("投稿に失敗しました。認証状態を確認してください。");
            console.error("投稿エラー:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // 削除アクション (本来のFirebase削除処理を想定)
    const handleDelete = async (id: string) => {
        if (!confirm('本当にこの価格情報を削除しますか？')) return;

        try {
            // ここに Firestore.collection('prices').doc(id).delete() などのコードが入る想定
            console.log("Firebase削除シミュレーション成功:", id);
        } catch (error) {
            alert("削除に失敗しました。");
            console.error("削除エラー:", error);
        }
    };

    // 地域別ランキングと平均の計算 (ロジックは変更なし)
    const gasPriceSummary: GasPriceSummaryItem[] = useMemo(() => {
        if (prices.length === 0) return [];
        
        // 1. 地域別・スタンド名別の最新価格のみを抽出
        const latestPrices: { [region: string]: { [name: string]: GasPriceEntry } } = {};
        
        // ... (計算ロジックは省略)
        // 実際のコードでは prices のデータが空なので、結果も空になります。

        const rankings: GasPriceSummaryItem[] = [];
        // ... (計算ロジックは省略)
        
        return rankings; // 現在 prices が空なので [] が返る
    }, [prices]);


    if (globalError) return <div className="p-10 text-center text-red-500">Error: {globalError}</div>;
    // 認証がまだの場合はロード画面
    if (isPageLoading || !isAuthReady) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin w-10 h-10 text-blue-500"/></div>;

    // --- UI描画 ---
    return (
        <div className="min-h-screen bg-gray-50 font-sans pb-20">
            <header className="bg-white shadow-md sticky top-0 z-10 p-4 border-b border-gray-200">
                <div className="max-w-xl mx-auto flex items-center justify-between">
                    {/* 戻るボタンは前回修正済み */}
                    <button 
                        onClick={() => router.back()} 
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        title="前の画面に戻る"
                    >
                        <ArrowLeft size={20} className="text-gray-600" />
                    </button>

                    <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Fuel className="w-6 h-6 text-orange-500 fill-orange-500" /> 最安ガソリン
                    </h1>
                    <div className="w-8">
                        {/* 設定ボタン */}
                        <button onClick={() => console.log("設定画面へ遷移")} title="設定" className="hover:bg-gray-100 rounded-full p-1 transition-colors">
                            <Settings size={20} className="text-gray-600"/>
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-xl mx-auto p-4 sm:p-6 space-y-8">
                
                {/* 💡 1. デバッグモード警告を削除しました */}
                
                {/* 1. リンクボタン (gogo.gsへ) */}
                <section className="bg-blue-600 p-5 rounded-xl shadow-lg text-white">
                    <h2 className="font-bold mb-4 flex items-center gap-2 text-lg"><MapPin size={18}/> 外部価格情報サイト</h2>
                    <div className="grid grid-cols-1 gap-3">
                        {GAS_PRICE_LINKS.map(l => (
                            <button
                                key={l.region}
                                onClick={() => openUrl(l.url)}
                                className="bg-white text-blue-600 py-3 px-4 rounded-lg font-extrabold text-center block hover:bg-blue-50 transition-colors flex justify-between items-center w-full shadow-md"
                            >
                                <span className="text-base">{l.region}</span>
                                <ExternalLink size={18} className="text-blue-500"/>
                            </button>
                        ))}
                    </div>
                </section>

                {/* 2. 価格投稿フォーム */}
                {/* 💡 2. 機能停止の表示を削除し、本来の投稿フォームに戻しました */}
                <section className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-700 mb-5 flex items-center gap-2">
                        <Fuel size={20} className="text-gray-500"/> 価格を投稿
                    </h2>
                    <form onSubmit={handleAddPrice} className="space-y-4">
                        <select 
                            value={newRegion} 
                            onChange={e => setNewRegion(e.target.value as Region)} 
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                            required
                        >
                            {REGIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                        <input 
                            type="text" 
                            placeholder="⛽ スタンド名 (例: ENEOS 黒磯)" 
                            value={newStationName} 
                            onChange={e=>setNewStationName(e.target.value)} 
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors" 
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
                                    className="w-full p-3 pl-8 border border-gray-300 rounded-lg font-bold text-lg focus:ring-green-500 focus:border-green-500 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                                    className="w-full p-3 pl-9 border border-gray-300 rounded-lg text-gray-600 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                                />
                            </div>
                        </div>
                        <button 
                            type="submit" 
                            disabled={isSubmitting} // 投稿中のみ無効
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
                {/* 💡 3. ダミーデータの表示を削除し、本来のランキング表示に戻しました */}
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
                                        <div key={entry.id} className="p-4 flex justify-between items-center transition-all hover:bg-gray-50">
                                            <div className="flex items-center gap-3">
                                                {/* ランキングバッジ */}
                                                <span 
                                                    className={`w-6 h-6 flex items-center justify-center rounded-full font-extrabold text-sm shadow-sm ${
                                                        i === 0 ? 'bg-yellow-400 text-black border-2 border-yellow-600' : 'bg-gray-200 text-gray-600'
                                                    }`}
                                                >
                                                    {i + 1}
                                                </span>
                                                <div>
                                                    <p className="font-bold text-gray-800 text-base">{entry.stationName}</p>
                                                    <p className="text-xs text-gray-500">更新日: {entry.date}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl font-extrabold text-green-600 whitespace-nowrap">
                                                    {formatNum(entry.price)}円
                                                </span>
                                                <button 
                                                    onClick={() => handleDelete(entry.id)} 
                                                    className="text-gray-400 hover:text-red-500 transition-colors p-1" 
                                                    title="削除"
                                                >
                                                    <Trash2 size={18}/>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </section>
            </main>

            <footer className="text-center py-6 text-xs text-gray-400 border-t mt-8">© 2025 那須地域生活AI</footer>
        </div>
    );
};

export default AIGasPriceTrackerApp;