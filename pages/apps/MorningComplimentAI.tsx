import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { ArrowLeft, Sparkles, AlertTriangle, Loader2, LogOut, Sun, MessageSquare, Gift } from 'lucide-react';
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

// --- JSONスキーマ定義 (メッセージの構造) ---
const MESSAGE_SCHEMA = {
    type: "OBJECT",
    properties: {
        compliment: { type: "STRING", description: "ユーザーの自信を高めるポジティブなメッセージ (100文字程度)" },
        theme: { type: "STRING", description: "今日のポジティブな行動テーマ (例: 集中力, 協調性, 休息)" },
        advice: { type: "STRING", description: "そのテーマを達成するための具体的で優しいアドバイス" }
    },
    required: ["compliment", "theme", "advice"]
};


export default function MorningComplimentAIApp() {
    const [result, setResult] = useState<any>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [uiMessage, setUiMessage] = useState('');
    const [user, setUser] = useState<any>(null);

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
    const fetchCompliment = async () => {
        setIsGenerating(true);
        setResult(null);
        setUiMessage('');

        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || getEnvVar('__api_key');
        if (!apiKey) {
            setUiMessage("エラー: Gemini APIキーが設定されていません。");
            setIsGenerating(false);
            return;
        }

        const systemPrompt = `あなたは、日本の主婦・女性層に特化した、自己肯定感を高めるポジティブなコーチングAIです。ユーザーが今日一日を最高に過ごせるよう、優しさと共感を持って、励ましのメッセージと具体的な行動テーマを提案してください。`;

        const userQuery = `私の今日のモチベーションを高めるための、ポジティブで心に響くメッセージと、達成すべき行動テーマをJSON形式で提案してください。`;

        try {
            const payload = {
                contents: [{ parts: [{ text: userQuery }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] },
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: MESSAGE_SCHEMA,
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
                setResult(parsedJson);
            } else {
                setUiMessage('メッセージの生成に失敗しました。');
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
            <Head><title>朝の褒め言葉AI</title></Head>

            {/* ヘッダー */}
            <header className="bg-white shadow-sm sticky top-0 z-10 p-4 border-b border-gray-200">
                <div className="max-w-xl mx-auto flex items-center justify-between">
                    <button onClick={handleGoCategories} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft size={20} className="text-gray-600" />
                    </button>

                    <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Sun className="w-6 h-6 text-yellow-500" />
                        朝の褒め言葉AI
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
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        {uiMessage}
                    </div>
                )}

                {/* 1. 実行ボタン */}
                {!result && (
                    <section className="mb-8 bg-white p-6 rounded-xl shadow-lg border border-gray-200 text-center">
                        <h2 className="text-3xl font-extrabold text-yellow-600 mb-2">
                            Good Morning!
                        </h2>
                        <p className="text-gray-600 mb-6">
                            ボタンを押して、AIからあなたへの**今日の褒め言葉**を受け取りましょう。
                        </p>

                        <button
                            onClick={fetchCompliment}
                            disabled={isGenerating}
                            className="w-full max-w-xs mx-auto py-3 bg-yellow-500 text-white font-bold rounded-full shadow-lg hover:bg-yellow-600 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                        >
                            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                            AIから今日のメッセージを受け取る
                        </button>
                    </section>
                )}

                {/* 2. 結果表示 */}
                {result && (
                    <section className="bg-white p-6 rounded-xl shadow-xl border border-yellow-400 animate-in fade-in">
                        <div className="text-center mb-6">
                            <h2 className="text-4xl font-extrabold text-pink-600 mb-2 flex items-center justify-center gap-3">
                                <Gift className="w-8 h-8" />
                                {result.theme}
                            </h2>
                            <p className="text-sm text-gray-500">今日あなたに贈られるテーマです</p>
                        </div>

                        {/* 褒め言葉（メイン） */}
                        <div className="mb-6 p-5 bg-yellow-50 border-l-4 border-yellow-500 rounded-lg">
                            <h3 className="text-xl font-bold text-gray-800 mb-2">
                                <MessageSquare className="w-5 h-5 inline mr-2 text-yellow-600" />
                                AIからのメッセージ
                            </h3>
                            <p className="text-xl text-gray-800 leading-relaxed font-semibold">
                                &quot;{result.compliment}&quot;
                            </p>
                        </div>

                        {/* アドバイス */}
                        <div className="p-4 bg-indigo-50 border-l-4 border-indigo-500 rounded-lg">
                            <h3 className="font-bold text-indigo-800 text-base mb-2">
                                行動アドバイス
                            </h3>
                            <p className="text-gray-700 text-sm leading-relaxed">
                                {result.advice}
                            </p>
                        </div>

                        <button
                            onClick={() => setResult(null)}
                            className="w-full mt-6 py-3 bg-green-600 text-white font-bold rounded-lg shadow-md hover:bg-green-700 transition-colors"
                        >
                            また明日挑戦する
                        </button>
                    </section>
                )}

            </main>

            <footer className="text-center py-6 text-xs text-gray-400">
                © 2025 みんなの那須アプリ
            </footer>
        </div>
    );
}