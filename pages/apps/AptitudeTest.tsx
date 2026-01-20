import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, User, MessageSquare, Briefcase, Zap } from 'lucide-react';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';

// --- 型定義 ---
interface TestQuestion {
    id: number;
    question: string;
    options: string[];
    weight: number[];
}
interface AptitudeResult {
    mainTrait: string;
    description: string;
    bestCareers: string[];
    advice: string;
}

const getEnvVar = (name: string): any => {
    if (typeof window !== 'undefined' && (window as any)[name] !== undefined) {
        return (window as any)[name];
    }
    return undefined;
};

const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent`;

const TEST_DATA: TestQuestion[] = [
    { id: 1, question: "新しいことに挑戦するとき、あなたはどちらのタイプですか？", options: ["計画を立ててから慎重に進める", "とりあえず始めてみて、都度修正する"], weight: [1, 2] },
    { id: 2, question: "チームで作業するとき、あなたの役割は？", options: ["調整役・リーダーとして全体をまとめる", "専門的な作業に集中し、クオリティを高める"], weight: [2, 1] },
    { id: 3, question: "問題が発生したとき、どう対応しますか？", options: ["感情的になりすぎず、論理的に原因を分析する", "まずは周りの意見を聞き、共感と協力を求める"], weight: [1, 2] },
    { id: 4, question: "あなたの考える理想的な環境は？", options: ["ルールや目標が明確で、安定している場所", "変化が多く、創造性と自由度が高い場所"], weight: [1, 2] },
    { id: 5, question: "家事や育児で、最も得意なのは？", options: ["効率化・時短レシピなど仕組み作り", "子どもや家族の気持ちに寄り添うこと"], weight: [1, 2] },
    { id: 6, question: "初対面の人と話すのは、得意な方ですか？", options: ["緊張するが、必要なコミュニケーションは取れる", "物怖じせず、自分から積極的に話しかけられる"], weight: [1, 2] },
    { id: 7, question: "作業の好みとして、しっくりくるのは？", options: ["数字やデータをコツコツ扱う正確な作業", "文章を書いたりデザインを考える創造的な作業"], weight: [1, 2] },
];

const RESULT_SCHEMA = {
    type: "OBJECT",
    properties: {
        mainTrait: { type: "STRING", description: "診断された主要な性格タイプ" },
        description: { type: "STRING", description: "性格の特徴と強みの説明（200文字程度）" },
        bestCareers: { type: "ARRAY", description: "向いている仕事の具体例3つ", items: { type: "STRING" } },
        advice: { type: "STRING", description: "才能を活かすための具体的な行動アドバイス" }
    },
    required: ["mainTrait", "description", "bestCareers", "advice"]
};

const fetchDiagnosis = async (score: number, answers: string[]) => {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || getEnvVar('__api_key');
    if (!apiKey) throw new Error("Gemini APIキーが見つかりません。");

    const systemPrompt = `あなたは、キャリアと適性診断の専門家です。ユーザーの回答とスコアに基づき、そのユーザーの強みと適職を診断してください。地域環境や地理的条件は考慮しないでください。
    1. 診断結果は必ずJSON形式とし、RESULT_SCHEMAに従ってください。
    2. トーンは前向きな言葉遣いを徹底してください。`;

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

    const result = await response.json();
    const jsonText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    return JSON.parse(jsonText);
};

export default function AptitudeTestApp() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [answers, setAnswers] = useState<string[]>([]);
    const [gameState, setGameState] = useState<'initial' | 'playing' | 'diagnosing' | 'finished'>('initial');
    const [diagnosisResult, setDiagnosisResult] = useState<AptitudeResult | null>(null);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [uiMessage, setUiMessage] = useState('');

    useEffect(() => {
        try {
            const firebaseConfigRaw = getEnvVar('__firebase_config');
            if (firebaseConfigRaw) {
                const firebaseConfig = JSON.parse(firebaseConfigRaw);
                const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
                const auth = getAuth(app);
                signInAnonymously(auth);
            }
        } catch (e) { console.error("Firebase init error:", e); }
    }, []);

    // 選択時に自動で次へ進むロジック
    const handleSelectOption = (option: string) => {
        setSelectedOption(option);

        // 0.6秒待ってから自動遷移
        setTimeout(() => {
            const currentQuestion = TEST_DATA[currentIndex];
            const selectedIndex = currentQuestion.options.findIndex(opt => opt === option);
            const addedScore = currentQuestion.weight[selectedIndex] || 0;

            const newScore = score + addedScore;
            const newAnswers = [...answers, option];

            if (currentIndex < TEST_DATA.length - 1) {
                setScore(newScore);
                setAnswers(newAnswers);
                setCurrentIndex(prev => prev + 1);
                setSelectedOption(null);
            } else {
                setGameState('diagnosing');
                runDiagnosis(newScore, newAnswers);
            }
        }, 600);
    };

    const runDiagnosis = async (fs: number, fa: string[]) => {
        setUiMessage('診断結果をAIが分析中です...');
        try {
            const result = await fetchDiagnosis(fs, fa);
            setDiagnosisResult(result);
            setGameState('finished');
        } catch (e: any) {
            setUiMessage(`診断エラーが発生しました。`);
            setGameState('finished');
        }
    };

    const currentQuestion = TEST_DATA[currentIndex];

    return (
        <div className="min-h-screen bg-gray-50 font-sans pb-20">
            <header className="bg-white shadow-sm sticky top-0 z-10 p-4 border-b border-gray-200">
                <div className="max-w-xl mx-auto flex items-center justify-between">
                    <button onClick={() => window.location.href = '/premium/dashboard'} className="p-2 hover:bg-gray-100 rounded-full">
                        <ArrowLeft size={20} className="text-gray-600" />
                    </button>
                    <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <User className="w-6 h-6 text-pink-500" /> 適職＆性格診断
                    </h1>
                    <div className="text-sm font-semibold text-gray-600">
                        {gameState === 'playing' ? `${currentIndex + 1} / 7` : ''}
                    </div>
                </div>
            </header>

            <main className="max-w-xl mx-auto p-4 sm:p-6">
                <section className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">

                    {gameState === 'initial' && (
                        <div className="text-center py-10">
                            <Briefcase className="w-16 h-16 text-indigo-300 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">あなたの隠れた才能を診断</h2>
                            <p className="text-gray-600 mb-6 text-sm">7つの質問に答えるだけで、あなたの強みと適職を診断します。</p>
                            <button onClick={() => setGameState('playing')} className="w-full mt-4 py-3 bg-pink-600 text-white font-bold rounded-lg shadow-md flex items-center justify-center gap-2">
                                <Zap size={20} /> 診断スタート (全7問)
                            </button>
                        </div>
                    )}

                    {gameState === 'playing' && currentQuestion && (
                        <div>
                            <div className="text-center text-sm font-medium text-pink-600 mb-4">{currentIndex + 1} / 7 問目</div>
                            <h2 className="text-xl font-bold text-gray-800 mb-6 leading-relaxed">{currentQuestion.question}</h2>
                            <div className="space-y-3">
                                {currentQuestion.options.map((option, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleSelectOption(option)}
                                        className={`w-full p-4 rounded-xl font-semibold text-left border-2 transition-all duration-200 ${option === selectedOption ? 'bg-pink-500 text-white shadow-lg border-pink-500' : 'bg-gray-100 border-gray-100 text-gray-800'}`}
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {gameState === 'diagnosing' && (
                        <div className="text-center py-20">
                            <Loader2 className="w-8 h-8 text-pink-500 animate-spin mx-auto mb-3" />
                            <p className="text-gray-600">{uiMessage}</p>
                        </div>
                    )}

                    {gameState === 'finished' && diagnosisResult && (
                        <div className="pt-4 animate-in fade-in">
                            <h2 className="text-3xl font-extrabold text-pink-600 text-center mb-4">診断結果！</h2>
                            <div className="p-4 bg-indigo-50 border-l-4 border-indigo-500 rounded-lg mb-6 text-sm">
                                <h3 className="font-bold text-indigo-800 text-lg mb-1">{diagnosisResult.mainTrait}</h3>
                                {diagnosisResult.description}
                            </div>
                            <div className="mb-6">
                                <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2"><Briefcase className="w-5 h-5 text-green-600" /> 適職</h3>
                                {diagnosisResult.bestCareers.map((c, i) => (
                                    <div key={i} className="p-3 bg-gray-100 rounded-lg text-sm mb-2 font-medium">{i + 1}. {c}</div>
                                ))}
                            </div>
                            <div className="p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded-lg text-sm mb-6">
                                <h4 className="font-bold text-yellow-800 mb-1">アドバイス</h4>
                                {diagnosisResult.advice}
                            </div>
                            <button onClick={() => setGameState('initial')} className="w-full py-3 bg-pink-600 text-white font-bold rounded-lg">もう一度診断する</button>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}