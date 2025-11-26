// pages/apps/AptitudeTest.tsx
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
// 使用するアイコンのみ維持
import { ArrowLeft, Loader2, User, MessageSquare, Briefcase, Zap } from 'lucide-react';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, signInAnonymously, signOut } from 'firebase/auth';

// --- 型定義 ---
interface TestQuestion {
    id: number;
    question: string;
    options: string[];
    weight: number[]; // 各選択肢の点数
}
interface AptitudeResult {
    mainTrait: string;
    description: string;
    bestCareers: string[];
    advice: string;
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

// --- 質問データ ---
const TEST_DATA: TestQuestion[] = [
    { id: 1, question: "新しいことに挑戦するとき、あなたはどちらのタイプですか？", options: ["計画を立ててから慎重に進める", "とりあえず始めてみて、都度修正する"], weight: [1, 2] },
    { id: 2, question: "チームで作業するとき、あなたの役割は？", options: ["調整役・リーダーとして全体をまとめる", "専門的な作業に集中し、クオリティを高める"], weight: [2, 1] },
    { id: 3, question: "問題が発生したとき、どう対応しますか？", options: ["感情的になりすぎず、論理的に原因を分析する", "まずは周りの意見を聞き、共感と協力を求める"], weight: [1, 2] },
    { id: 4, question: "あなたの考える理想的な環境は？", options: ["ルールや目標が明確で、安定している場所", "変化が多く、創造性と自由度が高い場所"], weight: [1, 2] },
    { id: 5, question: "家事や育児で、最も得意なのは？", options: ["効率化・時短レシピなど仕組み作り", "子どもや家族の気持ちに寄り添うこと"], weight: [1, 2] },
];

// --- JSONスキーマ定義 (診断結果の構造) ---
const RESULT_SCHEMA = {
    type: "OBJECT",
    properties: {
        mainTrait: { type: "STRING", description: "診断された主要な性格タイプ（例：協調性重視のサポーター型）" },
        description: { type: "STRING", description: "性格の特徴と強みの説明（200文字程度）" },
        bestCareers: { type: "ARRAY", description: "向いている仕事の具体例3つ", items: { type: "STRING" } },
        advice: { type: "STRING", description: "才能を活かすための具体的な行動アドバイス" }
    },
    required: ["mainTrait", "description", "bestCareers", "advice"]
};

// --- API呼び出し関数 ---
const fetchDiagnosis = async (score: number, answers: string[]) => {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || getEnvVar('__api_key');
    if (!apiKey) throw new Error("Gemini APIキーが見つかりません。");

    // スコアに応じてプロンプトを調整
    let trait = '';
    if (score <= 5) trait = '慎重で論理的な分析型';
    else if (score <= 7) trait = 'バランスの取れた計画型';
    else trait = '直感的で創造的な行動型';

    const systemPrompt = `あなたは、キャリアと適性診断の専門家です。ユーザーの回答 (${answers.join(' | ')}) とスコア (${score}点) に基づき、そのユーザーの強みと適職を診断してください。

    【重要】
    1. 診断結果は必ずJSON形式とし、RESULT_SCHEMAに従ってください。
    2. トーンは前向きで、ユーザーの自信につながる言葉遣いを徹底してください。
    3. スコアは、${trait}の傾向を示しています。
    `;

    const userQuery = `スコア${score}点、回答の配列: [${answers.join(', ')}]。この結果から、ユーザーの隠れた才能と、子育てや家事と両立しやすい適職3つを診断してください。`;

    const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: RESULT_SCHEMA,
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

    return JSON.parse(jsonText);
};

export default function AptitudeTestApp() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [answers, setAnswers] = useState<string[]>([]); // ユーザーの回答を保持
    // gameState に 'loading' を追加して、診断中やロード中の判定を型安全に
    const [gameState, setGameState] = useState<'initial' | 'loading' | 'playing' | 'diagnosing' | 'finished'>('initial');
    const [diagnosisResult, setDiagnosisResult] = useState<AptitudeResult | null>(null);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [uiMessage, setUiMessage] = useState('');
    const [showResult, setShowResult] = useState(false); // 追加：選択後の表示フラグ

    // Firebase Auth初期化 (識別用)
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

    // --- Core Actions ---

    const handleStartTest = () => {
        // データロードが完了していない場合はフェッチから開始
        if (TEST_DATA.length === 0) {
            setUiMessage("エラー: 質問データが準備されていません。アプリをリロードしてください。");
            return;
        }

        setGameState('playing');
        setCurrentIndex(0);
        setScore(0);
        setAnswers([]);
        setDiagnosisResult(null);
        setSelectedOption(null);
        setShowResult(false);
        setUiMessage('');
    };

    const runDiagnosis = async (finalScore: number, finalAnswers: string[]) => {
        setUiMessage('診断結果をAIが分析中です...');
        setGameState('diagnosing');

        try {
            const result = await fetchDiagnosis(finalScore, finalAnswers);
            setDiagnosisResult(result);
            setGameState('finished');
            setUiMessage('');
        } catch (e: any) {
            console.error("Diagnosis failed:", e);
            setUiMessage(`診断中にエラーが発生しました: ${e.message}. 再試行してください。`);
            setDiagnosisResult(null);
            setGameState('finished');
        }
    };

    // handleNext を上部に定義（参照エラー解消のため）
    const handleNext = () => {
        // 選択済みでないなら何もしない
        if (!selectedOption) return;

        // ディレイを挟むことで、UIのクリックイベントが完全に終了するのを待つ
        setTimeout(() => {
            const currentQuestion = TEST_DATA[currentIndex];
            const selectedIndex = currentQuestion.options.findIndex(opt => opt === selectedOption);
            const addedScore = currentQuestion.weight[selectedIndex] || 0;

            // スコアと回答を確定
            const newScore = score + addedScore;
            const newAnswers = [...answers, selectedOption];

            setScore(newScore);
            setAnswers(newAnswers);

            if (currentIndex < TEST_DATA.length - 1) {
                // 次の問題へ進む
                setCurrentIndex(prev => prev + 1);
                setShowResult(false);
                setSelectedOption(null);
            } else {
                // 全問終了 -> 診断フェーズへ
                runDiagnosis(newScore, newAnswers);
            }
        }, 150); // 150msのディレイを導入
    };

    const handleSelectOption = (option: string, weight: number) => {
        if (selectedOption) return; // 二重クリック防止

        setSelectedOption(option);

        // UIの選択状態を更新
        setShowResult(true);
    };

    const handleGoCategories = () => {
        window.location.href = '/apps/categories';
    };

    const currentQuestion = TEST_DATA[currentIndex];
    const totalTests = TEST_DATA.length;

    return (
        <div className="min-h-screen bg-gray-50 font-sans pb-20">
            <Head><title>適職＆性格診断</title></Head>

            {/* ヘッダー */}
            <header className="bg-white shadow-sm sticky top-0 z-10 p-4 border-b border-gray-200">
                <div className="max-w-xl mx-auto flex items-center justify-between">
                    <button onClick={handleGoCategories} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft size={20} className="text-gray-600" />
                    </button>

                    <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <User className="w-6 h-6 text-pink-500" />
                        適職＆性格診断
                    </h1>

                    <div className="text-sm font-semibold text-gray-600">
                        {/* スコア表示を汎用的に */}
                        {gameState !== 'finished' && gameState !== 'initial' ? `進捗: ${currentIndex + 1} / ${totalTests}` : `最終結果`}
                    </div>
                </div>
            </header>

            <main className="max-w-xl mx-auto p-4 sm:p-6">

                {/* メイン診断エリア */}
                <section className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">

                    {/* --- ロード中/診断中 --- */}
                    {(gameState === 'loading' || gameState === 'diagnosing') && (
                        <div className="text-center py-20">
                            <Loader2 className="w-8 h-8 text-pink-500 animate-spin mx-auto mb-3" />
                            <p className="text-gray-600">{uiMessage || '診断を準備中...'}</p>
                            {gameState === 'diagnosing' && <p className="text-sm mt-2">AIがあなたの才能を分析しています...</p>}
                        </div>
                    )}

                    {/* --- 初期画面 --- */}
                    {gameState === 'initial' && (
                        <div className="text-center py-10">
                            <Briefcase className="w-16 h-16 text-indigo-300 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">あなたの隠れた才能を診断</h2>
                            <p className="text-gray-600 mb-6">いくつかの質問に答えるだけで、あなたの性格的強みと子育て・家事と両立しやすい適職を診断します。</p>
                            <button
                                onClick={handleStartTest}
                                className="w-full mt-4 py-3 bg-pink-600 text-white font-bold rounded-lg shadow-md hover:bg-pink-700 flex items-center justify-center gap-2"
                            >
                                <Zap size={20} />
                                診断スタート (全{TEST_DATA.length}問)
                            </button>
                        </div>
                    )}

                    {/* --- プレイ中 --- */}
                    {gameState === 'playing' && currentQuestion && (
                        <div>
                            <div className="text-center text-sm font-medium text-pink-600 mb-4">
                                {currentIndex + 1} / {TEST_DATA.length} 問目
                            </div>

                            {/* 質問文 */}
                            <h2 className="text-xl font-bold text-gray-800 mb-6 leading-relaxed">
                                {currentQuestion.question}
                            </h2>

                            {/* 選択肢ボタン */}
                            <div className="space-y-3">
                                {currentQuestion.options.map((option, index) => {
                                    const isSelected = option === selectedOption;
                                    const weight = currentQuestion.weight[index];

                                    return (
                                        <button
                                            key={index}
                                            onClick={() => handleSelectOption(option, weight)}
                                            disabled={!!selectedOption} // 選択済みなら無効化
                                            className={`w-full p-4 rounded-xl font-semibold text-left border-2 transition-all duration-200 ${
                                                isSelected
                                                    ? 'bg-pink-500 text-white shadow-lg'
                                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                                            }`}
                                        >
                                            {option}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* 結果と解説 */}
                            {showResult && selectedOption && (
                                <div className="mt-8">
                                    <h3 className="text-lg font-bold mb-3 text-blue-600">
                                        <MessageSquare className="w-5 h-5 inline mr-2 text-blue-500" />
                                        選択完了
                                    </h3>

                                    <button
                                        onClick={handleNext}
                                        className="w-full mt-4 py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-md hover:bg-indigo-700"
                                    >
                                        次の質問へ ({currentIndex + 1} / {totalTests})
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* --- 診断結果画面 --- */}
                    {gameState === 'finished' && diagnosisResult && (
                        <div className="pt-4">
                            <h2 className="text-3xl font-extrabold text-pink-600 text-center mb-4">
                                診断結果！
                            </h2>
                            <div className="p-4 bg-indigo-50 border-l-4 border-indigo-500 rounded-lg mb-6">
                                <h3 className="font-bold text-indigo-800 text-lg mb-1">{diagnosisResult.mainTrait}</h3>
                                <p className="text-gray-700 text-sm leading-relaxed">{diagnosisResult.description}</p>
                            </div>

                            {/* 適職 */}
                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                                    <Briefcase className="w-5 h-5 text-green-600" />
                                    あなたにぴったりの適職
                                </h3>
                                <ul className="space-y-2">
                                    {diagnosisResult.bestCareers.map((career: string, index: number) => (
                                        <li key={index} className="p-3 bg-gray-100 rounded-lg text-sm font-medium">
                                            {index + 1}. {career}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* アドバイス */}
                            <div className="p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded-lg">
                                <h3 className="font-bold text-yellow-800 text-lg mb-1">
                                    才能を活かすためのアドバイス
                                </h3>
                                <p className="text-gray-700 text-sm leading-relaxed">
                                    {diagnosisResult.advice}
                                </p>
                            </div>

                            <button
                                onClick={handleStartTest}
                                className="w-full mt-6 py-3 bg-green-600 text-white font-bold rounded-lg shadow-md hover:bg-green-700 flex items-center justify-center gap-2"
                            >
                                もう一度診断する
                            </button>
                        </div>
                    )}

                    {/* エラーメッセージ (finished状態でも表示) */}
                    {gameState === 'finished' && !diagnosisResult && (
                        <div className="text-center py-10">
                            <p className="text-red-500 font-bold">{uiMessage}</p>
                            <button onClick={handleStartTest} className="mt-4 py-2 px-4 bg-red-600 text-white rounded-lg">再試行</button>
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
