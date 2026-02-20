import { useState, useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import * as LucideIcons from 'lucide-react';

export default function BulkBuyCalc() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'compare' | 'consumption'>('compare');

    // --- State for Comparison ---
    const [itemA, setItemA] = useState({ price: '', amount: '' });
    const [itemB, setItemB] = useState({ price: '', amount: '' });

    // --- State for Consumption ---
    const [bulkItem, setBulkItem] = useState({ price: '', amount: '' });
    const [dailyUse, setDailyUse] = useState('');

    // --- Calculation: Comparison ---
    const comparisonResult = useMemo(() => {
        const priceA = parseFloat(itemA.price);
        const amountA = parseFloat(itemA.amount);
        const priceB = parseFloat(itemB.price);
        const amountB = parseFloat(itemB.amount);

        if (!priceA || !amountA || !priceB || !amountB) return null;

        const unitPriceA = priceA / amountA;
        const unitPriceB = priceB / amountB;

        let cheaper = '';
        let diff = 0;
        let diffPercent = 0;

        if (unitPriceA < unitPriceB) {
            cheaper = 'A';
            diff = (unitPriceB - unitPriceA) * amountB; // Saving if you bought B's amount at A's rate? No, simpler: Saving per unit * B's amount
            // Actually, let's show "If you buy B's amount at A's price, you save X"
            // Better: "A is X% cheaper per unit"
            diffPercent = ((unitPriceB - unitPriceA) / unitPriceB) * 100;
        } else if (unitPriceB < unitPriceA) {
            cheaper = 'B';
            diffPercent = ((unitPriceA - unitPriceB) / unitPriceA) * 100;
        } else {
            cheaper = 'same';
        }

        return {
            unitPriceA,
            unitPriceB,
            cheaper,
            diffPercent
        };
    }, [itemA, itemB]);

    // --- Calculation: Consumption ---
    const consumptionResult = useMemo(() => {
        const price = parseFloat(bulkItem.price);
        const amount = parseFloat(bulkItem.amount);
        const use = parseFloat(dailyUse);

        if (!price || !amount || !use) return null;

        const daysLasting = Math.floor(amount / use);
        const costPerDay = (price / amount) * use;
        const monthlyCost = costPerDay * 30;

        return {
            daysLasting,
            costPerDay,
            monthlyCost
        };
    }, [bulkItem, dailyUse]);

    const handleClearComparison = () => {
        setItemA({ price: '', amount: '' });
        setItemB({ price: '', amount: '' });
    };

    return (
        <div className="min-h-screen bg-[#FFFDFC] text-[#5D5757] font-sans">
            <Head>
                <title>まとめ買いお得チェック - みんなのNasuアプリ</title>
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
            </Head>

            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-rose-50 px-6 py-4 flex items-center gap-3 shadow-sm">
                <button 
                    onClick={() => router.back()}
                    className="w-10 h-10 rounded-full bg-rose-50 text-rose-400 flex items-center justify-center active:scale-95 transition-all"
                >
                    <LucideIcons.ChevronLeft size={24} />
                </button>
                <h1 className="text-lg font-black text-[#5D5757] tracking-tight">まとめ買いお得チェック</h1>
            </header>

            <main className="p-6 max-w-md mx-auto pb-24 space-y-8">

                {/* Tab Switcher */}
                <div className="bg-rose-50/50 p-1.5 rounded-full flex relative">
                    <button
                        onClick={() => setActiveTab('compare')}
                        className={`flex-1 py-2.5 rounded-full text-xs font-black transition-all z-10 relative ${activeTab === 'compare' ? 'bg-white text-rose-400 shadow-sm' : 'text-gray-400'}`}
                    >
                        どっちがお得？
                    </button>
                    <button
                        onClick={() => setActiveTab('consumption')}
                        className={`flex-1 py-2.5 rounded-full text-xs font-black transition-all z-10 relative ${activeTab === 'consumption' ? 'bg-white text-rose-400 shadow-sm' : 'text-gray-400'}`}
                    >
                        どれくらい持つ？
                    </button>
                </div>

                {/* --- CONTENT: COMPARISON --- */}
                {activeTab === 'compare' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        {/* Result Card */}
                        <div className={`rounded-[2.5rem] p-8 text-center transition-all duration-500 shadow-lg border-4 ${
                            !comparisonResult ? 'bg-white border-white' : 
                            comparisonResult.cheaper === 'A' ? 'bg-rose-50 border-rose-200' :
                            comparisonResult.cheaper === 'B' ? 'bg-blue-50 border-blue-200' :
                            'bg-gray-50 border-white'
                        }`}>
                            {!comparisonResult ? (
                                <div className="py-4 opacity-50">
                                    <LucideIcons.Scale size={48} className="mx-auto text-gray-300 mb-3" />
                                    <p className="text-sm font-bold">金額と内容量を入力して比較</p>
                                </div>
                            ) : comparisonResult.cheaper === 'same' ? (
                                <div>
                                    <p className="text-lg font-black text-gray-500">どちらも同じ単価です</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">お得なのは...</p>
                                    <div className="flex items-center justify-center gap-2">
                                        <span className={`text-6xl font-black tracking-tighter ${comparisonResult.cheaper === 'A' ? 'text-rose-500' : 'text-blue-500'}`}>
                                            {comparisonResult.cheaper === 'A' ? 'A' : 'B'}
                                        </span>
                                        <span className="text-xl font-bold text-gray-400">の商品</span>
                                    </div>
                                    <div className={`inline-block px-4 py-1 rounded-full text-xs font-black ${
                                        comparisonResult.cheaper === 'A' ? 'bg-rose-100 text-rose-500' : 'bg-blue-100 text-blue-500'
                                    }`}>
                                        約 {comparisonResult.diffPercent.toFixed(1)}% オトク！
                                    </div>
                                </div>
                            )}
                            
                            {/* Annual Savings Simulation */}
                            {comparisonResult && comparisonResult.cheaper !== 'same' && (
                                <div className="mt-6 bg-yellow-50/80 rounded-2xl p-4 border border-yellow-200">
                                    <div className="flex items-center gap-2 mb-3 justify-center">
                                        <LucideIcons.PiggyBank className="text-yellow-500" size={18} />
                                        <p className="text-xs font-bold text-yellow-600">年間でこれくらい節約！</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-white rounded-xl p-3 shadow-sm">
                                            <p className="text-[10px] font-bold text-gray-400 mb-1">週1回買うと...</p>
                                            <p className="text-sm font-black text-yellow-500">
                                                年間 <span className="text-lg text-[#5D5757]">¥{Math.round(
                                                    (comparisonResult.cheaper === 'A' 
                                                        ? (comparisonResult.unitPriceB - comparisonResult.unitPriceA) * parseFloat(itemA.amount) 
                                                        : (comparisonResult.unitPriceA - comparisonResult.unitPriceB) * parseFloat(itemB.amount)) * 52
                                                ).toLocaleString()}</span>
                                            </p>
                                        </div>
                                        <div className="bg-white rounded-xl p-3 shadow-sm">
                                            <p className="text-[10px] font-bold text-gray-400 mb-1">月1回買うと...</p>
                                            <p className="text-sm font-black text-yellow-500">
                                                年間 <span className="text-lg text-[#5D5757]">¥{Math.round(
                                                    (comparisonResult.cheaper === 'A' 
                                                        ? (comparisonResult.unitPriceB - comparisonResult.unitPriceA) * parseFloat(itemA.amount) 
                                                        : (comparisonResult.unitPriceA - comparisonResult.unitPriceB) * parseFloat(itemB.amount)) * 12
                                                ).toLocaleString()}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-[9px] text-gray-400 mt-2 text-center">※お得な方の商品（{comparisonResult.cheaper === 'A' ? 'A' : 'B'}）を継続して購入した場合の試算</p>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Item A */}
                            <div className={`bg-white rounded-[2rem] p-5 border-2 transition-all ${comparisonResult?.cheaper === 'A' ? 'border-rose-400 shadow-md ring-4 ring-rose-50' : 'border-white shadow-sm'}`}>
                                <h3 className="text-center font-black text-rose-400 mb-4 bg-rose-50 rounded-full py-1 text-sm">商品 A</h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 pl-2 block mb-1">価格 (円)</label>
                                        <input
                                            type="number"
                                            value={itemA.price}
                                            onChange={(e) => setItemA({ ...itemA, price: e.target.value })}
                                            className="w-full bg-gray-50 rounded-xl px-4 py-3 font-bold text-lg text-center focus:outline-none focus:ring-2 focus:ring-rose-200"
                                            placeholder="0"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 pl-2 block mb-1">内容量 (g/ml/個)</label>
                                        <input
                                            type="number"
                                            value={itemA.amount}
                                            onChange={(e) => setItemA({ ...itemA, amount: e.target.value })}
                                            className="w-full bg-gray-50 rounded-xl px-4 py-3 font-bold text-lg text-center focus:outline-none focus:ring-2 focus:ring-rose-200"
                                            placeholder="0"
                                        />
                                    </div>
                                    {comparisonResult && (
                                        <div className="text-center pt-2 border-t border-gray-100">
                                            <p className="text-[10px] text-gray-400">単価</p>
                                            <p className="font-bold text-sm">{comparisonResult.unitPriceA.toFixed(2)}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Item B */}
                            <div className={`bg-white rounded-[2rem] p-5 border-2 transition-all ${comparisonResult?.cheaper === 'B' ? 'border-blue-400 shadow-md ring-4 ring-blue-50' : 'border-white shadow-sm'}`}>
                                <h3 className="text-center font-black text-blue-400 mb-4 bg-blue-50 rounded-full py-1 text-sm">商品 B</h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 pl-2 block mb-1">価格 (円)</label>
                                        <input
                                            type="number"
                                            value={itemB.price}
                                            onChange={(e) => setItemB({ ...itemB, price: e.target.value })}
                                            className="w-full bg-gray-50 rounded-xl px-4 py-3 font-bold text-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-200"
                                            placeholder="0"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 pl-2 block mb-1">内容量 (g/ml/個)</label>
                                        <input
                                            type="number"
                                            value={itemB.amount}
                                            onChange={(e) => setItemB({ ...itemB, amount: e.target.value })}
                                            className="w-full bg-gray-50 rounded-xl px-4 py-3 font-bold text-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-200"
                                            placeholder="0"
                                        />
                                    </div>
                                    {comparisonResult && (
                                        <div className="text-center pt-2 border-t border-gray-100">
                                            <p className="text-[10px] text-gray-400">単価</p>
                                            <p className="font-bold text-sm">{comparisonResult.unitPriceB.toFixed(2)}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Clear Button */}
                        <button 
                            onClick={handleClearComparison}
                            className="w-full py-4 text-xs font-bold text-gray-400 bg-white rounded-xl border border-gray-100 shadow-sm active:scale-95 transition-all"
                        >
                            リセット
                        </button>
                    </div>
                )}

                {/* --- CONTENT: CONSUMPTION --- */}
                {activeTab === 'consumption' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="bg-white rounded-[2.5rem] p-6 shadow-lg border border-white space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-rose-400 pl-2 block mb-1">まとめ買い価格 (円)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-3.5 text-rose-300 font-bold">¥</span>
                                        <input
                                            type="number"
                                            value={bulkItem.price}
                                            onChange={(e) => setBulkItem({ ...bulkItem, price: e.target.value })}
                                            className="w-full bg-rose-50 rounded-2xl pl-8 pr-4 py-3 font-bold text-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-rose-200"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-rose-400 pl-2 block mb-1">内容量 (g/個)</label>
                                    <input
                                        type="number"
                                        value={bulkItem.amount}
                                        onChange={(e) => setBulkItem({ ...bulkItem, amount: e.target.value })}
                                        className="w-full bg-rose-50 rounded-2xl px-4 py-3 font-bold text-lg text-gray-700 text-center focus:outline-none focus:ring-2 focus:ring-rose-200"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-rose-400 pl-2 block mb-1">1日の使用量目安</label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        value={dailyUse}
                                        onChange={(e) => setDailyUse(e.target.value)}
                                        className="flex-1 bg-white border-2 border-rose-100 rounded-2xl px-4 py-3 font-bold text-lg text-center focus:outline-none focus:ring-2 focus:ring-rose-200"
                                        placeholder="例: 100"
                                    />
                                    <div className="flex items-center text-xs font-bold text-gray-400">g/個</div>
                                </div>
                            </div>
                        </div>

                        {/* Result Area */}
                        {consumptionResult && (
                            <div className="bg-gradient-to-br from-rose-400 to-pink-500 rounded-[2.5rem] p-8 text-white text-center shadow-xl shadow-rose-200">
                                <p className="text-xs font-bold text-rose-100 mb-2 uppercase tracking-widest">使える期間</p>
                                <div className="flex items-baseline justify-center gap-1 mb-6">
                                    <span className="text-6xl font-black tracking-tighter">{consumptionResult.daysLasting}</span>
                                    <span className="text-xl font-bold">日分</span>
                                </div>

                                <div className="grid grid-cols-2 gap-4 bg-white/20 backdrop-blur-md rounded-2xl p-4">
                                    <div>
                                        <p className="text-[10px] font-bold text-rose-100 mb-1">1日あたり</p>
                                        <p className="text-lg font-black">¥{Math.round(consumptionResult.costPerDay)}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-rose-100 mb-1">1ヶ月コスト</p>
                                        <p className="text-lg font-black">¥{Math.round(consumptionResult.monthlyCost).toLocaleString()}</p>
                                    </div>
                                </div>

                                {consumptionResult.daysLasting > 30 && (
                                    <div className="mt-4 px-4 py-2 bg-yellow-400/90 rounded-xl text-yellow-900 text-[11px] font-black flex items-center justify-center gap-2">
                                        <LucideIcons.AlertTriangle size={14} />
                                        食品の場合は賞味いつ期限に注意！
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

            </main>
        </div>
    );
}

