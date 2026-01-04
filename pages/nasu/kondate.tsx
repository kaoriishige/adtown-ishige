/* global __app_id, __firebase_config, __initial_auth_token, __api_key */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, User } from 'firebase/auth';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { ShoppingCart, Flame, Loader2, ThumbsUp, ArrowLeft, Utensils, Zap } from 'lucide-react';

// --- 型定義 ---
interface Recipe {
    name: string;
    catchphrase: string;
    ingredients: string[];
    steps: string[];
    cookingTime: string;
    tips: string;
}

interface MenuResult {
    menuConcept: string;
    totalSavings: string;
    mainDishes: Recipe[];
    sideDishes: Recipe[];
    shoppingList: string[];
}

// --- 環境変数の取得 ---
const getEnvVar = (name: string): any => {
    if (typeof window !== 'undefined' && (window as any)[name]) {
        return (window as any)[name];
    }
    return undefined;
};

// Firebase設定
const firebaseConfigRaw = process.env.NEXT_PUBLIC_FIREBASE_CONFIG || getEnvVar('__firebase_config');
const firebaseConfig = firebaseConfigRaw ? (typeof firebaseConfigRaw === 'string' ? JSON.parse(firebaseConfigRaw) : firebaseConfigRaw) : {};
const initialAuthToken = getEnvVar('__initial_auth_token') || null;

// Gemini API のエンドポイント
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent`;

// --- 店舗情報 ---
const SALE_DATA_BY_AREA: { [area: string]: { [store: string]: { url: string } } } = {
    "那須塩原市": {
        "ザ・ビッグ 那須店": { url: "https://tokubai.co.jp/%E3%82%B6%E3%83%BB%E3%83%93%E3%83%83%E3%82%B0/12250" },
        "ヨークベニマル 上厚崎店": { url: "https://tokubai.co.jp/%E3%83%A8%E3%83%BC%E3%82%AF%E3%83%99%E3%83%8B%E3%83%9E%E3%83%AB/170882" },
        "ヨークベニマル 那須塩原店": { url: "https://tokubai.co.jp/%E3%83%A8%E3%83%BC%E3%82%AF%E3%83%99%E3%83%8B%E3%83%9E%E3%83%AB/9591" },
        "とりせん 黒磯店": { url: "https://tokubai.co.jp/%E3%81%A8%E3%82%8A%E3%81%9B%E3%82%93/5530" },
        "ベイシア 那須塩原店": { url: "https://tokubai.co.jp/%E3%83%99%E3%82%A4%E3%82%B7%E3%82%A2/3996" },
        "ヨークベニマル 黒磯店": { url: "https://tokubai.co.jp/%E3%83%A8%E3%83%BC%E3%82%AF%E3%83%99%E3%83%8B%E3%83%9E%E3%83%AB/9593" },
        "ダイユー 鍋掛店": { url: "https://tokubai.co.jp/%E3%83%80%E3%82%A4%E3%83%A6%E3%83%BC/257634" },
        "ダイユー 若松店": { url: "https://tokubai.co.jp/%E3%83%80%E3%82%A4%E3%83%A6%E3%83%BC/257635" },
        "ダイユー 中央店": { url: "https://tokubai.co.jp/%E3%83%80%E3%82%A4%E3%83%A6%E3%83%BC/257633" },
        "とりせん 上厚崎店": { url: "https://tokubai.co.jp/%E3%81%A8%E3%82%8A%E3%81%9B%E3%82%93/279610" },
        "ダイユー 黒田原店": { url: "https://tokubai.co.jp/%E3%83%80%E3%82%A4%E3%83%A6%E3%83%BC/257637" },
        "ダイユー 東那須店": { url: "https://tokubai.co.jp/%E3%83%80%E3%82%A4%E3%83%A6%E3%83%BC/257636" },
        "ザ・ビッグエクストラ 那須塩原店": { url: "https://tokubai.co.jp/%E3%82%B6%E3%83%BB%E3%83%93%E3%83%83%E3%82%B0%E3%82%A8%E3%82%AF%E3%82%B9%E3%83%88%E3%83%A9/12241" },
        "リオン・ドール 西那須野店": { url: "https://tokubai.co.jp/%E3%83%AA%E3%82%AA%E3%83%B3%E3%83%BB%E3%83%89%E3%83%BC%E3%83%AB/257632" },
        "ヨークベニマル 西那須野店": { url: "https://tokubai.co.jp/%E3%83%A8%E3%83%BC%E3%82%AF%E3%83%99%E3%83%8B%E3%83%9E%E3%83%AB/9589" },
        "ヨークベニマル 西富山店": { url: "https://tokubai.co.jp/%E3%83%A8%E3%83%BC%E3%82%AF%E3%83%99%E3%83%8B%E3%83%9E%E3%83%AB/227875" }
    },
    "大田原市": {
        "ヨークベニマル 大田原店": { url: "https://tokubai.co.jp/%E3%83%A8%E3%83%BC%E3%82%AF%E3%83%99%E3%83%8B%E3%83%9E%E3%83%AB/9597" },
        "たいらや 大田原本町店": { url: "https://tokubai.co.jp/%E3%81%9F%E3%81%84%E3%82%89%E3%82%84/173987" },
        "ベイシア 大田原店": { url: "https://tokubai.co.jp/%E3%83%99%E3%82%A4%E3%82%B7%E3%82%A2/4068" },
        "ヨークベニマル 大田原住吉店": { url: "https://tokubai.co.jp/%E3%83%A8%E3%83%BC%E3%82%AF%E3%83%99%E3%83%8B%E3%83%9E%E3%83%AB/42986" },
        "たいらや 中田原店": { url: "https://tokubai.co.jp/%E3%81%9F%E3%81%84%E3%82%89%E3%82%84/264880" },
        "リオン・ドール 元町店": { url: "https://tokubai.co.jp/%E3%83%AA%E3%82%AA%E3%83%B3%E3%83%BB%E3%83%89%E3%83%BC%E3%83%AB/257631" },
        "ダイユー 野崎店": { url: "https://tokubai.co.jp/%E3%83%80%E3%82%A4%E3%83%A6%E3%83%BC/257639" },
        "リオン・ドール 黒羽店": { url: "https://tokubai.co.jp/%E3%83%AA%E3%82%AA%E3%83%B3%E3%83%BB%E3%83%89%E3%83%BC%E3%83%AB/172474" },
        "ダイユー 黒羽店": { url: "https://tokubai.co.jp/%E3%83%80%E3%82%A4%E3%83%A6%E3%83%BC/257638" }
    },
    "那須町": {
        "ザ・ビッグ 那須店": { url: "https://tokubai.co.jp/%E3%82%B6%E3%83%BB%E3%83%93%E3%83%83%E3%82%B0/12250" }
    }
};

// --- JSONスキーマ定義 ---
const RECIPE_SCHEMA = {
    type: "OBJECT",
    properties: {
        menuConcept: { type: "STRING", description: "「なぜこの献立がお得で素晴らしいのか」を、プロの視点とメリットを交えて語る説明文。" },
        totalSavings: { type: "STRING", description: "在庫消費による食費の抑制や、安価な食材でのカサ増しなど、節約の論理的な根拠。" },
        mainDishes: {
            type: "ARRAY",
            description: "主菜3品",
            items: {
                type: "OBJECT",
                properties: {
                    name: { type: "STRING" },
                    catchphrase: { type: "STRING" },
                    ingredients: { type: "ARRAY", items: { type: "STRING" } },
                    steps: { type: "ARRAY", items: { type: "STRING" } },
                    cookingTime: { type: "STRING" },
                    tips: { type: "STRING" }
                },
                required: ["name", "catchphrase", "ingredients", "steps", "cookingTime", "tips"]
            }
        },
        sideDishes: {
            type: "ARRAY",
            description: "副菜3品",
            items: {
                type: "OBJECT",
                properties: {
                    name: { type: "STRING" },
                    catchphrase: { type: "STRING" },
                    ingredients: { type: "ARRAY", items: { type: "STRING" } },
                    steps: { type: "ARRAY", items: { type: "STRING" } },
                    cookingTime: { type: "STRING" },
                    tips: { type: "STRING" }
                },
                required: ["name", "catchphrase", "ingredients", "steps", "cookingTime", "tips"]
            }
        },
        shoppingList: {
            type: "ARRAY",
            items: { type: "STRING" }
        }
    },
    required: ["menuConcept", "totalSavings", "mainDishes", "sideDishes", "shoppingList"]
};

const FAMILY_SIZE_OPTIONS = ["1人", "2人", "3人", "4人", "5人以上", "大人2人, 子供1人", "大人2人, 子供2人", "大人2人, 子供3人", "大人3人, 子供1人", "その他"];

// --- UI Components ---
const RecipeCard = ({ recipe, type, familySize }: { recipe: Recipe, type: 'main' | 'side', familySize: string }) => (
    <div className="border p-4 rounded-xl bg-white shadow-lg mb-4">
        <h3 className={`text-xl font-extrabold mb-2 ${type === 'main' ? 'text-red-700' : 'text-green-700'} flex items-center gap-2`}>
            {type === 'main' ? <Utensils className="w-5 h-5" /> : <Zap className="w-5 h-5" />} {recipe.name}
        </h3>
        <p className="text-sm italic text-gray-500 mb-3 border-l-2 border-gray-200 pl-2">&quot;{recipe.catchphrase}&quot;</p>
        <div className="space-y-4 text-sm">
            <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                <h4 className="font-bold text-red-700 mb-1 flex items-center gap-1">
                    <ShoppingCart className="w-4 h-4" /> 材料 ({familySize})
                </h4>
                <ul className="list-disc list-inside ml-4 text-gray-700 space-y-0.5">
                    {recipe.ingredients.map((ing, i) => <li key={i}>{ing}</li>)}
                </ul>
            </div>
            <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                <h4 className="font-bold text-green-700 mb-1 flex items-center gap-1">
                    <Flame className="w-4 h-4" /> 作り方 ({recipe.cookingTime})
                </h4>
                <ol className="list-decimal list-inside ml-4 text-gray-700 space-y-1">
                    {recipe.steps.map((step, i) => <li key={i}>{step}</li>)}
                </ol>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg text-xs text-gray-700 border border-yellow-200 font-medium border-l-4 border-yellow-400">
                💡 **プロのコツ**: <span className="font-bold text-gray-800">{recipe.tips}</span>
            </div>
        </div>
    </div>
);

const KondateApp = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [areas] = useState(Object.keys(SALE_DATA_BY_AREA));
    const [selectedArea, setSelectedArea] = useState(areas[0]);
    const [finalStoreSelection, setFinalStoreSelection] = useState<string | null>(null);
    const [activeStore, setActiveStore] = useState<string | null>(null);
    const [fridgeInventory, setFridgeInventory] = useState('');
    const [customIngredients, setCustomIngredients] = useState('');
    const [familySize, setFamilySize] = useState('大人2人, 子供2人');
    const [menuResult, setMenuResult] = useState<MenuResult | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [uiMessage, setUiMessage] = useState('');
    const [checkedItems, setCheckedItems] = useState<{[key: string]: boolean}>({});

    const storesInArea = useMemo(() => SALE_DATA_BY_AREA[selectedArea] ? Object.keys(SALE_DATA_BY_AREA[selectedArea]) : [], [selectedArea]);

    useEffect(() => {
        document.title = "那須こんだて | 節約レシピ提案";
        const initAuth = async () => {
            if (!firebaseConfig || Object.keys(firebaseConfig).length === 0) { setLoading(false); return; }
            try {
                const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
                const authService = getAuth(app);
                onAuthStateChanged(authService, async (user) => {
                    if (!user) {
                        try {
                            if (initialAuthToken) await signInWithCustomToken(authService, initialAuthToken as string);
                            else await signInAnonymously(authService);
                        } catch (e) { console.error("Auth failed:", e); }
                    }
                    setLoading(false);
                });
            } catch (e: any) { setError(`初期化エラー: ${e.message}`); setLoading(false); }
        };
        initAuth();
    }, []);

    useEffect(() => {
        if (storesInArea.length > 0) {
            setFinalStoreSelection(storesInArea[0]);
            setActiveStore(storesInArea[0]);
        }
    }, [selectedArea, storesInArea]);

    const fetchWithBackoff = async (options: RequestInit, maxRetries = 3) => {
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || (window as any).__api_key;
        if (!apiKey) throw new Error("APIキーが見つかりません。");
        const urlWithKey = `${API_URL}?key=${apiKey}`;
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const response = await fetch(urlWithKey, options);
                if (response.ok) return response;
                if (response.status === 429 && attempt < maxRetries - 1) {
                    await new Promise(res => setTimeout(res, 2000 * (attempt + 1)));
                    continue;
                }
                throw new Error(`API Error: ${response.status}`);
            } catch (e) {
                if (attempt === maxRetries - 1) throw e;
                await new Promise(res => setTimeout(res, 1000 * (attempt + 1)));
            }
        }
        throw new Error("Max retries");
    };

    const generateMenu = async () => {
        setIsGenerating(true); setMenuResult(null); setUiMessage(''); setCheckedItems({});
        const systemPrompt = `あなたは那須地域（${selectedArea}）の「一流レストラン出身の節約シェフ」です。スーパー「${finalStoreSelection}」の特売品を活用し、在庫「${fridgeInventory || 'なし'}」を使い切る、${familySize}用の主菜3品・副菜3品の最高に美味しく節約できる献立を提案してください。クックパッドよりもプロらしい火入れや香りのコツを重視し、論理的な節約根拠を示してください。`;
        try {
            const response = await fetchWithBackoff({
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: "最高の節約献立をJSONで出力してください。" }] }],
                    systemInstruction: { parts: [{ text: systemPrompt }] },
                    generationConfig: { responseMimeType: "application/json", responseSchema: RECIPE_SCHEMA }
                })
            });
            const result = await response.json();
            const jsonText = result.candidates?.[0]?.content?.parts?.[0]?.text;
            if (jsonText) {
                setMenuResult(JSON.parse(jsonText));
                setUiMessage('献立の提案が完了しました！');
            }
        } catch (e: any) { setUiMessage(`エラー: ${e.message}`); }
        finally { setIsGenerating(false); }
    };

    const handleBack = () => {
        if (menuResult) setMenuResult(null);
        else if (typeof window !== 'undefined') window.history.back();
    };

    // --- 【成功コード】履歴を積み、同一タブで遷移することでブラウザの「戻る」を殺さない ---
    const openFlyer = (url: string) => {
        if (typeof window !== 'undefined') {
            // 現在のURLを履歴に積み、同一ウィンドウで遷移
            window.history.pushState(null, '', window.location.href);
            window.location.href = url;
        }
    };

    if (loading) return <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 p-4"><Loader2 className="w-10 h-10 text-nasu-green animate-spin mb-3" /><p>読み込み中...</p></div>;
    if (error) return <div className="p-4 text-red-600 bg-red-50 m-4 rounded-lg">⚠️ {error}</div>;

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-800 pb-20">
            <style jsx global>{`
                .text-nasu-green { color: #38761D; }
                .bg-nasu-green { background-color: #38761D; }
                .bg-nasu-light { background-color: #F7FFF7; }
                .border-nasu-green { border-color: #38761D; }
                .shadow-nasu-green { box-shadow: 0 4px 6px -1px rgba(56, 118, 29, 0.3); }
                .sticky-top { position: sticky; top: 0; z-index: 20; }
            `}</style>

            <header className="bg-white shadow-md sticky-top p-4">
                <div className="max-w-4xl mx-auto flex items-center gap-3">
                    <button onClick={handleBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ArrowLeft size={24} className="text-gray-600" /></button>
                    <h1 className="text-xl sm:text-2xl font-extrabold text-nasu-green">💰 AI献立＆特売ナビ「那須こんだて」</h1>
                </div>
            </header>

            <main className="max-w-4xl mx-auto p-4 sm:p-6">
                <div className="bg-nasu-light p-4 rounded-xl border border-nasu-green/30 shadow-md mb-8">
                    <p className="font-semibold text-nasu-green mb-1">一流シェフの技術を家庭へ！</p>
                    <p className="text-gray-700 text-sm">特売情報をAIが分析し、今日イチお得な献立を提案します。</p>
                </div>

                {!menuResult ? (
                    <section className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-200">
                        <h2 className="text-xl font-bold mb-4 border-b pb-2">献立生成の条件設定</h2>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">1. エリアを選ぶ</label>
                                <select value={selectedArea} onChange={(e) => setSelectedArea(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white text-lg font-semibold">
                                    {areas.map(a => <option key={a} value={a}>{a}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">2. スーパーを選ぶ (クリックでチラシ確認)</label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {storesInArea.map(s => (
                                        <button key={s} onClick={() => { setActiveStore(s); setFinalStoreSelection(s); }} className={`p-2 text-sm border-2 rounded-lg ${s === finalStoreSelection ? 'bg-nasu-green text-white border-nasu-green font-bold' : 'bg-gray-50 border-gray-300'}`}>{s}</button>
                                    ))}
                                </div>
                            </div>

                            {activeStore && (
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                                    <h3 className="text-sm font-bold text-blue-800 mb-2">チラシ情報: {activeStore}</h3>
                                    <button onClick={() => openFlyer(SALE_DATA_BY_AREA[selectedArea][activeStore].url)} className="w-full py-2 bg-blue-600 text-white font-bold rounded-lg shadow-md">トクバイでチラシをチェック 📰</button>
                                    <p className="mt-2 text-[10px] text-blue-700">※チラシサイトへ移動します。ブラウザの「戻る」でここへ戻れます。</p>
                                </div>
                            )}

                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">3. 人数</label>
                                    <select value={familySize} onChange={(e) => setFamilySize(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white">
                                        {FAMILY_SIZE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">4. 在庫</label>
                                    <textarea value={fridgeInventory} onChange={(e) => setFridgeInventory(e.target.value)} rows={1} placeholder="例: 豚肉, 玉ねぎ" className="w-full px-3 py-2 border rounded-lg"></textarea>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">5. 特売・要望</label>
                                <textarea value={customIngredients} onChange={(e) => setCustomIngredients(e.target.value)} rows={2} placeholder="例: 鶏肉が激安だった" className="w-full px-3 py-2 border rounded-lg"></textarea>
                            </div>
                            <button onClick={generateMenu} disabled={isGenerating} className="w-full py-3 bg-nasu-green text-white text-lg font-bold rounded-lg shadow-nasu-green disabled:opacity-50">
                                {isGenerating ? <span className="flex items-center justify-center"><Loader2 className="animate-spin mr-2" />考案中...</span> : 'AIプロシェフに献立を提案してもらう'}
                            </button>
                        </div>
                    </section>
                ) : (
                    <section className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">提案結果</h2>
                            <button onClick={() => setMenuResult(null)} className="text-blue-600 font-medium">やり直す</button>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-1 border-r pr-6">
                                <h2 className="text-xl font-bold mb-4">🛍️ 買い物リスト</h2>
                                <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
                                    <h3 className="text-sm font-extrabold flex items-center gap-1 mb-1"><ThumbsUp size={14} /> シェフの狙い</h3>
                                    <p className="text-xs text-gray-700 mb-2">{menuResult.menuConcept}</p>
                                    <p className="text-xs font-bold text-red-600">✅ 節約根拠: {menuResult.totalSavings}</p>
                                </div>
                                <ul className="space-y-2">
                                    {menuResult.shoppingList.map((item, i) => (
                                        <li key={i} onClick={() => setCheckedItems(prev => ({...prev, [item]: !prev[item]}))} className={`p-2 rounded border cursor-pointer ${checkedItems[item] ? 'bg-green-100 line-through text-gray-400' : 'bg-gray-50'}`}>{item}</li>
                                    ))}
                                </ul>
                            </div>
                            <div className="lg:col-span-2 space-y-6">
                                <div>
                                    <h2 className="text-xl font-extrabold text-red-700 mb-4 border-b-2 border-red-100 pb-1">メインディッシュ (主菜)</h2>
                                    {menuResult.mainDishes.map((r, i) => <RecipeCard key={i} recipe={r} type="main" familySize={familySize} />)}
                                </div>
                                <div>
                                    <h2 className="text-xl font-extrabold text-green-700 mb-4 border-b-2 border-green-100 pb-1">ヘルシーサイド (副菜)</h2>
                                    {menuResult.sideDishes.map((r, i) => <RecipeCard key={i} recipe={r} type="side" familySize={familySize} />)}
                                </div>
                            </div>
                        </div>
                    </section>
                )}
                {uiMessage && <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-nasu-green text-white px-6 py-2 rounded-full shadow-xl z-50 animate-bounce">{uiMessage}</div>}
            </main>
        </div>
    );
};

export default KondateApp;