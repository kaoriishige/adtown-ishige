import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { ArrowLeft, Sparkles, AlertTriangle, Loader2, Users, Lightbulb, User, LogOut, Shirt, Zap, MessageSquare, ExternalLink, X, Calendar } from 'lucide-react';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signOut } from 'firebase/auth';

// --- 環境変数の取得 (APIキー用) ---
const getEnvVar = (name: string): any => {
    if (typeof window !== 'undefined' && (window as any)[name] !== undefined) {
        return (window as any)[name];
    }
    return undefined;
};

// Gemini API のエンドポイント
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent`;

// --- JSONスキーマ定義 (コーデ結果の構造) ---
const OUTFIT_SCHEMA = {
    type: "OBJECT",
    properties: {
        styleName: { type: "STRING", description: "提案されたコーディネートのスタイル名" },
        mood: { type: "STRING", description: "コーディネート全体の印象や用途" },
        items: {
            type: "ARRAY",
            description: "提案アイテム3つ（例：トップス、ボトムス、アウター）",
            items: {
                type: "OBJECT",
                properties: {
                    name: { type: "STRING", description: "アイテム名（例：リブニット、テーパードパンツ）" },
                    color: { type: "STRING", description: "推奨カラー" },
                    tip: { type: "STRING", description: "着こなしのポイント" }
                },
                required: ["name", "color", "tip"]
            }
        },
        accessory: { type: "STRING", description: "推奨アクセサリーまたはバッグ" },
        overallAdvice: { type: "STRING", description: "このコーデをより良く見せるための総合アドバイス" }
    },
    required: ["styleName", "mood", "items", "accessory", "overallAdvice"]
};


export default function FashionAIApp() {
    // ★追加: 日付と自由入力フィールド
    const [date, setDate] = useState(new Date().toISOString().substring(0, 10)); // 今日の日付をデフォルトに
    const [occasion, setOccasion] = useState('カジュアルなママ友ランチ');
    const [colorPreference, setColorPreference] = useState('明るい色');
    const [bodyType, setBodyType] = useState('特に指定なし');
    const [outfitResult, setOutfitResult] = useState<any>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [uiMessage, setUiMessage] = useState('');
    const [user, setUser] = useState<any>(null);

    const OCCASIONS = [
        'カジュアルなママ友ランチ', '公園遊び・外遊び', '近所の買い物',
        '仕事復帰/通勤', 'フォーマルな保護者会', 'デート・ディナー', 'その他（自由に記入）' // ★修正: その他を追加
    ];
    const COLORS = ['明るい色', 'ベーシックカラー (黒・白・グレー)', 'アースカラー (ベージュ・カーキ)', 'パステルカラー'];
    const BODY_TYPES = ['特に指定なし', '体型カバーを重視', '背を高く見せたい', '脚長効果を重視'];

    // 自由入力の判定
    const isCustomOccasion = occasion === 'その他（自由に記入）';
    const [customOccasionInput, setCustomOccasionInput] = useState('');


    // Firebase Auth初期化
    useEffect(() => {
        try {
            const firebaseConfigRaw = getEnvVar('__firebase_config');
            if (firebaseConfigRaw) {
                const firebaseConfig = JSON.parse(firebaseConfigRaw);
                const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
                const auth = getAuth(app);
                signInAnonymously(auth);
                onAuthStateChanged(auth, (currentUser) => {
                    setUser(currentUser);
                });
            }
        } catch (e: any) {
            console.error("Firebase Initialization Error:", e);
        }
    }, []);

    // API呼び出し関数
    const fetchOutfit = async () => {
        setIsGenerating(true);
        setOutfitResult(null);
        setUiMessage('');

        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || getEnvVar('__api_key');
        if (!apiKey) {
            setUiMessage("エラー: Gemini APIキーが設定されていません。");
            setIsGenerating(false);
            return;
        }

        const finalOccasion = isCustomOccasion && customOccasionInput.trim()
            ? customOccasionInput.trim()
            : occasion;

        if (isCustomOccasion && !customOccasionInput.trim()) {
            setUiMessage("その他を選択した場合は、用途を具体的に入力してください。");
            setIsGenerating(false);
            return;
        }

        // ★修正: 季節と場所のコンテキストをプロンプトに追加
        const context = `場所: 栃木県北エリア、日付: ${date} (AIはこの日の気候を考慮してください)。`;

        const systemPrompt = `あなたは、日本の主婦・女性層をターゲットとした、パーソナルスタイリストAIです。以下の条件に基づいて、実用的でおしゃれなコーディネートを提案してください。

        【重要】
        1. 出力は必ずJSON形式とし、OUTFIT_SCHEMAに従ってください。
        2. トーンは親しみやすく、ファッショナブルな言葉遣いを心がけてください。
        3. 提案は、動きやすさ、トレンド、体型カバーの要素を考慮し、特に「${context}」の気候に合うよう防寒/薄着を調整してください。
        `;

        const userQuery = `用途: ${finalOccasion}、希望の色: ${colorPreference}、体型要望: ${bodyType}。${context}で快適に過ごせる、今すぐ試せるコーディネートを提案してください。`;

        try {
            const payload = {
                contents: [{ parts: [{ text: userQuery }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] },
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: OUTFIT_SCHEMA,
                },
            };

            const response = await fetch(`${API_URL}?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            const jsonText = result.candidates?.[0]?.content?.parts?.[0]?.text;

            if (jsonText) {
                const parsedJson = JSON.parse(jsonText);
                setOutfitResult(parsedJson);
            } else {
                setUiMessage('診断結果の生成に失敗しました。');
            }

        } catch (e: any) {
            console.error("API call error:", e);
            setUiMessage(`診断エラーが発生しました: ${e.message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGoCategories = () => {
        window.location.href = '/premium/dashboard';
    };

    const handleLogout = () => {
        try {
            const auth = getAuth(getApp());
            signOut(auth);
        } catch (e) {
            console.error("Logout error:", e);
        }
    };


    return (
        <div className="min-h-screen bg-gray-50 font-sans pb-20">
            <Head><title>AIファッション診断</title></Head>

            {/* ヘッダー */}
            <header className="bg-white shadow-sm sticky top-0 z-10 p-4 border-b border-gray-200">
                <div className="max-w-xl mx-auto flex items-center gap-3">
                    <button onClick={handleGoCategories} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft size={20} className="text-gray-600" />
                    </button>

                    <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Shirt className="w-6 h-6 text-pink-500" />
                        AIファッション診断
                    </h1>

                    {user ? (
                        <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-red-500">
                            <LogOut className="w-5 h-5" />
                        </button>
                    ) : (
                        <div className="w-5 h-5"></div>
                    )}
                </div>
            </header>

            <main className="max-w-xl mx-auto p-4 sm:p-6">

                {uiMessage && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{uiMessage}</div>
                )}

                {/* 1. コーデ条件フォーム */}
                {!outfitResult && (
                    <section className="mb-8 bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                        <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
                            <User size={20} /> 診断条件を入力 (栃木県北エリア)
                        </h2>

                        <div className="space-y-4">

                            {/* 日付/季節の入力 (新規追加) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                                    <Calendar size={16} /> 1. 想定する日付
                                </label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    required
                                    className="w-full p-3 border border-gray-300 rounded-lg"
                                />
                            </div>

                            {/* 用途選択 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">2. コーデの用途</label>
                                <select
                                    value={occasion}
                                    onChange={(e) => {
                                        setOccasion(e.target.value);
                                        setCustomOccasionInput(''); // リセット
                                    }}
                                    className="w-full p-3 border border-gray-300 rounded-lg"
                                >
                                    {OCCASIONS.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                            </div>

                            {/* 自由入力欄 (その他が選択された場合) */}
                            {isCustomOccasion && (
                                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">
                                        用途を具体的に記入してください
                                    </label>
                                    <input
                                        type="text"
                                        value={customOccasionInput}
                                        onChange={(e) => setCustomOccasionInput(e.target.value)}
                                        placeholder="例: 美術館で長時間立ち見、急な雨の日の外出"
                                        className="w-full p-2 border border-gray-300 rounded-lg"
                                        required
                                    />
                                </div>
                            )}

                            {/* 色の好み */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">3. 色の好み</label>
                                <select
                                    value={colorPreference}
                                    onChange={(e) => setColorPreference(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg"
                                >
                                    {COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>

                            {/* 体型要望 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">4. 体型・見せ方要望</label>
                                <select
                                    value={bodyType}
                                    onChange={(e) => setBodyType(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg"
                                >
                                    {BODY_TYPES.map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                            </div>
                        </div>

                        <button
                            onClick={fetchOutfit}
                            disabled={isGenerating || (isCustomOccasion && !customOccasionInput.trim())}
                            className="w-full mt-6 py-3 bg-pink-600 text-white font-bold rounded-lg shadow-md hover:bg-pink-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                        >
                            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                            AIにコーディネートを提案してもらう
                        </button>
                    </section>
                )}

                {/* 2. コーデ結果表示 */}
                {outfitResult && (
                    <section className="bg-white p-6 rounded-xl shadow-xl border border-pink-400">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Sparkles className="w-6 h-6 text-yellow-500" />
                            提案コーディネート
                        </h2>

                        {/* スタイル概要 */}
                        <div className="mb-4 p-3 bg-pink-50 border-l-4 border-pink-500 rounded-lg">
                            <h3 className="font-bold text-pink-800 text-base mb-1">
                                {outfitResult.styleName}
                            </h3>
                            <p className="text-sm text-gray-700">用途: {outfitResult.mood}</p>
                        </div>

                        {/* 提案アイテム */}
                        <div className="mb-6 space-y-3">
                            <h3 className="text-lg font-bold text-gray-800 mb-2">
                                👗 提案アイテム
                            </h3>
                            {outfitResult.items.map((item: any, index: number) => (
                                <div key={index} className="p-3 bg-gray-100 rounded-lg border border-gray-200">
                                    <p className="font-semibold text-gray-800">{item.name} ({item.color})</p>
                                    <p className="text-xs text-gray-600 mt-1">
                                        <MessageSquare size={14} className="inline mr-1 text-gray-400" />
                                        {item.tip}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* アクセサリーと総合アドバイス */}
                        <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded-lg">
                            <h3 className="font-bold text-yellow-800 mb-2">
                                👜 仕上げのアドバイス
                            </h3>
                            <p className="text-sm text-gray-700 mb-2">
                                アクセサリー: {outfitResult.accessory}
                            </p>
                            <p className="text-sm text-gray-700 leading-relaxed">
                                総合アドバイス: {outfitResult.overallAdvice}
                            </p>
                        </div>

                        <button
                            onClick={() => setOutfitResult(null)}
                            className="w-full mt-4 py-3 bg-green-600 text-white font-bold rounded-lg shadow-md hover:bg-green-700 transition-colors"
                        >
                            別の条件で再診断する
                        </button>
                    </section>
                )}

                {/* 初期画面/結果なし */}
                {!outfitResult && !isGenerating && (
                    <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-dashed border-gray-300">
                        <Shirt className="w-10 h-10 text-pink-300 mx-auto mb-3" />
                        <p className="text-gray-600">AIがあなたにぴったりのコーディネートを提案します。</p>
                        <p className="text-sm text-gray-500">上の条件を入力してボタンを押してください。</p>
                    </div>
                )}

            </main>

            <footer className="text-center py-6 text-xs text-gray-400">
                © 2025 みんなの那須アプリ
            </footer>
        </div>
    );
}