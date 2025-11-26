import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { ArrowLeft, Sparkles, AlertTriangle, Loader2, Lightbulb, Zap, Clock, MessageSquare, ExternalLink, X, LogOut, User } from 'lucide-react'; 
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

// --- JSONスキーマ定義 (裏技の構造) ---
const HACK_SCHEMA = {
    type: "OBJECT",
    properties: {
        hacks: {
            type: "ARRAY",
            description: "生活の裏技5つ",
            items: {
                type: "OBJECT",
                properties: {
                    title: { type: "STRING", description: "裏技のキャッチーなタイトル" },
                    category: { type: "STRING", description: "カテゴリ（例: 掃除, 料理, 収納）" },
                    description: { type: "STRING", description: "裏技の具体的な手順と効果" }
                },
                required: ["title", "category", "description"]
            }
        },
    },
    required: ["hacks"]
};


export default function LifeHacksApp() {
    const [theme, setTheme] = useState('時短料理');
    const [customThemeInput, setCustomThemeInput] = useState(''); // 自由入力用
    const [hacks, setHacks] = useState<any[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [uiMessage, setUiMessage] = useState('');
    const [user, setUser] = useState<any>(null);
    
    // ★修正: 表示用のテーマ名 (stateに昇格)
    const [displayTheme, setDisplayTheme] = useState('時短料理');


    // Firebase Auth初期化 (ユーザー識別のみ)
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
    const fetchHacks = async () => {
        setIsGenerating(true);
        setHacks([]);
        setUiMessage('');

        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || getEnvVar('__api_key');
        if (!apiKey) {
            setUiMessage("エラー: Gemini APIキーが設定されていません。");
            setIsGenerating(false);
            return;
        }
        
        // 最終的なテーマを決定
        const finalTheme = theme === "その他（自由に記入）" && customThemeInput.trim()
            ? customThemeInput.trim()
            : theme;

        if (!finalTheme) {
            setUiMessage("テーマを選択または入力してください。");
            setIsGenerating(false);
            return;
        }
        
        // ★修正: 最終的なテーマをstateに保存
        setDisplayTheme(finalTheme);

        const systemPrompt = `あなたは、日本の主婦・女性層をターゲットとした、生活の知恵を提供するAIです。ユーザーが選んだテーマに関する、すぐに試せる具体的で役立つ裏技を5つ提案してください。

        【重要】
        1. 出力は必ずJSON形式とし、HACK_SCHEMAに従ってください。
        2. 情報は実用的かつ安全なものに限定してください。
        3. テーマに沿った裏技のみを生成してください。
        `;

        const userQuery = `テーマ「${finalTheme}」について、主婦が「知らなかった！」と思うような裏技を5つ、簡潔に教えてください。`;

        try {
            const payload = {
                contents: [{ parts: [{ text: userQuery }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] },
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: HACK_SCHEMA,
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
                setHacks(parsedJson.hacks);
            } else {
                setUiMessage('裏技の生成に失敗しました。');
            }

        } catch (e: any) {
            console.error("API call error:", e);
            setUiMessage(`診断エラーが発生しました: ${e.message}`);
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleGoCategories = () => {
        window.location.href = '/apps/categories';
    };

    const logout = () => {
        try {
            const auth = getAuth(getApp());
            signOut(auth);
        } catch (e) {
            console.error("Logout error:", e);
        }
    };

    const THEMES = ['時短料理', '簡単掃除', '収納術', '節約術', '子育ての裏技', 'その他（自由に記入）'];
    const isCustomInputActive = theme === "その他（自由に記入）";


    return (
        <div className="min-h-screen bg-gray-50 font-sans pb-20">
            <Head><title>知っ得！生活の裏技AI</title></Head>

            {/* ヘッダー */}
            <header className="bg-white shadow-sm sticky top-0 z-10 p-4 border-b border-gray-200">
                <div className="max-w-xl mx-auto flex items-center gap-3">
                    <button onClick={handleGoCategories} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft size={20} className="text-gray-600" />
                    </button>
                    
                    <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Lightbulb className="w-6 h-6 text-yellow-500" />
                        知っ得！生活の裏技AI
                    </h1>
                </div>
            </header>

            <main className="max-w-xl mx-auto p-4 sm:p-6">
                
                {uiMessage && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{uiMessage}</div>
                )}
                
                {/* 1. テーマ選択フォーム */}
                <section className="mb-8 bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                    <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
                        <Zap size={20} /> 裏技のテーマを選ぶ
                    </h2>
                    
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        どんな分野の裏技を知りたいですか？
                    </label>
                    
                    <select
                        value={theme}
                        onChange={(e) => {
                            setTheme(e.target.value);
                            setCustomThemeInput(''); // テーマ変更時はカスタム入力をリセット
                        }}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500 text-base font-semibold text-gray-700 mb-4"
                    >
                        {THEMES.map(t => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>

                    {/* ★追加: 自由入力欄 */}
                    {isCustomInputActive && (
                        <div className="mb-4">
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                                知りたい裏技のテーマを具体的に記入してください
                            </label>
                            <input
                                type="text"
                                value={customThemeInput}
                                onChange={(e) => setCustomThemeInput(e.target.value)}
                                placeholder="例: 茶渋を簡単に落とす方法"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500"
                                required
                            />
                        </div>
                    )}
                    
                    <button
                        onClick={fetchHacks}
                        disabled={isGenerating || (isCustomInputActive && !customThemeInput.trim())}
                        className="w-full py-3 bg-yellow-600 text-white font-bold rounded-lg shadow-md hover:bg-yellow-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                    >
                        {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                        新しい裏技をAIに聞く
                    </button>
                </section>

                {/* 2. 裏技結果表示 */}
                {hacks.length > 0 && (
                    <section className="bg-white p-6 rounded-xl shadow-xl border border-yellow-400">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Lightbulb className="w-6 h-6 text-yellow-500" />
                            知っ得裏技 5選
                        </h2>
                        
                        <p className="text-sm text-gray-600 mb-4">
                            テーマ: <span className="font-bold text-yellow-700">{displayTheme}</span> に関する知恵です。
                        </p>

                        <div className="space-y-4">
                            {hacks.map((hack, index) => (
                                <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                            {index + 1}. {hack.title}
                                        </h3>
                                        <span className="text-xs font-semibold text-white bg-indigo-500 px-2 py-0.5 rounded-full">
                                            {hack.category}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-700 leading-relaxed">
                                        <MessageSquare size={14} className="inline mr-1 text-gray-400" />
                                        {hack.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                        
                        <button
                            onClick={() => setHacks([])}
                            className="w-full mt-6 py-3 bg-green-600 text-white font-bold rounded-lg shadow-md hover:bg-green-700 transition-colors"
                        >
                            テーマを選び直す
                        </button>
                    </section>
                )}

                {/* 初期画面/結果なし */}
                {hacks.length === 0 && !isGenerating && (
                    <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-dashed border-gray-300">
                        <Lightbulb className="w-10 h-10 text-yellow-300 mx-auto mb-3" />
                        <p className="text-gray-600">あなたの生活を楽にする裏技をAIが提案します。</p>
                        <p className="text-sm text-gray-500">上のテーマを選んでボタンを押してください。</p>
                    </div>
                )}
            </main>
            
            <footer className="text-center py-6 text-xs text-gray-400">
                © 2025 みんなの那須アプリ
            </footer>
        </div>
    );
}