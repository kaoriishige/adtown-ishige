/* global __app_id, __firebase_config, __initial_auth_token, __api_key */
import React, { useState, useEffect, useCallback } from 'react';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { initializeApp } from 'firebase/app';

// グローバル変数からFirebase設定と認証トークンを取得
const appId = typeof __app_id !== 'undefined' ? __app_id : 'nasu-kondate-app';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? initialAuthToken : null;

// Gemini API のエンドポイント (キーはヘッダーで渡すためURLから削除)
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent`;

// --- 店舗情報 (トクバイURLのみを保持) ---
const SALE_DATA_BY_AREA = {
    "那須塩原市": {
        "ザ・ビッグ 那須店": {
            url: "https://tokubai.co.jp/%E3%82%B6%E3%83%BB%E3%83%93%E3%83%83%E3%82%B0/12250"
        },
        "ヨークベニマル 上厚崎店": {
            url: "https://tokubai.co.jp/%E3%83%A8%E3%83%BC%E3%82%AF%E3%83%99%E3%83%8B%E3%83%9E%E3%83%AB/170882"
        },
        "ヨークベニマル 那須塩原店": {
            url: "https://tokubai.co.jp/%E3%83%A8%E3%83%BC%E3%82%AF%E3%83%99%E3%83%8B%E3%83%9E%E3%83%AB/9591"
        },
        "ヨークベニマル 黒磯店": {
            url: "https://tokubai.co.jp/%E3%83%A8%E3%83%BC%E3%82%AF%E3%83%99%E3%83%8B%E3%83%9E%E3%83%AB/9593"
        },
        "とりせん 黒磯店": {
            url: "https://tokubai.co.jp/%E3%81%A8%E3%82%8A%E3%81%9B%E3%82%93/5530"
        },
        "とりせん 上厚崎店": {
            url: "https://tokubai.co.jp/%E3%81%A8%E3%82%8A%E3%81%9B%E3%82%93/279610"
        },
        "ダイユー 中央店": {
            url: "https://tokubai.co.jp/%E3%83%80%E3%82%A4%E3%83%A6%E3%83%BC/257633"
        },
        "ダイユー 若松店": {
            url: "https://tokubai.co.jp/%E3%83%80%E3%82%A4%E3%83%A6%E3%83%BC/257635"
        },
        "ダイユー 鍋掛店": {
            url: "https://tokubai.co.jp/%E3%83%80%E3%82%A4%E3%83%A6%E3%83%BC/257634"
        },
        "ダイユー 東那須店": {
            url: "https://tokubai.co.jp/%E3%83%80%E3%82%A4%E3%83%A6%E3%83%BC/257636"
        },
        "ザ・ビッグエクストラ 那須塩原店": {
            url: "https://tokubai.co.jp/%E3%82%B6%E3%83%BB%E3%83%93%E3%83%83%E3%82%B0%E3%82%A8%E3%82%AF%E3%82%B9%E3%83%88%E3%83%A9/12241"
        },
        "ヨークベニマル 西那須野店": {
            url: "https://tokubai.co.jp/%E3%83%A8%E3%83%BC%E3%82%AF%E3%83%99%E3%83%8B%E3%83%9E%E3%83%AB/9589"
        },
        "ヨークベニマル 西富山店": {
            url: "https://tokubai.co.jp/%E3%83%A8%E3%83%BC%E3%82%AF%E3%83%99%E3%83%8B%E3%83%9E%E3%83%AB/227875"
        },
        "ベイシア 那須塩原店": {
            url: "https://tokubai.co.jp/%E3%83%99%E3%82%A4%E3%82%B7%E3%82%A2/3996"
        },
        "リオン・ドール 西那須野店": {
            url: "https://tokubai.co.jp/%E3%83%AA%E3%82%AA%E3%83%B3%E3%83%BB%E3%83%89%E3%83%BC%E3%83%AB/257632"
        },
    },
    
    "大田原市": {
        "ヨークベニマル 大田原店": {
            url: "https://tokubai.co.jp/%E3%83%A8%E3%83%BC%E3%82%AF%E3%83%99%E3%83%8B%E3%83%9E%E3%83%AB/9597"
        },
        "ヨークベニマル 大田原住吉店": {
            url: "https://tokubai.co.jp/%E3%83%A8%E3%83%BC%E3%82%AF%E3%83%99%E3%83%8B%E3%83%9E%E3%83%AB/42986"
        },
        "たいらや 大田原本町店": {
            url: "https://tokubai.co.jp/%E3%81%9F%E3%81%84%E3%82%89%E3%82%84/173987"
        },
        "ベイシア 大田原店": {
            url: "https://tokubai.co.jp/%E3%83%99%E3%82%A4%E3%82%B7%E3%82%A2/4068"
        },
        "リオン・ドール 元町店": {
            url: "https://tokubai.co.jp/%E3%83%AA%E3%82%AA%E3%83%B3%E3%83%BB%E3%83%89%E3%83%BC%E3%83%AB/257631"
        },
        "たいらや 中田原店": {
            url: "https://tokubai.co.jp/%E3%81%9F%E3%81%84%E3%82%89%E3%82%84/264880"
        },
        "ダイユー 野崎店": {
            url: "https://tokubai.co.jp/%E3%83%80%E3%82%A4%E3%83%A6%E3%83%BC/257639"
        },
        "ダイユー 黒羽店": {
            url: "https://tokubai.co.jp/%E3%83%80%E3%82%A4%E3%83%A6%E3%83%BC/257638"
        },
        "リオン・ドール 黒羽店": {
            url: "https://tokubai.co.jp/%E3%83%AA%E3%82%AA%E3%83%B3%E3%83%BB%E3%83%89%E3%83%BC%E3%83%AB/172474"
        },
    },
    
    "那須町": {
        "ザ・ビッグ 那須店": {
            url: "https://tokubai.co.jp/%E3%82%B6%E3%83%BB%E3%83%93%E3%83%83%E3%82%B0/12250"
        }
    }
};

/**
 * 献立のJSONスキーマ定義
 */
const RECIPE_SCHEMA = {
    type: "OBJECT",
    properties: {
        recipes: {
            type: "ARRAY",
            description: "提案された献立",
            items: {
                type: "OBJECT",
                properties: {
                    name: { type: "STRING", description: "献立名（主菜と副菜をセットにした名前）" },
                    details: { type: "STRING", description: "料理の作り方（調理手順と分量）" }
                },
                required: ["name", "details"]
            }
        },
        shoppingList: {
            type: "ARRAY",
            description: "冷蔵庫の在庫と特売品を除いた、購入が必要な食材リスト",
            items: { type: "STRING" }
        },
        savingsEstimate: { type: "STRING", description: "AIが算出した、この献立セット全体の概算節約額または節約効果の説明" }
    },
    required: ["recipes", "shoppingList", "savingsEstimate"]
};

// 開発者向けのテスト用APIキーを定数として定義 (環境変数がない場合のフォールバック)
// ※本来は環境変数で設定すべきです
const FALLBACK_API_KEY = 'AIzaSyDvUaq7Shk_IWVdM_3FQw9-3tpNm4ofxww';

/**
 * メインアプリケーションコンポーネント
 * AI献立＆特売ナビ「那須こんだて」
 */
const App = () => {
    // Firebaseの状態（認証のために使用）
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // APIキーの状態 (__api_key のみを使用)
    //AIzaSyDvUaq7Shk_IWVdM_3FQw9-3tpNm4ofxww
    const [localApiKey] = useState(''); 

    // アプリの状態
    const [areas] = useState(Object.keys(SALE_DATA_BY_AREA));
    const [selectedArea, setSelectedArea] = useState(areas[0]);
    
    // エリアが変更されたら、自動的にそのエリアの最初のスーパーを選択
    const storesInArea = SALE_DATA_BY_AREA[selectedArea] ? Object.keys(SALE_DATA_BY_AREA[selectedArea]) : [];
    // finalStoreSelectionが、献立生成に使用される「最終的に選択されたスーパー」
    const [finalStoreSelection, setFinalStoreSelection] = useState(null); 
    const [activeStore, setActiveStore] = useState(null); // クリックでチラシリンクを表示するために一時的にアクティブな状態

    const [fridgeInventory, setFridgeInventory] = useState('米, じゃがいも, 玉ねぎ, 醤油');
    const [customIngredients, setCustomIngredients] = useState('豚こま肉が特売で100g 78円だった。'); 
    const [familySize, setFamilySize] = useState('大人2人, 子供2人'); 
    
    const [menuResult, setMenuResult] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [uiMessage, setUiMessage] = useState('');
    const [checkedItems, setCheckedItems] = useState({});

    // 1. エリアとスーパーの初期設定＆変更時のリセット
    useEffect(() => {
        // エリアが変わったら、チラシ表示をリセット
        setActiveStore(null);

        // 新しいエリアに店舗がある場合、最初の店舗を自動で finalStoreSelection に設定
        if (storesInArea.length > 0) {
            setFinalStoreSelection(storesInArea[0]);
        } else {
            setFinalStoreSelection(null);
        }
    }, [selectedArea, storesInArea.length]); // storesInArea.length への依存を追加


    // 2. Firebaseの初期化と認証処理
    useEffect(() => {
        // Firebase Auth初期化
        const initializeFirebase = async () => {
            if (Object.keys(firebaseConfig).length === 0) {
                setLoading(false);
                return;
            }
            try {
                const app = initializeApp(firebaseConfig);
                const authService = getAuth(app);
                
                onAuthStateChanged(authService, async (user) => {
                    if (user) { /* 認証済み */ } 
                    else {
                        try {
                            if (initialAuthToken) { await signInWithCustomToken(authService, initialAuthToken); } 
                            else { await signInAnonymously(authService); }
                        } catch (e) { console.error("Auth failed:", e); }
                    }
                    setLoading(false);
                });
            } catch (e) {
                console.error("Firebase initialization failed:", e);
                setError(`Firebaseの初期化に失敗しました: ${e.message}`);
                setLoading(false);
            }
        };
        initializeFirebase();
    }, []);

    // 3. 指数バックオフ付きのFetch関数
    const fetchWithBackoff = async (url, options, maxRetries = 5) => {
        // グローバル変数からキーを取得。なければフォールバックキーを使用。
        const keyToUse = (typeof __api_key !== 'undefined' && __api_key) ? __api_key : FALLBACK_API_KEY;

        // APIキーが空の場合は、環境の問題としてエラーをスロー
        if (!keyToUse) {
            throw new Error("Gemini APIキーが環境に設定されていません。アプリの開発環境設定を確認してください。");
        }
        
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            const finalOptions = {
                ...options,
                headers: {
                    ...options.headers,
                    // CORS制限回避のためのヘッダー (ブラウザ依存の対策)
                    'Access-Control-Allow-Origin': '*', 
                    // サーバーでキーを秘匿することを想定し、ヘッダーで渡す
                    'x-api-key': keyToUse, 
                },
                // 接続を安定させるためのモード設定
                mode: 'cors',
            };

            // URLがHTTPSであることを確認
            const secureUrl = url.startsWith('https://') ? url : `https://${url.replace(/^(http|https):\/\//, '')}`;

            try {
                const response = await fetch(secureUrl, finalOptions);
                if (response.ok) {
                    return response;
                }
                if (response.status === 429 && attempt < maxRetries - 1) {
                    const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    const errorBody = await response.text();
                    throw new Error(`API call failed with status ${response.status}: ${errorBody}`);
                }
            } catch (e) {
                // Failed to fetchエラーの場合のログを強化
                if (e instanceof TypeError && e.message.includes('Failed to fetch')) {
                    console.error("Network/CORS/Protocol Error:", e);
                }
                if (attempt === maxRetries - 1) throw e;
                const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        throw new Error("API call failed after multiple retries.");
    };

    // 4. 献立を生成する関数
    const generateMenu = async () => {
        setIsGenerating(true);
        setMenuResult(null);
        setUiMessage('');
        setCheckedItems({}); 

        // 最終選択されたストアをチェック
        if (!finalStoreSelection || !selectedArea) {
            setUiMessage('エリアとスーパーを選択してください。');
            setIsGenerating(false);
            return;
        }

        const storeName = finalStoreSelection; // 最終選択されたストアを使用
        const servings = familySize.trim(); 
        const areaName = selectedArea;
        const inventory = fridgeInventory.trim();
        const customPrompt = customIngredients.trim();
        
        // JSON出力を要求するシステムプロンプト
        const systemPrompt = `あなたは、那須地域（${areaName}）の主婦（主夫）向けの、節約献立プランナーAIです。以下の制約と目標に従って、献立を提案してください。

1. **提案の目標**: 食費を最大限に節約し、冷蔵庫の在庫を使い切ることを最優先とします。
2. **提案内容**:
    - **${servings}分**の夕食として、**主菜と副菜**を組み合わせた**2つの献立**を提案してください。
    - 献立には、ユーザーが入力した特売品、または在庫食材を組み込むことを優先してください。
    - **レシピには、${servings}分の調理手順と具体的な分量（g/cc/本など）を Markdown 形式で詳細に記載してください。**
3. **出力形式**:
    - 出力は必ずJSON形式とし、以下のスキーマに従ってください。

スーパー: ${storeName}
冷蔵庫の在庫: ${inventory}
料理人数: ${servings}
ユーザー入力の特売品/要望: ${customPrompt || "特になし。節約レシピを優先してください。"}`; // カスタム要望をAIに正確に渡す
        
        const userQuery = `上記の制約と、ユーザーが入力した特売品または食べたいメニューを組み合わせて、最適な2つの献立を提案し、必要な情報（レシピ詳細、買い物リスト、節約効果）をJSONで出力してください。`;

        try {
            const payload = {
                contents: [{ parts: [{ text: userQuery }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] },
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: RECIPE_SCHEMA,
                },
            };

            const response = await fetchWithBackoff(API_URL, {
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

        } catch (e) {
            console.error("API call error:", e);
            // 接続エラーが発生した場合の具体的なガイダンス
            if (e.message.includes('Failed to fetch')) {
                 setUiMessage('🔴 接続エラー: Failed to fetch。ネットワーク接続またはCORS設定を確認してください。');
            } else if (e.message.includes('APIキーが環境に設定されていません')) {
                // 開発者に向けたメッセージ
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
    
    // 買い物リストのチェックボックス切り替えハンドラ
    const handleCheckToggle = useCallback((item) => {
        setCheckedItems(prev => ({
            ...prev,
            [item]: !prev[item],
        }));
    }, []);
    
    // スーパーボタンをクリックしたときのハンドラ (チラシ表示と最終選択を同時に行う)
    const handleStoreClick = (storeName) => {
        // 1. チラシ表示をトグル (アクティブ状態を切り替える)
        // 現在アクティブなストアと同じならトグル（閉じる）
        if (storeName === activeStore) {
            setActiveStore(null);
        } else {
            // 異なるなら新しく開く
            setActiveStore(storeName);
        }

        // 2. 最終選択を確定させる (ボタンを押せるようにする)
        // クリックした時点で、そのストアを献立生成の対象として確定させる
        setFinalStoreSelection(storeName); 
    };

    
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <p className="text-lg text-nasu-green">AI献立ナビを準備中...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 bg-red-100 border border-red-400 text-red-700 rounded-lg m-4">
                <p className="font-bold">エラーが発生しました:</p>
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <style jsx global>{`
                /* カスタムカラーの定義 */
                .text-nasu-green { color: #38761D; }
                .bg-nasu-green { background-color: #38761D; }
                .bg-nasu-light { background-color: #F7FFF7; }
                .border-nasu-green { border-color: #38761D; }
                .shadow-nasu-green { box-shadow: 0 4px 6px -1px rgba(56, 118, 29, 0.3), 0 2px 4px -1px rgba(56, 118, 29, 0.1); }
                .active-store { background-color: #e0f2f1; border-color: #38761D; }
                .sticky-top {
                    position: sticky;
                    top: 0;
                    z-index: 20;
                }
            `}</style>

            <header className="bg-white shadow-md sticky-top p-4">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-xl sm:text-2xl font-extrabold text-nasu-green tracking-tight">
                        💰 AI献立＆特売ナビ「那須こんだて」
                    </h1>
                </div>
            </header>

            <main className="max-w-4xl mx-auto p-4 sm:p-6">
                
                {/* サービス説明 */}
                <div className="bg-nasu-light p-4 sm:p-6 rounded-xl border border-nasu-green/30 shadow-md mb-8">
                    <p className="text-sm sm:text-base font-semibold text-nasu-green mb-2">
                        【有料プラン機能案】主婦の「考える苦痛」から解放！
                    </p>
                    <p className="text-gray-700 text-sm">
                        冷蔵庫の在庫と**あなたが入力した特売情報**をAIが分析し、**分量とレシピ手順まで考慮した**、今日イチお得な献立を提案します。
                    </p>
                </div>
                
                {/* メッセージ表示 */}
                {uiMessage && (
                    <div className="fixed inset-x-0 bottom-0 mb-4 mx-auto p-3 max-w-sm bg-nasu-green text-white font-medium text-center rounded-lg shadow-xl z-30">
                        {uiMessage}
                    </div>
                )}

                {/* 献立入力フォーム */}
                <section className="mb-8 bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-200">
                    <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">
                        献立生成の条件設定 (5ステップ)
                    </h2>
                    <div className="space-y-4">
                        
                        {/* 1. エリアの選択 */}
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

                        {/* 2. スーパーの選択 (クリック可能) */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">2. 今日行くスーパーを選ぶ (クリックでチラシを確認)</label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {storesInArea.map(store => (
                                    <button
                                        key={store}
                                        onClick={() => handleStoreClick(store)} // クリックでチラシリンクをトグルと最終選択を同時に行う
                                        className={`p-2 text-sm text-center border-2 rounded-lg transition duration-150 ${
                                            // 最終選択されたストアは緑色
                                            store === finalStoreSelection ? 'bg-nasu-green text-white border-nasu-green font-bold' : 
                                            // チラシ確認のために一時的にアクティブなストアは薄い緑
                                            store === activeStore ? 'active-store font-semibold' : 
                                            // その他
                                            'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                                        }`}
                                    >
                                        {store}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* チラシリンク表示 (クリック時のみ) */}
                        {activeStore && SALE_DATA_BY_AREA[selectedArea][activeStore] && (
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                <h3 className="text-sm font-bold text-blue-800 mb-2">
                                    {activeStore} のチラシ情報
                                </h3>
                                <button 
                                    onClick={() => window.open(SALE_DATA_BY_AREA[selectedArea][activeStore].url, '_blank')}
                                    className="w-full py-2 text-base font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
                                >
                                    トクバイでチラシをチェック 📰 (別タブで開く)
                                </button>
                                <p className="mt-2 text-xs text-blue-700 text-center">
                                    ✅ このお店は献立に反映されています。
                                </p>
                            </div>
                        )}
                        
                        {/* 3. 料理人数 (Family Size) */}
                        <div>
                            <label htmlFor="family-size" className="block text-sm font-bold text-gray-700">3. 料理人数・家族構成 (分量の目安)</label>
                            <input
                                id="family-size"
                                type="text"
                                value={familySize}
                                onChange={(e) => setFamilySize(e.target.value)}
                                placeholder="例: 大人2人, 子供2人"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-nasu-green focus:border-nasu-green"
                            />
                        </div>

                        {/* 4. 冷蔵庫の在庫 */}
                        <div>
                            <label htmlFor="inventory" className="block text-sm font-bold text-gray-700">4. 冷蔵庫の在庫や残り物を入力 (節約の優先順位)</label>
                            <textarea
                                id="inventory"
                                value={fridgeInventory}
                                onChange={(e) => setFridgeInventory(e.target.value)}
                                placeholder="例: 牛乳 1/3本, 豚バラ 100g, 豆腐 半丁"
                                rows="2"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-nasu-green focus:border-nasu-green"
                            ></textarea>
                        </div>
                        
                        {/* 5. カスタム要望 (特売/食べたいメニュー) */}
                        <div>
                            <label htmlFor="custom-ingredients" className="block text-sm font-bold text-gray-700">5. その他の要望 (特売品 / 食べたいメニューの入力)</label>
                            <textarea
                                id="custom-ingredients"
                                value={customIngredients}
                                onChange={(e) => setCustomIngredients(e.target.value)}
                                placeholder="例: 「サバの味噌煮が食べたい」, 「豚肉が100g 78円だった」など、AIに反映させたい情報を入力"
                                rows="2"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-nasu-green focus:border-nasu-green"
                            ></textarea>
                            <p className="text-xs text-red-600 mt-1 font-bold">
                                ※**特売品の情報は必ずこの欄に入力してください**。AIが節約レシピに反映します。
                            </p>
                        </div>
                        
                        {/* 献立生成ボタン */}
                        <button
                            onClick={generateMenu}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-nasu-green text-lg font-bold text-white bg-nasu-green hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-nasu-green transition duration-150 ease-in-out disabled:opacity-50"
                            disabled={isGenerating || !finalStoreSelection}
                        >
                            {isGenerating ? (
                                <span className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    献立をAIが考案中...
                                </span>
                            ) : (
                                'AIに献立を提案してもらう (考える苦痛から解放)'
                            )}
                        </button>
                        
                        {finalStoreSelection && (
                            <p className="text-sm text-center text-gray-600 mt-2">
                                現在選択中のお店: <span className="font-bold text-nasu-green">{finalStoreSelection}</span>
                            </p>
                        )}
                    </div>
                </section>

                {/* 献立結果表示 */}
                <section>
                    <h2 className="text-2xl font-bold mb-4 text-gray-800">
                        提案された献立 & 買い物リスト
                    </h2>
                    
                    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-200 min-h-32">
                        {isGenerating && (
                            <p className="text-gray-500 text-center py-8">AIが特売品と冷蔵庫を分析中です...</p>
                        )}

                        {menuResult && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                
                                {/* 買い物リスト（右側のカラム - LGサイズ以上で表示） */}
                                <div className="lg:col-span-1 border-b lg:border-l lg:border-b-0 lg:pl-6 pt-4 lg:pt-0 pb-6 lg:pb-0">
                                    <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center">
                                        🛍️ 買い物リスト
                                    </h2>
                                    <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
                                        <h3 className="text-sm font-bold text-yellow-800">✅ 節約効果</h3>
                                        <p className="text-sm text-gray-700 mt-1">{menuResult.savingsEstimate}</p>
                                    </div>

                                    <ul className="space-y-2">
                                        {menuResult.shoppingList.length > 0 ? menuResult.shoppingList.map((item, index) => (
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
                                
                                {/* 献立（レシピ）一覧 */}
                                <div className="lg:col-span-2 space-y-8">
                                    {menuResult.recipes.map((recipe, index) => (
                                        <div key={index} className="border p-4 rounded-xl bg-gray-50/70">
                                            <h3 className="text-xl font-extrabold text-nasu-green mb-3 flex items-center">
                                                <span className="text-sm mr-2 bg-nasu-green text-white px-3 py-1 rounded-full">{index + 1}</span>
                                                {recipe.name}
                                            </h3>
                                            
                                            {/* 料理名からレシピ（手順詳細） */}
                                            <div>
                                                <h4 className="text-base font-bold text-gray-700 border-l-4 border-nasu-green pl-3 mb-2">作り方 ({familySize}分)</h4>
                                                <div className="text-sm text-gray-600 whitespace-pre-wrap">
                                                    {/* Markdown形式のレシピをそのまま表示 */}
                                                    {recipe.details}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {!menuResult && !isGenerating && (
                            <p className="text-gray-500 text-center py-8">
                                条件を設定して「AIに献立を提案してもらう」ボタンを押してください。
                            </p>
                        )}
                    </div>
                </section>
                
                <footer className="mt-8 pt-4 border-t text-center text-xs text-gray-400">
                    &copy; 2025 AI献立＆特売ナビ「那須こんだて」
                </footer>
            </main>
        </div>
    );
}

export default App;