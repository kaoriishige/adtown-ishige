"use client"; // ファイルの先頭に追加
import React, { useState, useEffect, useMemo } from 'react';
// Firebase関連のインポートは残しますが、使用しません。
import {
    getAuth,
    signInWithCustomToken,
    signInAnonymously,
    onAuthStateChanged,
    signOut,
    Auth,
    User
} from 'firebase/auth';
import {
    getFirestore,
    collection,
    addDoc,
    onSnapshot,
    query,
    serverTimestamp,
    deleteDoc,
    doc,
    orderBy,
    Firestore,
    // Timestamp のインポートは削除します
} from 'firebase/firestore';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
    Loader2, ArrowLeft, Fuel, Settings, MapPin, ExternalLink, Trash2, Calendar
} from 'lucide-react';

// --- 型定義を修正 ---
type Region = '那須塩原市' | '大田原市' | '那須町' | '';

// createdAt の型を Date | string に変更し、FirebaseのTimestampに依存しないようにします
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

// --- Firebase設定と環境変数取得（デバッグモードでは使用しません） ---
const getEnvVar = (name: string): any => {
    if (typeof window !== 'undefined' && (window as any)[name] !== undefined) {
        return (window as any)[name];
    }
    return undefined;
};

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

// --- メインコンポーネント ---
const AIGasPriceTrackerApp = () => {
    // Firebase Init State (ダミー値)
    const [firebase, setFirebase] = useState<{ auth: Auth | null, db: Firestore | null, appId: string }>({ auth: null, db: null, appId: 'dummy-app-id' });
    const [globalError, setGlobalError] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);

    // Loading States
    const [isPageLoading, setIsPageLoading] = useState(true); 
    const [isSubmitting, setIsSubmitting] = useState(false); 
    const [isAuthReady, setIsAuthReady] = useState(false);
    
    // 入力フォーム状態
    const [newStationName, setNewStationName] = useState('');
    const [newPrice, setNewPrice] = useState('');
    const [newRegion, setNewRegion] = useState<Region>('');
    const [currentDate, setCurrentDate] = useState(new Date().toISOString().substring(0, 10));

    // データ状態 - UIテスト用にダミーデータをセット
    const [prices, setPrices] = useState<GasPriceEntry[]>([
        // createdAt を ISO文字列（Dateの代わりに）に修正
        { id: 'd1', stationName: 'ダミーSS 1号店', price: 160, region: '那須塩原市', date: '2025-12-15', createdAt: new Date().toISOString() },
        { id: 'd2', stationName: 'ダミーSS 2号店', price: 165, region: '那須塩原市', date: '2025-12-14', createdAt: new Date().toISOString() },
        { id: 'd3', stationName: 'ダミーSS 3号店', price: 170, region: '大田原市', date: '2025-12-16', createdAt: new Date().toISOString() },
    ]);
    
    // 1. Firebase 初期化 (LIFF/Firebase認証を無視してUIを強制表示する)
    useEffect(() => {
        // ダミーのユーザー情報と初期化完了を設定
        // uidに値を設定することで、アプリのメインUIレンダリングを許可します
        setUser({ uid: 'anonymous-user-id', email: 'dummy@example.com', displayName: 'Dummy User' } as User); 
        
        // ローディングをすぐに解除し、UIを表示する
        setIsAuthReady(true);
        setIsPageLoading(false); 
        
        console.warn("WARN: Firebase connection is disabled. UI is forced to display.");

        return; 
    }, []); 

    // 2. データ同期 (データフェッチを停止)
    useEffect(() => {
        if (!isAuthReady || !user || globalError) return;
        return () => {}; // onSnapshot 購読をスキップ
    }, [isAuthReady, user, globalError, firebase]); 

    // 3. アクション (追加・削除) - 機能停止の警告に変更
    const handleAddPrice = async (e: React.FormEvent) => {
        e.preventDefault();
        alert("機能停止中: 認証が無効なため、データの追加はできません。画面表示確認用です。");
        console.log("Add attempted:", { newStationName, newPrice, newRegion, currentDate });
    };

    const handleDelete = async (collectionName: string, id: string) => {
        alert("機能停止中: 認証が無効なため、データの削除はできません。画面表示確認用です。");
        console.log("Delete attempted for ID:", id);
    };

    // 4. 計算ロジック (ダミーデータで動作)
    const gasPriceSummary: GasPriceSummaryItem[] = useMemo(() => {
        if (prices.length === 0) return [];
        
        // 1. 地域別・スタンド名別の最新価格のみを抽出
        const latestPrices: { [region: string]: { [name: string]: GasPriceEntry } } = {};
        
        prices.forEach(entry => {
            if (!entry.region) return; 
            
            const current = latestPrices[entry.region]?.[entry.stationName];
            
            // createdAt を比較するために Dateオブジェクトに変換（stringの場合）
            const entryTime = entry.createdAt instanceof Date ? entry.createdAt.getTime() : new Date(entry.createdAt).getTime();
            const currentTime = current?.createdAt instanceof Date ? current.createdAt.getTime() : (current?.createdAt ? new Date(current.createdAt).getTime() : 0);

            // 最新のエントリを判定 (日付が最新、または日付が同じなら createdAt が最新)
            if (!current || 
                entry.date > current.date || 
                (entry.date === current.date && entryTime > currentTime)) 
            {
                if (!latestPrices[entry.region]) latestPrices[entry.region] = {};
                latestPrices[entry.region][entry.stationName] = entry;
            }
        });

        // 2. ランキングと平均を計算
        const rankings: GasPriceSummaryItem[] = [];
        REGIONS.forEach(r => {
            if (!r.value) return; 
            
            const entries = Object.values(latestPrices[r.value] || {});
            if (entries.length === 0) return;
            
            const total = entries.reduce((sum, e) => sum + e.price, 0);
            
            const ranking = entries.sort((a, b) => a.price - b.price); 
            
            rankings.push({ 
                region: r.value, 
                average: total / entries.length, 
                ranking: ranking, 
                latestUpdate: ranking[0].date
            });
        });
        return rankings;
    }, [prices]);


    // 数値フォーマット関数
    const formatNum = (n: number | string): string => {
        const num = typeof n === 'string' ? parseFloat(n) : n;
        if (isNaN(num)) return 'N/A';
        return new Intl.NumberFormat('ja-JP', { maximumFractionDigits: 1 }).format(num);
    };

    if (globalError) return <div className="p-10 text-center text-red-500">Error: {globalError}</div>;
    if (isPageLoading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin w-10 h-10 text-blue-500"/></div>;

    // --- ここからUI描画 ---
    return (
        <div className="min-h-screen bg-gray-50 font-sans pb-20">
            <header className="bg-white shadow-sm sticky top-0 z-10 p-4 border-b border-gray-200">
                <div className="max-w-xl mx-auto flex items-center justify-between">
                    <button 
                        onClick={() => openUrl('/apps/categories', true)} 
                        className="p-2 hover:bg-gray-100 rounded-full"
                    >
                        <ArrowLeft size={20} className="text-gray-600" />
                    </button>
                    <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Fuel className="w-6 h-6 text-orange-500" /> 最安ガソリン (デバッグモード)
                    </h1>
                    <div className="w-8">
                        {/* 認証が無効なため、設定ボタンは機能しません */}
                        <button onClick={() => alert("デバッグモードのため認証機能は停止しています。")} title="設定">
                            <Settings size={20} className="text-gray-400"/>
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-xl mx-auto p-4 sm:p-6 space-y-8">
                
                {/* 強制表示の警告 */}
                <div className="p-3 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-lg">
                    <p className="font-bold">🚨 警告: デバッグモード</p>
                    <p className="text-sm">LINE認証とデータ同期を停止し、UIを強制表示しています。機能（投稿・削除）は使えません。</p>
                </div>
                
                {/* 1. リンクボタン */}
                <section className="bg-blue-600 p-5 rounded-xl shadow text-white">
                    <h2 className="font-bold mb-3 flex items-center gap-2"><MapPin size={18}/> 地域別価格サイト</h2>
                    <div className="grid grid-cols-1 gap-2">
                        {GAS_PRICE_LINKS.map(l => (
                            <button
                                key={l.region}
                                onClick={() => openUrl(l.url)}
                                className="bg-white text-blue-600 py-2 px-4 rounded font-bold text-center block hover:bg-gray-100 flex justify-between items-center w-full"
                            >
                                {l.region} <ExternalLink size={16}/>
                            </button>
                        ))}
                    </div>
                </section>

                {/* 2. 価格投稿 */}
                <section className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                    <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2"><Fuel size={20}/> 価格を投稿 (機能停止中)</h2>
                    <form onSubmit={handleAddPrice} className="space-y-3">
                        <select 
                            value={newRegion} 
                            onChange={e => setNewRegion(e.target.value as Region)} 
                            className="w-full p-2 border rounded" 
                            required
                        >
                            {REGIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                        <input type="text" placeholder="スタンド名 (例: ENEOS 黒磯)" value={newStationName} onChange={e=>setNewStationName(e.target.value)} className="w-full p-2 border rounded" required />
                        <div className="flex gap-2">
                            <input
                                type="number"
                                placeholder="価格(円/L)"
                                value={newPrice}
                                onChange={e=>setNewPrice(e.target.value)}
                                className="w-2/3 p-2 border rounded font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                required
                            />
                            <input type="date" value={currentDate} onChange={e=>setCurrentDate(e.target.value)} className="w-1/3 p-2 border rounded text-gray-500" />
                        </div>
                        <button type="submit" disabled={isSubmitting} className="w-full bg-gray-500 text-white py-2 rounded font-bold shadow cursor-not-allowed">
                            投稿する (機能停止中)
                        </button>
                    </form>
                </section>

                {/* 3. ランキング */}
                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Calendar size={20}/> 最新ランキング (ダミーデータ)</h2>
                    {gasPriceSummary.length === 0 ? <p className="text-center text-gray-500 py-4">データがありません</p> : gasPriceSummary.map(s => (
                        <div key={s.region} className="border rounded-lg overflow-hidden shadow">
                            <div className="bg-gray-800 text-white p-3 flex justify-between items-center">
                                <span className="font-bold">{s.region}</span>
                                <span className="text-xs opacity-75">平均: {formatNum(s.average)}円</span>
                            </div>
                            <div className="bg-white">
                                {s.ranking.map((entry: GasPriceEntry, i: number) => (
                                    <div key={entry.id} className="p-3 border-b flex justify-between items-center">
                                        <div>
                                            <span className={`text-xs px-2 py-0.5 rounded font-bold mr-2 ${i===0 ? 'bg-yellow-400 text-black':'bg-gray-200 text-gray-600'}`}>{i===0 ? '最安' : i+1}</span>
                                            <span className="font-bold text-gray-800">{entry.stationName}</span>
                                            <p className="text-xs text-gray-400">{entry.date}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl font-bold text-green-600">{entry.price}円</span>
                                            <button onClick={() => handleDelete('gas_prices', entry.id)} className="text-gray-300 hover:text-red-500 cursor-not-allowed"><Trash2 size={16}/></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </section>
            </main>
            <footer className="text-center py-6 text-xs text-gray-400">© 2025 那須地域生活AI</footer>
        </div>
    );
};

export default AIGasPriceTrackerApp;