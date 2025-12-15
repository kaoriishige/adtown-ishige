/* global __app_id, __firebase_config, __initial_auth_token, __api_key */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { ShoppingCart, Flame, Loader2, ThumbsUp, ArrowLeft } from 'lucide-react'; 
import liff from '@line/liff'; 

// --- 環境変数の取得 ---
const getEnvVar = (name: string) => {
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

// --- 店舗情報 (特殊文字を修正済み) ---
const SALE_DATA_BY_AREA: any = {
    "那須塩原市": {
        "ザ・ビッグ 那須店": { url: "https://tokubai.co.jp/%E3%82%B6%E3%83%BB%E3%83%93%E3%83%83%E3%82%B0/12250" },
        "ヨークベニマル 上厚崎店": { url: "https://tokubai.co.jp/%E3%83%A8%E3%83%BC%E3%82%AF%E3%83%99%E3%83%8B%E3%83%9E%E3%83%AB/170882" },
        "ヨークベニマル 那須塩原店": { url: "https://tokubai.co.jp/%E3%83%A8%E3%83%BC%E3%82%AF%E3%83%99%E3%83%8B%E3%83%9E%E3%83%AB/9591" },
        "ヨークベニマル 黒磯店": { url: "https://tokubai.co.jp/%E3%83%A8%E3%83%BC%E3%82%AF%E3%83%99%E3%83%8B%E3%83%9E%E3%83%AB/9593" },
        "とりせん 黒磯店": { url: "https://tokubai.co.jp/%E3%81%A8%E3%82%8A%E3%81%9B%E3%82%93/5530" },
        "とりせん 上厚崎店": { url: "https://tokubai.co.jp/%E3%81%A8%E3%82%8A%E3%81%9B%E3%82%93/279610" },
        "ダイユー 中央店": { url: "https://tokubai.co.jp/%E3%83%80%E3%82%A4%E3%83%A6%E3%83%BC/257633" },
        "ダイユー 若松店": { url: "https://tokubai.co.jp/%E3%83%80%E3%82%A4%E3%83%A6%E3%83%BC/257635" },
        "ダイユー 鍋掛店": { url: "https://tokubai.co.jp/%E3%83%80%E3%82%A4%E3%83%A6%E3%83%BC/257634" },
        "ダイユー 東那須店": { url: "https://tokubai.co.jp/%E3%83%80%E3%82%A4%E3%83%A6%E3%83%BC/257636" },
        "ザ・ビッグエクストラ 那須塩原店": { url: "https://tokubai.co.jp/%E3%82%B6%E3%83%BB%E3%83%93%E3%83%83%E3%82%B0%E3%82%A8%E3%82%AF%E3%82%B9%E3%83%88%E3%83%A9/12241" },
        "ヨークベニマル 西那須野店": { url: "https://tokubai.co.jp/%E3%83%A8%E3%83%BC%E3%82%AF%E3%83%99%E3%83%8B%E3%83%9E%E3%83%AB/9589" },
        "ヨークベニマル 西富山店": { url: "https://tokubai.co.jp/%E3%83%A8%E3%83%BC%E3%82%AF%E3%83%99%E3%83%8B%E3%83%9E%E3%83%AB/227875" },
        "ベイシア 那須塩原店": { url: "https://tokubai.co.jp/%E3%83%99%E3%82%A4%E3%82%B7%E3%82%A2/3996" },
        "リオン・ドール 西那須野店": { url: "https://tokubai.co.jp/%E3%83%AA%E3%82%AA%E3%83%B3%E3%83%BB%E3%83%89%E3%83%BC%E3%83%AB/257632" },
    },
    "大田原市": {
        "ヨークベニマル 大田原店": { url: "https://tokubai.co.jp/%E3%83%A8%E3%83%BC%E3%82%AF%E3%83%99%E3%83%8B%E3%83%9E%E3%83%AB/9597" },
        "ヨークベニマル 大田原住吉店": { url: "https://tokubai.co.jp/%E3%83%A8%E3%83%BC%E3%82%AF%E3%83%99%E3%83%8B%E3%83%9E%E3%83%AB/42986" },
        "たいらや 大田原本町店": { url: "https://tokubai.co.jp/%E3%81%9F%E3%81%84%E3%82%89%E3%82%84/173987" },
        "ベイシア 大田原店": { url: "https://tokubai.co.jp/%E3%83%99%E3%82%A4%E3%82%B7%E3%82%A2/4068" },
        "リオン・ドール 元町店": { url: "https://tokubai.co.jp/%E3%83%AA%E3%82%AA%E3%83%B3%E3%83%BB%E3%83%89%E3%83%BC%E3%83%AB/257631" },
        "たいらや 中田原店": { url: "https://tokubai.co.jp/%E3%81%9F%E3%81%84%E3%82%89%E3%82%84/264880" },
        "ダイユー 野崎店": { url: "https://tokubai.co.jp/%E3%83%80%E3%82%A4%E3%83%A6%E3%83%BC/257639" },
        "ダイユー 黒羽店": { url: "https://tokubai.co.jp/%E3%83%80%E3%82%A4%E3%83%A6%E3%83%BC/257638" },
        "リオン・ドール 黒羽店": { url: "https://tokubai.co.jp/%E3%83%AA%E3%82%AA%E3%83%B3%E3%83%BB%E3%83%89%E3%83%BC%E3%83%AB/172474" },
    },
    "那須町": {
        "ザ・ビッグ 那須店": { url: "https://tokubai.co.jp/%E3%82%B6%E3%83%BB%E3%83%93%E3%83%83%E3%82%B0/12250" }
    }
};

// --- JSONスキーマ定義 (特殊文字を修正済み) ---
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
                    name: { type: "STRING", description: "料理名" },
                    catchphrase: { type: "STRING", description: "「ご飯が止まらない！」「レンジで簡単！」などの魅力的なキャッチコピー" },
                    ingredients: { type: "ARRAY", items: { type: "STRING" }, description: "材料と正確な分量 (例: 豚こま肉 200g, 玉ねぎ 1個)" },
                    steps: { type: "ARRAY", items: { type: "STRING" }, description: "初心者でも絶対に失敗しない、具体的で親切な調理手順" },
                    cookingTime: { type: "STRING" },
                    tips: { type: "STRING", description: "プロの視点でのコツ（火入れの温度、香りの引き出し方など）" }
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
            description: "在庫を考慮し、買い足す必要のある食材だけのリスト",
            items: { type: "STRING" }
        }
    },
    required: ["menuConcept", "totalSavings", "mainDishes", "sideDishes", "shoppingList"]
};

// --- 家族構成の選択肢 ---
const FAMILY_SIZE_OPTIONS = [
    "1人",
    "2人",
    "3人",
    "4人",
    "5人以上",
    "大人2人, 子供1人",
    "大人2人, 子供2人",
    "大人2人, 子供3人",
    "大人3人, 子供1人",
    "その他（詳細を要望欄へ）"
];

const App = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [areas] = useState(Object.keys(SALE_DATA_BY_AREA));
    const [selectedArea, setSelectedArea] = useState(areas[0]);
    const [finalStoreSelection, setFinalStoreSelection] = useState<string | null>(null); 
    const [activeStore, setActiveStore] = useState<string | null>(null);

    const storesInArea = useMemo(() => {
        return SALE_DATA_BY_AREA[selectedArea] ? Object.keys(SALE_DATA_BY_AREA[selectedArea]) : [];
    }, [selectedArea]);

    const [fridgeInventory, setFridgeInventory] = useState('');
    const [customIngredients, setCustomIngredients] = useState(''); 
    const [familySize, setFamilySize] = useState('大人2人, 子供2人'); 
    
    const [menuResult, setMenuResult] = useState<any>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [uiMessage, setUiMessage] = useState('');
    const [checkedItems, setCheckedItems] = useState<{[key: string]: boolean}>({});

    // タイトル設定
    useEffect(() => {
        document.title = "那須こんだて | 節約レシピ提案";
    }, []);

    // エリア変更時や初期ロード時の店舗選択ロジック
    useEffect(() => {
        if (storesInArea.length > 0) {
            const firstStore = storesInArea[0];
            setFinalStoreSelection(firstStore);
            setActiveStore(firstStore);
        } else {
            setFinalStoreSelection(null);
            setActiveStore(null);
        }
    }, [selectedArea, storesInArea]);

    useEffect(() => {
        const initAuth = async () => {
            if (!firebaseConfig || Object.keys(firebaseConfig).length === 0) {
                setLoading(false);
                return;
            }
            try {
                const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
                const authService = getAuth(app);
                onAuthStateChanged(authService, async (user) => {
                    if (!user) {
                        try {
                            if (initialAuthToken) { await signInWithCustomToken(authService, initialAuthToken as string); } 
                            else { await signInAnonymously(authService); }
                        } catch (e) { console.error("Auth failed:", e); }
                    }
                    setLoading(false);
                });
            } catch (e: any) {
                console.error("Firebase error:", e);
                setError(`初期化エラー: ${e.message}`);
                setLoading(false);
            }
        };
        initAuth();
    }, []);

    const fetchWithBackoff = async (options: RequestInit, maxRetries = 3) => {
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || (window as any).__api_key;
        if (!apiKey) throw new Error("APIキーが見つかりません。");
        const urlWithKey = `${API_URL}?key=${apiKey}`;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const response = await fetch(urlWithKey, options);
                if (response.ok) return response;
                if (response.status === 429 && attempt < maxRetries - 1) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    continue;
                }
                const errText = await response.text();
                throw new Error(`API Error: ${response.status} ${errText}`);
            } catch (e) {
                if (attempt === maxRetries - 1) throw e;
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        throw new Error("Max retries reached");
    };

    const generateMenu = async () => {
        setIsGenerating(true);
        setMenuResult(null);
        setUiMessage('');
        setCheckedItems({}); 

        if (!finalStoreSelection || !selectedArea) {
            setUiMessage('エリアとスーパーを選択してください。');
            setIsGenerating(false);
            return;
        }

        const storeName = finalStoreSelection;
        const servings = familySize.trim();
        const areaName = selectedArea;
        const inventory = fridgeInventory.trim();
        const customPrompt = customIngredients.trim();
        
        // プロンプトの更新: プロの料理人目線に強化
        const systemPrompt = `あなたは那須地域（${areaName}）の「一流レストラン出身の節約シェフ」です。
        ユーザーは「安く済ませたいが、家庭料理として最高の満足度と豊かな見た目を求めている」と思っています。
        その願いを叶える、魔法のような献立を提案してください。

        【今回のミッション】
        1. **主菜3品** と **副菜3品** のレシピを提案すること。
        2. **スーパー**: ${storeName} の特売品（コストパフォーマンスに優れた食材）をフル活用すること。
        3. **在庫**: ${inventory} を優先的に使い切ること。
        4. **人数**: ${servings}
        5. **要望**: ${customPrompt}

        【出力の必須条件 - クックパッドとの差別化】
        - **ベネフィット（menuConcept）**: なぜこの献立なのか？どうしてお得なのか？**この献立を選ぶとクックパッドの一般的なレシピと比べて、プロの視点でこんなに美味しくなる**という点を熱く語ってください。
        - **レシピ詳細**: 
            - **分量**: 「適量」禁止。「小さじ1」「200g」など具体的に。
            - **手順**: **プロが意識する「火入れのタイミング」「香りの引き出し方」「食感を残すコツ」**を盛り込み、初心者でも失敗しないよう具体的に描写してください。
        - **コツ（tips）**: 「この工程を省くと不味くなる」「余ったらお弁当にできる」など、プロならではのアドバイスを入れてください。
        
        【節約効果の指示】
        - **totalSavings**: 金額ではなく、**在庫消費による食費の抑制**や**安価な食材でのカサ増し**など、節約の論理的な根拠を具体的に説明してください。

        出力は以下のJSONフォーマットに従ってください。
        `;
        
        const userQuery = `最高の節約献立（主菜3品、副菜3品）とそのレシピ詳細、買い物リストをJSON形式で出力してください。`;

        try {
            const payload = {
                contents: [{ parts: [{ text: userQuery }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] },
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: RECIPE_SCHEMA,
                },
            };

            const response = await fetchWithBackoff({
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            const jsonText = result.candidates?.[0]?.content?.parts?.[0]?.text;

            if (jsonText) {
                try {
                    const parsedJson = JSON.parse(jsonText);
                    setMenuResult(parsedJson);
                } catch (e) {
                    console.error("Failed to parse JSON response:", jsonText, e);
                    setUiMessage('AIからの応答を解析できませんでした。再度お試しください。');
                }
            } else {
                console.error("API response missing JSON text:", result);
                setUiMessage('献立の生成に失敗しました。AIの応答がありませんでした。');
            }

        } catch (e: any) {
            console.error("API call error:", e);
            if (e.message.includes('Failed to fetch')) {
                 setUiMessage('🔴 接続エラー: Failed to fetch。ネットワーク接続またはCORS設定を確認してください。');
            } else if (e.message.includes('APIキーが見つかりません')) {
                setUiMessage('⚠️ 開発者向け: Gemini APIキーが環境変数にありません。AI機能が無効です。');
            } else if (e.message.includes('403')) {
                setUiMessage('❌ 認証エラー: APIキーが正しいか、制限がかかっていないか確認してください。');
            } else {
                 setUiMessage(`献立生成中にエラーが発生しました: ${e.message}`);
            }
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleCheckToggle = useCallback((item: string) => {
        setCheckedItems(prev => ({
            ...prev,
            [item]: !prev[item],
        }));
    }, []);
    
    const handleStoreClick = (storeName: string) => {
        setActiveStore(storeName);
        setFinalStoreSelection(storeName); 
    };

    // 戻るボタンのハンドラ (LIFF対応済み)
    const handleBack = () => {
        if (menuResult) {
            // 献立結果画面から設定画面に戻る (アプリ内戻る)
            setMenuResult(null);
            setUiMessage('条件設定に戻りました。');
        } else if (typeof liff !== 'undefined' && liff.isInClient()) {
            // LIFFブラウザで、これ以上戻る履歴がない場合: LIFFウィンドウを閉じる
            liff.closeWindow();
        } else if (typeof window !== 'undefined') {
            // 標準ブラウザの場合: 履歴を戻る
            window.history.back();
        }
    };

    // RecipeCard コンポーネント定義 (UIを強調しつつ維持)
    const RecipeCard = ({ recipe, type }: { recipe: any, type: string }) => (
        <div className="border p-4 rounded-lg bg-white shadow-sm mb-4">
            <h3 className={`text-lg font-bold mb-2 ${type === 'main' ? 'text-red-600' : 'text-green-600'}`}>{recipe.name}</h3>
            <p className="text-sm text-gray-500 mb-3">&quot;{recipe.catchphrase}&quot;</p>
            
            <div className="space-y-3 text-sm">
                {/* 材料セクション */}
                <div className="p-2 bg-gray-50 rounded">
                    <h4 className="font-semibold text-gray-700 mb-1 flex items-center gap-1">
                        <ShoppingCart className="w-4 h-4" /> 材料 ({familySize})
                    </h4>
                    <ul className="list-disc list-inside ml-4 text-gray-600">
                        {recipe.ingredients.map((ing: string, i: number) => <li key={i}>{ing}</li>)}
                    </ul>
                </div>
                
                {/* 作り方セクション */}
                <div className="p-2 bg-gray-50 rounded">
                    <h4 className="font-semibold text-gray-700 mb-1 flex items-center gap-1">
                        <Flame className="w-4 h-4" /> 作り方 ({recipe.cookingTime})
                    </h4>
                    <ol className="list-decimal list-inside ml-4 text-gray-600 space-y-1">
                        {recipe.steps.map((step: string, i: number) => <li key={i}>{step}</li>)}
                    </ol>
                </div>

                {/* プロのコツ（ベネフィット）セクションを強調 */}
                <div className="p-2 bg-yellow-50 rounded text-xs text-gray-700 border border-yellow-200 font-medium">
                    💡 プロのコツ: <span className="font-bold text-gray-800">{recipe.tips}</span>
                </div>
            </div>
        </div>
    );

    if (loading) return <div className="min-h-screen flex justify-center items-center bg-gray-50"><Loader2 className="w-10 h-10 text-nasu-green animate-spin" /></div>;
    if (error) return <div className="p-4 text-red-600 bg-red-50 m-4 rounded-lg">{error}</div>;

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-800 pb-20">
            <style jsx global>{`
                .text-nasu-green { color: #38761D; }
                .bg-nasu-green { background-color: #38761D; }
                .bg-nasu-light { background-color: #F7FFF7; }
                .border-nasu-green { border-color: #38761D; }
                .shadow-nasu-green { box-shadow: 0 4px 6px -1px rgba(56, 118, 29, 0.3), 0 2px 4px -1px rgba(56, 118, 29, 0.1); }
                .active-store { background-color: #e0f2f1; border-color: #38761D; }
                .sticky-top { position: sticky; top: 0; z-index: 20; }
            `}</style>

            <header className="bg-white shadow-md sticky-top p-4">
                <div className="max-w-4xl mx-auto flex items-center gap-3">
                    {/* 戻るボタン (LIFF対応済み) */}
                    <button 
                        onClick={handleBack}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors focus:outline-none"
                        aria-label="戻る"
                    >
                        <ArrowLeft size={24} className="text-gray-600" />
                    </button>

                    <h1 className="text-xl sm:text-2xl font-extrabold text-nasu-green tracking-tight">
                        💰 AI献立＆特売ナビ「那須こんだて」
                    </h1>
                </div>
            </header>

            <main className="max-w-4xl mx-auto p-4 sm:p-6">
                
                <div className="bg-nasu-light p-4 sm:p-6 rounded-xl border border-nasu-green/30 shadow-md mb-8">
                    <p className="text-sm sm:text-base font-semibold text-nasu-green mb-2">
                        一流シェフの技術を家庭へ！料理の悩みと食費の苦痛から解放！
                    </p>
                    <p className="text-gray-700 text-sm">
                        冷蔵庫の在庫とあなたが入力した特売情報をAIが分析し、分量とレシピ手順まで考慮した、今日イチお得な献立（主菜3品・副菜3品）を提案します。
                    </p>
                </div>
                
                {uiMessage && (
                    <div className="fixed inset-x-0 bottom-0 mb-4 mx-auto p-3 max-w-sm bg-nasu-green text-white font-medium text-center rounded-lg shadow-xl z-30">
                        {uiMessage}
                    </div>
                )}

                {!menuResult && (
                    <section className="mb-8 bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-200">
                        <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">
                            献立生成の条件設定
                        </h2>
                        <div className="space-y-4">
                            
                            <div>
                                <label htmlFor="area-select" className="block text-sm font-bold text-gray-700">1. エリアを選ぶ</label>
                                <select
                                    id="area-select"
                                    value={selectedArea}
                                    onChange={(e) => setSelectedArea(e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-nasu-green focus:border-nasu-green bg-white text-lg font-semibold"
                                >
                                    {areas.map(area => (
                                        <option key={area} value={area}>{area}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">2. スーパーを選ぶ (クリックでチラシ確認)</label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {storesInArea.map(store => (
                                        <button
                                            key={store}
                                            onClick={() => handleStoreClick(store)}
                                            className={`p-2 text-sm text-center border-2 rounded-lg transition duration-150 ${
                                                store === finalStoreSelection ? 'bg-nasu-green text-white border-nasu-green font-bold' : 
                                                store === activeStore ? 'active-store font-semibold' : 
                                                'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                                            }`}
                                        >
                                            {store}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {activeStore && SALE_DATA_BY_AREA[selectedArea][activeStore] && (
                                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                    <h3 className="text-sm font-bold text-blue-800 mb-2">
                                        {activeStore} のチラシ情報
                                    </h3>
                                    
                                   {/* チラシリンクを LIFF 対応に修正 */}
                                    <button
                                        onClick={() => {
                                            const url = SALE_DATA_BY_AREA[selectedArea][activeStore].url;
                                            if (typeof liff !== 'undefined' && liff.isInClient()) {
                                                // LIFF 環境の場合: LIFFブラウザ内の新しいタブ/ビューで開く
                                                liff.openWindow({
                                                    url: url, 
                                                    external: false 
                                                });
                                            } else {
                                                // 標準ブラウザの場合: 別タブで開く
                                                window.open(url, '_blank', 'noopener,noreferrer');
                                            }
                                        }}
                                        className="w-full py-2 text-base font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition block text-center"
                                    >
                                        トクバイでチラシをチェック 📰 (アプリ内で開く)
                                    </button>

                                    <p className="mt-3 text-xs text-blue-700 font-bold bg-blue-100 p-2 rounded">
                                        ✅ **【重要】セッションは切れません。**<br/>
                                        チラシを確認後、ブラウザの**「左上の◀」**または**「閉じる (X) ボタン」**で元のアプリ画面に戻ってください。
                                    </p>
                                    <p className="mt-2 text-xs text-blue-700 text-center">
                                        ✅ このお店は献立に反映されています。
                                    </p>
                                </div>
                            )}
                            
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="family-size" className="block text-sm font-bold text-gray-700">3. 人数</label>
                                    <select
                                        id="family-size"
                                        value={familySize}
                                        onChange={(e) => setFamilySize(e.target.value)}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-nasu-green focus:border-nasu-green bg-white text-base"
                                    >
                                        {FAMILY_SIZE_OPTIONS.map((option) => (
                                            <option key={option} value={option}>
                                                {option}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700">4. 在庫</label>
                                    <textarea
                                        id="inventory"
                                        value={fridgeInventory}
                                        onChange={(e) => setFridgeInventory(e.target.value)}
                                        rows={1}
                                        placeholder="例: 米, じゃがいも, 玉ねぎ"
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-nasu-green focus:border-nasu-green"
                                    ></textarea>
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-bold text-gray-700">5. 特売・要望</label>
                                <textarea
                                    id="custom-ingredients"
                                    value={customIngredients}
                                    onChange={(e) => setCustomIngredients(e.target.value)}
                                    placeholder="例: 豚肉が安かった"
                                    rows={2}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-nasu-green focus:border-nasu-green"
                                ></textarea>
                                <p className="text-xs text-red-600 mt-1 font-bold">
                                    ※特売品の情報は必ずこの欄に入力してください。AIが節約レシピに反映します。
                                </p>
                            </div>
                            
                            <button
                                onClick={generateMenu}
                                disabled={isGenerating || !finalStoreSelection}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-nasu-green text-lg font-bold text-white bg-nasu-green hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-nasu-green transition duration-150 ease-in-out disabled:opacity-50"
                            >
                                {isGenerating ? (
                                    <span className="flex items-center">
                                        <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                                        献立をAIが考案中...
                                    </span>
                                ) : (
                                    'AIプロシェフに献立を提案してもらう'
                                )}
                            </button>
                        </div>
                    </section>
                )}

                {menuResult && (
                    <section>
                        {/* 結果から設定に戻るボタン */}
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold text-gray-800">提案結果</h2>
                            <button 
                                onClick={() => setMenuResult(null)}
                                className="text-sm text-blue-600 hover:underline flex items-center gap-1 font-medium"
                            >
                                <ArrowLeft size={16} /> 条件を変えてやり直す
                            </button>
                        </div>
                        
                        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-200 min-h-32">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                
                                {/* 買い物リスト（左側のカラム - LGサイズ以上で表示） */}
                                <div className="lg:col-span-1 border-b lg:border-l lg:border-b-0 lg:pl-6 pt-4 lg:pt-0 pb-6 lg:pb-0">
                                    <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center">
                                        🛍️ 買い物リスト
                                    </h2>
                                    {/* 強調表示されたコンセプトセクション */}
                                    <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
                                        <h3 className="text-sm font-bold text-yellow-800 flex items-center gap-1 mb-2">
                                            <ThumbsUp className="w-4 h-4" /> シェフのコンセプト
                                        </h3>
                                        <p className="text-sm text-gray-700 mb-2">
                                            {menuResult.menuConcept}
                                        </p>
                                        <p className="text-sm font-bold text-red-600">
                                            ✅ 節約効果: {menuResult.totalSavings}
                                        </p>
                                    </div>

                                    <ul className="space-y-2">
                                        {menuResult.shoppingList.length > 0 ? menuResult.shoppingList.map((item: string, index: number) => (
                                            <li 
                                                key={index} 
                                                className={`flex items-center p-2 rounded-lg cursor-pointer transition duration-150 ${checkedItems[item] ? 'bg-green-100 line-through text-gray-500' : 'bg-gray-50 hover:bg-gray-100 text-gray-800'}`}
                                                onClick={() => handleCheckToggle(item)}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={checkedItems[item] || false}
                                                    onChange={() => handleCheckToggle(item)}
                                                    className={`form-checkbox h-5 w-5 rounded transition duration-150 ease-in-out ${checkedItems[item] ? 'text-nasu-green' : 'text-gray-300'}`}
                                                    readOnly 
                                                />
                                                <span className="ml-3 text-base font-medium">{item}</span>
                                            </li>
                                        )) : (
                                            <p className="text-sm text-gray-500 p-2">必要な買い物はありません！</p>
                                        )}
                                    </ul>
                                </div>
                                
                                <div className="lg:col-span-2 space-y-8">
                                    {/* 主菜セクション */}
                                    <h3 className="text-xl font-bold text-gray-800 border-b pb-2">主菜の提案 (3品)</h3>
                                    {menuResult.mainDishes.map((recipe: any, index: number) => (
                                        <RecipeCard key={`main-${index}`} recipe={recipe} type="main" />
                                    ))}

                                    {/* 副菜セクション */}
                                    <h3 className="text-xl font-bold text-gray-800 border-b pb-2">副菜の提案 (3品)</h3>
                                    {menuResult.sideDishes.map((recipe: any, index: number) => (
                                        <RecipeCard key={`side-${index}`} recipe={recipe} type="side" />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {!menuResult && !isGenerating && (
                    <p className="text-center text-gray-500 mt-8 text-sm">
                        ⬆️ 上記の条件を入力し、「AIプロシェフに献立を提案してもらう」ボタンを押してください。
                    </p>
                )}
            </main>
        </div>
    );
};

export default App;