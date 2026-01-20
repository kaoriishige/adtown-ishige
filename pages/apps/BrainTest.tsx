import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { ArrowLeft, Sparkles, AlertTriangle, Loader2, Gamepad, Zap, LogOut, Brain, MessageSquare, Trophy, Calendar, Gift, X } from 'lucide-react';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signOut } from 'firebase/auth';
import { IoReloadOutline } from 'react-icons/io5';


// --- 型定義 ---
interface TestQuestion {
    id: number;
    type: 'quiz' | 'test';
    question: string;
    options: string[];
    answer: string; // クイズの正解
    analysis: string; // 診断結果または解説
}

// --- 環境変数の取得 (APIキー用) ---
const getEnvVar = (name: string): any => {
    if (typeof window !== 'undefined' && (window as any)[name] !== undefined) {
        return (window as any)[name];
    }
    return undefined;
};

// Gemini API のエンドポイント
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent`;

// --- JSONスキーマ定義 (心理テスト/脳トレの構造) ---
const TEST_SCHEMA = {
    type: "OBJECT",
    properties: {
        tests: {
            type: "ARRAY",
            description: "日常の心理テストまたは脳トレクイズ5問",
            items: {
                type: "OBJECT",
                properties: {
                    id: { type: "INTEGER", description: "問題ID" },
                    type: { type: "STRING", enum: ["quiz", "test"], description: "問題のタイプ（雑学クイズか心理テストか）" },
                    question: { type: "STRING", description: "質問文" },
                    options: { type: "ARRAY", description: "3つの選択肢", items: { type: "STRING" } },
                    answer: { type: "STRING", description: "クイズの場合の正しい選択肢のテキスト。心理テストの場合は空欄で良い。" },
                    analysis: { type: "STRING", description: "選択肢ごとの診断結果またはクイズの解説" }
                },
                required: ["question", "options", "answer", "analysis"]
            }
        }
    },
    required: ["tests"]
};

// --- API呼び出し関数 ---
const fetchTests = async () => {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || getEnvVar('__api_key');
    if (!apiKey) throw new Error("Gemini APIキーが見つかりません。");

    const systemPrompt = `あなたは、日本の主婦・女性層をターゲットとしたエンタメAIです。日常の家事、子育て、節約術、人間関係の心理、美容の雑学に特化した、共感を呼ぶクイズと心理テストをランダムに作成してください。`;
    const userQuery = `ターゲット層の関心が高いテーマ（節約、時短、子どもの心理、人間関係のコツなど）に絞り込み、誰でも楽しめる雑学クイズと心理テストを組み合わせて5問生成し、必ずJSONスキーマに従って回答してください。`;

    const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: TEST_SCHEMA,
        },
    };

    const response = await fetch(`${API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const jsonText = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!jsonText) throw new Error("AIから有効なJSONが返されませんでした。");

    return JSON.parse(jsonText).tests;
};


export default function BrainTestApp() {
    const [tests, setTests] = useState<TestQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    // ★修正: 新しい状態 'initial' を追加
    const [gameState, setGameState] = useState<'loading' | 'initial' | 'playing' | 'finished'>('initial');
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [uiMessage, setUiMessage] = useState('');

    // Firebase Auth初期化 (ユーザー識別のみ)
    useEffect(() => {
        try {
            const firebaseConfigRaw = getEnvVar('__firebase_config');
            if (firebaseConfigRaw) {
                const firebaseConfig = JSON.parse(firebaseConfigRaw);
                const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
                const auth = getAuth(app);
                signInAnonymously(auth);
            }
        } catch (e) {
            console.error("Firebase init error:", e);
        }
    }, []);

    // テストデータのフェッチ
    const fetchNewTest = async () => {
        setGameState('loading');
        setUiMessage('新しい脳トレ問題を生成中です...');

        try {
            const testData = await fetchTests();

            setTests(testData);
            setScore(0);
            setCurrentIndex(0);
            setSelectedOption(null);
            setShowResult(false);
            setUiMessage('準備完了！');
            // ★修正: データ取得後、'playing' ではなく 'initial' 状態へ移行させる
            setGameState('playing');

        } catch (e: any) {
            console.error("Test fetch failed:", e);
            setUiMessage(`問題の生成に失敗しました: ${e.message}. 再試行してください。`);
            setGameState('finished'); // 失敗時も強制終了
        }
    };

    // Initial load: Prepare UI without blocking on API
    useEffect(() => {
        setUiMessage('診断の準備ができました');
    }, []);

    const handleSelectOption = (option: string) => {
        if (showResult) return;

        setSelectedOption(option);
        setShowResult(true);

        const currentTest = tests[currentIndex];

        if (currentTest.type === 'quiz' && option === currentTest.answer) {
            setScore(prev => prev + 1);
        }
    };

    // ★修正: ゲーム開始ボタンのハンドラを追加
    const handleStartGame = () => {
        if (tests.length > 0) {
            setGameState('playing');
            setUiMessage('診断開始！');
        } else {
            fetchNewTest(); // データがない場合は再フェッチ
        }
    };

    // ★修正: 次の問題へ進む処理 (ディレイ導入は維持し、誤作動を防ぐ)
    const handleNext = () => {
        // ディレイを挟むことで、UIのクリックイベントが完全に終了するのを待つ
        setTimeout(() => {
            if (currentIndex < tests.length - 1) {
                // 次の問題へ進む
                setCurrentIndex(prev => prev + 1);
                setShowResult(false);
                setSelectedOption(null);
            } else {
                // 全問終了
                setGameState('finished');
            }
        }, 150); // 150msのディレイを導入
    };

    const currentTest = tests[currentIndex];
    const totalTests = tests.length;

    const handleGoCategories = () => {
        window.location.href = '/premium/dashboard';
    };

    // ログアウト処理 
    const handleLogout = () => {
        try {
            const auth = getAuth(getApp());
            signOut(auth);
        } catch (e) {
            console.error("Logout error:", e);
        }
    };

    // 解説表示
    const getAnalysis = () => {
        if (!currentTest) return '解説なし';
        return currentTest.analysis;
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans pb-20">
            <Head><title>直感！脳力診断</title></Head>

            {/* ヘッダー */}
            <header className="bg-white shadow-sm sticky top-0 z-10 p-4 border-b border-gray-200">
                <div className="max-w-xl mx-auto flex items-center justify-between">
                    <button onClick={handleGoCategories} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft size={20} className="text-gray-600" />
                    </button>

                    <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Brain className="w-6 h-6 text-pink-500" />
                        直感！脳力診断
                    </h1>

                    <div className="text-sm font-semibold text-gray-600">
                        {/* スコア表示を汎用的に */}
                        {gameState !== 'finished' && gameState !== 'initial' ? `進捗: ${currentIndex + 1} / ${totalTests}` : `最終結果`}
                    </div>
                </div>
            </header>

            <main className="max-w-xl mx-auto p-4 sm:p-6">

                {/* メインゲームエリア */}
                <section className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">

                    {/* ロード中メッセージ */}
                    {gameState === 'loading' && (
                        <div className="text-center py-20">
                            <Loader2 className="w-8 h-8 text-pink-500 animate-spin mx-auto mb-3" />
                            <p className="text-gray-600">{uiMessage}</p>
                        </div>
                    )}

                    {/* 初期画面 (スタート待ち) */}
                    {gameState === 'initial' && (
                        <div className="text-center py-20">
                            <Brain className="w-16 h-16 text-pink-300 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">直感！脳力診断へようこそ</h2>
                            <p className="text-gray-600 mb-6">用意された5つの問題に答えて、今日のあなたの脳力と心理状態をチェックしましょう。</p>
                            <button
                                onClick={handleStartGame}
                                className="w-full max-w-xs mt-4 py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 flex items-center justify-center gap-2 mx-auto"
                            >
                                <Zap className="w-5 h-5" />
                                診断スタート！
                            </button>
                            {uiMessage && <p className="mt-4 text-sm text-green-600">{uiMessage}</p>}
                        </div>
                    )}

                    {/* プレイ中 */}
                    {gameState === 'playing' && currentTest && (
                        <div>
                            <div className={`text-center text-sm font-medium mb-4 p-2 rounded-full w-fit mx-auto ${currentTest.type === 'quiz' ? 'bg-indigo-100 text-indigo-700' : 'bg-pink-100 text-pink-700'}`}>
                                {currentTest.type === 'quiz' ? '🧠 雑学クイズ' : '💖 心理テスト'}
                            </div>

                            {/* 質問文 */}
                            <h2 className="text-xl font-bold text-gray-800 mb-6 leading-relaxed text-center">
                                {currentTest.question}
                            </h2>

                            {/* 選択肢ボタン */}
                            <div className="space-y-3">
                                {currentTest.options.map((option, index) => {
                                    const isCorrect = option === currentTest.answer; // 正解かどうか
                                    const isSelected = option === selectedOption;

                                    let buttonClass = "bg-gray-100 hover:bg-gray-200 text-gray-800";

                                    if (showResult) {
                                        if (currentTest.type === 'quiz') {
                                            if (isCorrect) {
                                                buttonClass = "bg-green-500 text-white shadow-lg border-green-700";
                                            } else if (isSelected && !isCorrect) {
                                                buttonClass = "bg-red-500 text-white shadow-lg border-red-700";
                                            } else {
                                                buttonClass = "bg-gray-200 text-gray-500 cursor-not-allowed";
                                            }
                                        } else {
                                            // 心理テストの場合の選択肢の強調
                                            if (isSelected) {
                                                buttonClass = "bg-pink-500 text-white shadow-lg";
                                            } else {
                                                buttonClass = "bg-gray-200 text-gray-500 cursor-not-allowed";
                                            }
                                        }
                                    } else if (isSelected) {
                                        buttonClass = "bg-indigo-100 border-2 border-indigo-500 text-indigo-700";
                                    }

                                    return (
                                        <button
                                            key={index}
                                            onClick={() => handleSelectOption(option)}
                                            disabled={showResult}
                                            className={`w-full p-4 rounded-xl font-semibold text-left border transition-all duration-200 ${buttonClass}`}
                                        >
                                            {option}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* 結果と解説 */}
                            {showResult && (
                                <div className="mt-8">
                                    <h3 className={`text-lg font-bold mb-3 ${currentTest.type === 'quiz' ? (selectedOption === currentTest.answer ? 'text-green-600' : 'text-red-600') : 'text-blue-600'}`}>
                                        <MessageSquare className="w-5 h-5 inline mr-2 text-blue-500" />
                                        {/* 文言を汎用的に */}
                                        {currentTest.type === 'quiz'
                                            ? (selectedOption === currentTest.answer ? '🎉 正解です！ (理解度アップ)' : '❌ 不正解... (知識を習得)')
                                            : '💖 診断結果'
                                        }
                                    </h3>

                                    <div className="p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded-lg shadow-sm">
                                        <p className="text-sm text-gray-700 font-semibold mb-2">
                                            {currentTest.type === 'quiz'
                                                ? `正解は「${currentTest.answer}」でした。`
                                                : `あなたが選んだ選択肢は「${selectedOption}」です。`
                                            }
                                        </p>
                                        <p className="text-base text-gray-800 leading-relaxed">
                                            {getAnalysis()}
                                        </p>
                                    </div>

                                    <button
                                        onClick={handleNext}
                                        className="w-full mt-4 py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-md hover:bg-indigo-700"
                                    >
                                        次のテストへ ({currentIndex + 1} / {totalTests})
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 診断完了画面 */}
                    {gameState === 'finished' && (
                        <div className="text-center py-10">
                            <h2 className="text-3xl font-extrabold text-indigo-700 mb-3">
                                診断完了！
                            </h2>
                            <p className="text-xl font-bold text-gray-800 mb-3">
                                今日も一日、素晴らしい日になりますように！
                            </p>

                            <p className="p-3 bg-green-100 text-green-700 rounded-lg font-bold inline-block">
                                あなたの直感が冴えています。結果を参考に、自信を持って行動しましょう！
                            </p>

                            <button
                                onClick={fetchNewTest}
                                className="w-full mt-6 py-3 bg-green-600 text-white font-bold rounded-lg shadow-md hover:bg-green-700 flex items-center justify-center gap-2"
                            >
                                <Zap className="w-5 h-5" />
                                もう一度診断する
                            </button>
                        </div>
                    )}
                </section>

            </main>

            <footer className="text-center py-6 text-xs text-gray-400">
                © 2025 みんなの那須アプリ
            </footer>
        </div>
    );
}