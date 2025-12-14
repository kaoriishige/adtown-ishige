import React, { useState, useEffect, useMemo } from 'react';
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
    Firestore
} from 'firebase/firestore';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
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
    date: string;
    createdAt: any;
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

// --- Firebase設定と環境変数取得 ---
const getEnvVar = (name: string): any => {
    if (typeof window !== 'undefined' && (window as any)[name] !== undefined) {
        return (window as any)[name];
    }
    return undefined;
};


// --- メインコンポーネント ---
const AIGasPriceTrackerApp = () => {
    // Firebase Init State
    const [firebase, setFirebase] = useState<{ auth: Auth | null, db: Firestore | null, appId: string }>({ auth: null, db: null, appId: 'default-app-id' });
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

    // データ状態
    const [prices, setPrices] = useState<GasPriceEntry[]>([]);
    
    // 1. Firebase 初期化
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const firebaseConfigRaw = getEnvVar('__firebase_config');
        const initialAuthToken = getEnvVar('__initial_auth_token') || null;
        const appId = getEnvVar('__app_id') || 'default-app-id';

        if (!firebaseConfigRaw) {
            console.error("Firebase configuration not found.");
            setGlobalError("Firebase configuration not found. (Check environment variables)");
            setIsPageLoading(false);
            return;
        }

        try {
            const firebaseConfig = JSON.parse(firebaseConfigRaw);
            
            const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
            const auth = getAuth(app);
            const db = getFirestore(app);
            setFirebase({ auth, db, appId });

            const initAuth = async () => {
                try {
                    if (initialAuthToken) {
                        await signInWithCustomToken(auth, initialAuthToken as string);
                    } else {
                        await signInAnonymously(auth);
                    }
                } catch (err) {
                    console.error("Auth error:", err);
                }
            };
            
            initAuth(); 

            const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
                setUser(currentUser);
                setIsAuthReady(true);
                setIsPageLoading(false); 
            });

            return () => unsubscribe();
        } catch (e: any) {
            console.error("Firebase Init Error:", e);
            setGlobalError("Firebase initialization failed: " + e.message);
            setIsPageLoading(false);
        }
    }, []); 

    // 2. データ同期 (リアルタイム更新)
    useEffect(() => {
        const { db, appId } = firebase;
        if (!isAuthReady || !user || !db || globalError) return;
        
        // 価格データのみを取得
        const pricesRef = collection(db, 'artifacts', appId, 'users', user.uid, 'gas_prices');
        const qPrices = query(pricesRef, orderBy('date', 'desc'), orderBy('createdAt', 'desc'));    
        const unsubscribePrices = onSnapshot(qPrices, (snapshot) => {
            const fetchedPrices = snapshot.docs.map(doc => ({
                id: doc.id,
                ...(doc.data() as Omit<GasPriceEntry, 'id'>),    
            } as GasPriceEntry));
            setPrices(fetchedPrices);
        });
        
        return () => {
            unsubscribePrices();
        };
    }, [isAuthReady, user, globalError, firebase]);    

    // 3. アクション (追加・削除)
    const handleAddPrice = async (e: React.FormEvent) => {
        e.preventDefault();
        const { db, appId } = firebase;
        const priceNum = parseInt(newPrice, 10);
        
        if (!priceNum || !newStationName.trim() || !newRegion) {
            alert("入力内容を確認してください。");
            return;
        }
        if (!db || !user) {
            alert("エラー: ユーザー認証が完了していません。");
            return;
        }
        
        setIsSubmitting(true);
        try {
            await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'gas_prices'), {
                stationName: newStationName,
                price: priceNum,
                region: newRegion,
                date: currentDate,
                createdAt: serverTimestamp(),
            });
            setNewStationName(''); setNewPrice(''); setNewRegion('');
        } catch(e: any) {    
            console.error("Save Error:", e);    
            alert("保存に失敗しました: " + e.message);
        } finally {    
            setIsSubmitting(false);    
        }
    };

    const handleDelete = async (collectionName: string, id: string) => {
        const { db, appId } = firebase;
        if (!db || !user) return;
        if (!confirm('削除しますか？')) return;
        try {
            await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, collectionName, id));
        } catch(e: any) {    
            console.error("Delete Error:", e);
            alert("削除失敗: " + e.message);
        }
    };

    // 4. 計算ロジック
    // 価格ランキングのみ
    const gasPriceSummary = useMemo(() => {
        if (prices.length === 0) return [];
        const latestPrices: { [region: string]: { [name: string]: GasPriceEntry } } = {};
        
        prices.forEach(entry => {
            const current = latestPrices[entry.region]?.[entry.stationName];
            if (!current || entry.date > current.date || (entry.date === current.date && entry.createdAt > current.createdAt)) {
                if (!latestPrices[entry.region]) latestPrices[entry.region] = {};
                latestPrices[entry.region][entry.stationName] = entry;
            }
        });

        const rankings: any[] = [];
        REGIONS.forEach(r => {
            if (!r.value) return;
            const entries = Object.values(latestPrices[r.value] || {});
            if (entries.length === 0) return;
            const total = entries.reduce((sum, e) => sum + e.price, 0);
            const ranking = entries.sort((a, b) => a.price - b.price);
            rankings.push({    
                region: r.value,    
                average: total / entries.length,    
                ranking,    
                latestUpdate: entries[0].date    
            });
        });
        return rankings;
    }, [prices]);


    // 数値フォーマット関数
    const formatNum = (n: number) => new Intl.NumberFormat('ja-JP', { maximumFractionDigits: 1 }).format(n);

    if (globalError) return <div className="p-10 text-center text-red-500">Error: {globalError}</div>;
    if (isPageLoading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin w-10 h-10 text-blue-500"/></div>;

    return (
        <div className="min-h-screen bg-gray-50 font-sans pb-20">
            <header className="bg-white shadow-sm sticky top-0 z-10 p-4 border-b border-gray-200">
                <div className="max-w-xl mx-auto flex items-center justify-between">
                    <button onClick={() => window.location.href='/apps/categories'} className="p-2 hover:bg-gray-100 rounded-full">
                        <ArrowLeft size={20} className="text-gray-600" />
                    </button>
                    <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Fuel className="w-6 h-6 text-orange-500" /> 最安ガソリン
                    </h1>
                    <div className="w-8">
                        {user && firebase.auth && (
                            <button onClick={() => signOut(firebase.auth!)} title="サインアウト">
                                <Settings size={20} className="text-gray-400"/>
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-xl mx-auto p-4 sm:p-6 space-y-8">
                
                {/* 1. リンクボタン */}
                <section className="bg-blue-600 p-5 rounded-xl shadow text-white">
                    <h2 className="font-bold mb-3 flex items-center gap-2"><MapPin size={18}/> 地域別価格サイト</h2>
                    <div className="grid grid-cols-1 gap-2">
                        {GAS_PRICE_LINKS.map(l => (
    <button
        key={l.region}
        onClick={() => {
            window.open(l.url, '_blank', 'noopener,noreferrer');
        }}
        className="bg-white text-blue-600 py-2 px-4 rounded font-bold text-center block hover:bg-gray-100 flex justify-between items-center w-full"
    >
        {l.region} <ExternalLink size={16}/>
    </button>
))}

                    </div>
                </section>

                {/* 2. 価格投稿 */}
                <section className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                    <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2"><Fuel size={20}/> 価格を投稿</h2>
                    <form onSubmit={handleAddPrice} className="space-y-3">
                        <select value={newRegion} onChange={e=>setNewRegion(e.target.value as Region)} className="w-full p-2 border rounded" required>
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
                        <button type="submit" disabled={isSubmitting} className="w-full bg-orange-500 text-white py-2 rounded font-bold shadow hover:bg-orange-600">
                            {isSubmitting ? <Loader2 className="animate-spin mx-auto"/> : "投稿する"}
                        </button>
                    </form>
                </section>

                {/* 3. ランキング */}
                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Calendar size={20}/> 最新ランキング</h2>
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
                                            <button onClick={() => handleDelete('gas_prices', entry.id)} className="text-gray-300 hover:text-red-500"><Trash2 size={16}/></button>
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