import React, { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
// ★修正: signOut関数を分離
import { getAuth, signInAnonymously, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth'; 
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore'; 
import { IoReloadOutline } from 'react-icons/io5'; 
// ★修正: 未使用アイコンを削除
import { ArrowLeft, AlertTriangle, Loader2, Gamepad, Zap, LogOut, MessageSquare, Trophy, Brain } from 'lucide-react'; 

// --- 型定義 ---
interface Question {
    question: string;
    options: string[];
    answer: string;
    explanation: string;
}
interface UserStats {
    bestScore: number;
    lastPlayedDate: string;
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

// --- JSONスキーマ定義 (クイズの構造) ---
const QUIZ_SCHEMA = {
    type: "OBJECT",
    properties: {
        quiz: {
            type: "ARRAY",
            description: "地域に関するクイズ5問",
            items: {
                type: "OBJECT",
                properties: {
                    question: { type: "STRING", description: "三択問題の質問文" },
                    options: { type: "ARRAY", description: "3つの選択肢", items: { type: "STRING" } },
                    answer: { type: "STRING", description: "正しい選択肢のテキスト" },
                    explanation: { type: "STRING", description: "答えの解説" }
                },
                required: ["question", "options", "answer", "explanation"]
            }
        }
    },
    required: ["quiz"]
};

// --- API呼び出し関数 ---
const fetchWithApiKey = async (systemPrompt: string, userQuery: string) => {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || getEnvVar('__api_key');
    if (!apiKey) throw new Error("Gemini APIキーが見つかりません。");

    const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: QUIZ_SCHEMA,
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
    
    return JSON.parse(jsonText).quiz;
};


export default function QuizGameApp() {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [gameState, setGameState] = useState<'loading' | 'playing' | 'finished'>('loading');
    const [currentAnswer, setCurrentAnswer] = useState<string | null>(null); // ユーザーの選択
    const [showAnswer, setShowAnswer] = useState(false);
    const [uiMessage, setUiMessage] = useState('');
    
    const [user, setUser] = useState<any>(null); // 認証情報保持
    const [userStats, setUserStats] = useState<UserStats>({ bestScore: 0, lastPlayedDate: '' });
    
    // Firebaseインスタンス
    const [db, setDb] = useState<ReturnType<typeof getFirestore> | null>(null);
    const appId = 'nasu-quiz-app';
    
    // 今日の日付を YYYY-MM-DD 形式で取得
    const todayDateString = useMemo(() => {
        return new Date().toISOString().substring(0, 10);
    }, []);

    // Firebase認証とデータロード
    useEffect(() => {
        let authService: ReturnType<typeof getAuth>;
        try {
            const firebaseConfigRaw = getEnvVar('__firebase_config');
            if (firebaseConfigRaw) {
                const firebaseConfig = JSON.parse(firebaseConfigRaw);
                const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
                authService = getAuth(app);
                setDb(getFirestore(app));
                firebaseSignOut(authService); // 前回セッションをクリア
                signInAnonymously(authService); 
            } else {
                return; // Firebase設定がなければ処理を中断
            }
        } catch (e) {
            console.error("Firebase init error:", e);
            return;
        }
        
        const unsubscribe = onAuthStateChanged(authService, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);
    
    // ユーザーの統計情報をFirestoreからロード
    useEffect(() => {
        if (!user || !db) return;

        const loadStats = async () => {
            try {
                // Path: /artifacts/{appId}/users/{userId}/stats/quiz
                const statsRef = doc(db, 'artifacts', appId, 'users', user.uid, 'stats', 'quiz');
                const statsSnap = await getDoc(statsRef);
                
                if (statsSnap.exists()) {
                    const data = statsSnap.data() as UserStats;
                    setUserStats({
                        bestScore: data.bestScore || 0,
                        lastPlayedDate: data.lastPlayedDate || ''
                    });
                } else {
                    setUserStats({ bestScore: 0, lastPlayedDate: '' });
                }
            } catch (e) {
                console.error("Failed to load user stats:", e);
            }
        };
        loadStats();
    }, [user, db]);

    // クイズデータのフェッチ
    const fetchQuiz = async (allowReload = false) => {
        // 当日プレイ済みの場合はリロードを許可しない
        if (!allowReload && userStats.lastPlayedDate === todayDateString && userStats.bestScore > 0) {
            setUiMessage('今日は既に挑戦済みです。明日また挑戦しましょう！');
            setGameState('finished');
            return;
        }

        setGameState('loading');
        setUiMessage('那須地区の豆知識をAIが検索・生成中です...');

        // ★修正: プロンプトでターゲット地域を明確化
        const systemPrompt = `あなたは那須地域専門のクイズ作家です。那須塩原市、大田原市、那須町に関する歴史、観光スポット、名産品、文化の豆知識クイズを3択形式で5問作成してください。`;
        const userQuery = `那須塩原市、大田原市、那須町に関する、面白くてためになるクイズを5問生成し、必ずJSONスキーマに従って回答してください。`;

        try {
            const quizData = await fetchWithApiKey(systemPrompt, userQuery);
            setQuestions(quizData);
            setGameState('playing');
            setScore(0);
            setCurrentQuestionIndex(0);
            setShowAnswer(false);
            setUiMessage('クイズ開始！');
        } catch (e: any) {
            console.error("Quiz fetch failed:", e);
            setUiMessage(`クイズの生成に失敗しました: ${e.message}. 再試行してください。`);
            setGameState('finished'); 
        }
    };
    
    // 初回ロード
    useEffect(() => {
        fetchQuiz();
    }, [userStats.lastPlayedDate]); // 統計情報がロードされた後に実行

    // ユーザーの統計情報を更新
    const updateStats = async (finalScore: number) => {
        if (!user || !db) return;
        
        const statsRef = doc(db, 'artifacts', appId, 'users', user.uid, 'stats', 'quiz');
        const currentBest = userStats.bestScore;

        if (finalScore > currentBest) {
             // ベストスコアを更新
             await setDoc(statsRef, {
                 bestScore: finalScore,
                 lastPlayedDate: todayDateString,
             }, { merge: true });
             setUserStats({ bestScore: finalScore, lastPlayedDate: todayDateString });
             setUiMessage(`🎉 新記録達成！ベストスコアを ${finalScore} 点に更新しました！`);
        } else {
            // スコアを更新せず、最終プレイ日のみ更新
            await setDoc(statsRef, { lastPlayedDate: todayDateString }, { merge: true });
            setUserStats(prev => ({ ...prev, lastPlayedDate: todayDateString }));
            setUiMessage(`本日の挑戦終了です。ベストスコアは ${currentBest} 点です。`);
        }
    };


    const handleAnswer = (selectedOption: string) => {
        if (showAnswer) return;

        setCurrentAnswer(selectedOption);
        setShowAnswer(true);

        const currentQuestion = questions[currentQuestionIndex];
        if (selectedOption === currentQuestion.answer) {
            setScore(prev => prev + 1);
        }
    };

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            // ディレイは不要、しかし誤作動を防ぐために150msのディレイを維持
            setTimeout(() => {
                setCurrentQuestionIndex(prev => prev + 1);
                setShowAnswer(false);
                setCurrentAnswer(null);
            }, 150);
        } else {
            // ゲーム終了時に統計情報を更新
            updateStats(score);
            setGameState('finished');
        }
    };

    const currentQuestion = questions[currentQuestionIndex];
    const totalQuestions = questions.length;
    
    // リンクの代わりにボタンを使用し、window.locationで遷移させる
    const handleGoCategories = () => {
        window.location.href = '/apps/categories';
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans pb-20">
            <Head><title>那須地区マスターズクイズ</title></Head>

            {/* ヘッダー */}
            <header className="bg-white shadow-sm sticky top-0 z-10 p-4 border-b border-gray-200">
                <div className="max-w-xl mx-auto flex items-center justify-between">
                    <button onClick={handleGoCategories} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft size={20} className="text-gray-600" />
                    </button>
                    
                    <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Gamepad className="w-6 h-6 text-indigo-500" />
                        那須地区マスターズクイズ
                    </h1>
                    
                    <div className="flex items-center gap-4 text-sm font-semibold text-gray-600">
                        <div className="text-right">
                           ベスト: <Trophy className="w-4 h-4 inline text-yellow-600" /> <span className="font-bold text-lg text-yellow-700">{userStats.bestScore}</span>
                        </div>
                        <div>
                            現在スコア: <span className="font-bold text-lg text-pink-500">{score}</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-xl mx-auto p-4 sm:p-6">
                
                {/* 制限表示セクション */}
                {userStats.lastPlayedDate === todayDateString && gameState !== 'playing' && (
                    <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-800 rounded-lg shadow-md">
                        <p className="font-bold flex items-center gap-2">
                            <Zap className="w-4 h-4" /> 本日の挑戦は終了しました。
                        </p>
                        <p className="text-sm mt-1">最終スコアは {userStats.bestScore} 点です。明日、また那須マスターを目指しましょう！</p>
                        <button
                            onClick={() => fetchQuiz(true)}
                            className="mt-3 px-3 py-1 bg-red-500 text-white rounded-md text-xs hover:bg-red-600"
                        >
                            結果を無視して再生成 (デバッグ用)
                        </button>
                    </div>
                )}
                
                {/* メインゲームエリア */}
                <section className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                    
                    {gameState === 'loading' && (
                        <div className="text-center py-20">
                            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-3" />
                            <p className="text-gray-600">{uiMessage}</p>
                        </div>
                    )}

                    {gameState === 'playing' && currentQuestion && (
                        <div>
                            <div className="text-center text-sm font-medium text-indigo-600 mb-4">
                                {currentQuestionIndex + 1} / {totalQuestions} 問目
                            </div>

                            {/* クイズ質問文 */}
                            <h2 className="text-xl font-bold text-gray-800 mb-6 leading-relaxed">
                                <Zap className="w-5 h-5 inline mr-2 text-yellow-500" />
                                {currentQuestion.question}
                            </h2>

                            {/* 選択肢ボタン */}
                            <div className="space-y-3">
                                {currentQuestion.options.map((option, index) => {
                                    const isCorrect = showAnswer && option === currentQuestion.answer;
                                    const isSelected = option === currentAnswer;
                                    
                                    let buttonClass = "bg-gray-100 hover:bg-gray-200 text-gray-800";
                                    
                                    if (showAnswer) {
                                        if (isCorrect) {
                                            buttonClass = "bg-green-500 text-white shadow-lg border-green-700";
                                        } else if (isSelected) {
                                            buttonClass = "bg-red-500 text-white shadow-lg border-red-700";
                                        } else {
                                            buttonClass = "bg-gray-200 text-gray-500 cursor-not-allowed";
                                        }
                                    }

                                    return (
                                        <button
                                            key={index}
                                            onClick={() => handleAnswer(option)}
                                            disabled={showAnswer}
                                            className={`w-full p-4 rounded-xl font-semibold text-left border-2 transition-all duration-200 ${buttonClass}`}
                                        >
                                            {option}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* 回答解説と次の問題ボタン */}
                            {showAnswer && (
                                <div className="mt-8">
                                    <h3 className={`text-lg font-bold mb-3 ${currentAnswer === currentQuestion.answer ? 'text-green-600' : 'text-red-600'}`}>
                                        {currentAnswer === currentQuestion.answer ? '🎉 正解です！' : '❌ 不正解...'}
                                    </h3>
                                    
                                    <div className="p-4 bg-indigo-50 border-l-4 border-indigo-500 rounded-lg">
                                        <p className="text-sm text-gray-700 font-semibold mb-1">解説:</p>
                                        <p className="text-sm text-gray-600">{currentQuestion.explanation}</p>
                                    </div>

                                    <button
                                        onClick={handleNext}
                                        className="w-full mt-4 py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-md hover:bg-indigo-700"
                                    >
                                        次の問題へ ({currentQuestionIndex + 1} / {totalQuestions})
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {gameState === 'finished' && (
                        <div className="text-center py-10">
                            <h2 className="text-3xl font-extrabold text-indigo-700 mb-3">
                                クイズ終了！
                            </h2>
                            <p className="text-xl font-bold text-gray-800 mb-3">
                                最終スコア: <span className="text-pink-500">{score}</span> / {totalQuestions} 問正解
                            </p>
                            
                            <button
                                onClick={() => fetchQuiz(true)}
                                className="w-full mt-6 py-3 bg-green-600 text-white font-bold rounded-lg shadow-md hover:bg-green-700 flex items-center justify-center gap-2"
                            >
                                <IoReloadOutline className="w-5 h-5" />
                                もう一度プレイする
                            </button>
                        </div>
                    )}
                </section>
                
                {/* エラーメッセージ */}
                {gameState !== 'loading' && uiMessage && (
                    <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        {uiMessage}
                    </div>
                )}
            </main>
            
            <footer className="text-center py-6 text-xs text-gray-400">
                © 2025 みんなの那須アプリ
            </footer>
        </div>
    );
}