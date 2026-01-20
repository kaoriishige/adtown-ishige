import React, { useState, useCallback, useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ArrowLeft, Camera, Send, MessageSquare, Trash2, CheckCircle, Lightbulb, Loader2, RefreshCw } from 'lucide-react';
import Image from 'next/image';

// --- 型定義 ---
interface Dialogue {
    type: 'ai' | 'user';
    content: string;
}

// --- AI診断の質問と回答のフロー定義（ダミー） ---
const AI_QUESTIONS = [
    {
        id: 1,
        question: "診断したい衣類は、過去1年間で何回着用しましたか？",
        options: ["0回 (全く着ていない)", "1～2回", "3回以上"]
    },
    {
        id: 2,
        question: "その衣類を着た時に、あなたは心から満足しましたか？（気分が上がったか）",
        options: ["はい（満足した）", "いいえ（満足しなかった）", "覚えていない"]
    },
    {
        id: 3,
        question: "もしこの衣類が今日お店に売られていたら、今のあなたは購入しますか？",
        options: ["購入する", "購入しない", "迷う"]
    },
];

// --- メインコンポーネント ---
export default function ClosetSlimmerAI() {
    const router = useRouter();
    const [phase, setPhase] = useState<'initial' | 'asking' | 'result'>('initial');
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [dialogueHistory, setDialogueHistory] = useState<Dialogue[]>([]);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // --- 診断結果の計算（ダミーロジック） ---
    const finalAdvice = useMemo(() => {
        // 実際にはdialogueHistoryに基づいて複雑なAI判定を行う
        if (dialogueHistory.some(d => d.content.includes("0回 (全く着ていない)") && d.type === 'user')) {
            return {
                action: "処分を検討",
                message: "1年間未着用は、手放す強力なサインです。誰かの役に立つか、売却を検討しましょう。",
                color: "text-red-600 bg-red-50"
            };
        }
        return {
            action: "一旦保留",
            message: "判断材料が不足しています。次の季節に試着するか、一箇所にまとめて保管を推奨します。",
            color: "text-yellow-600 bg-yellow-50"
        };
    }, [dialogueHistory]);

    // --- 診断を初期状態に戻す (別の衣類を診断する機能) ---
    const resetDiagnosis = useCallback(() => {
        setPhase('initial');
        setCurrentQuestionIndex(0);
        setDialogueHistory([]);
        setImageUrl(null); // 画像もリセット
        setIsLoading(false);
    }, []);

    // --- 写真アップロードのシミュレーション ---
    const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setImageUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    }, []);

    // --- 診断開始 ---
    const startDiagnosis = useCallback(() => {
        if (!imageUrl) return;
        setIsLoading(true);
        setPhase('asking');
        setDialogueHistory([
            { type: 'ai', content: `画像を受け取りました。AIクローゼット診断を開始します。\nこの服を維持するか処分するか、一緒に考えていきましょう！` }
        ]);

        // 最初の質問を遅延して表示
        setTimeout(() => {
            setIsLoading(false);
            setCurrentQuestionIndex(0);
        }, 1500);
    }, [imageUrl]);

    // --- ユーザーの回答処理 ---
    const handleAnswer = useCallback((answer: string) => {
        setIsLoading(true);

        // ユーザーの回答を履歴に追加
        setDialogueHistory(prev => [...prev, { type: 'user', content: answer }]);

        // 次の質問へ
        const nextIndex = currentQuestionIndex + 1;

        setTimeout(() => {
            if (nextIndex < AI_QUESTIONS.length) {
                // まだ質問が残っている場合
                setCurrentQuestionIndex(nextIndex);
                setIsLoading(false);
            } else {
                // すべての質問が終了した場合 -> 結果へ
                setPhase('result');
                setIsLoading(false);
            }
        }, 1000); // 処理中のロード時間シミュレーション
    }, [currentQuestionIndex]);

    // --- 戻るボタンの制御 ---
    const handleBack = useCallback(() => {
        router.push('/premium/dashboard');
    }, [router]);

    // --- 現在のAIメッセージ ---
    const currentQuestion = AI_QUESTIONS[currentQuestionIndex];

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
            <Head>
                <title>AIクローゼットスリム化診断</title>
            </Head>

            {/* ヘッダー */}
            <header className="bg-white shadow-sm sticky top-0 z-10 p-4 border-b border-gray-200">
                <div className="max-w-xl mx-auto flex items-center gap-3">
                    <button
                        onClick={handleBack}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <WashingMachine className="w-6 h-6 text-indigo-600" />
                        AIクローゼット診断
                    </h1>
                </div>
            </header>

            <main className="max-w-xl mx-auto p-4 sm:p-6 pb-20">

                {/* 1. 写真アップロード/表示エリア */}
                <section className={`mb-6 p-4 border rounded-xl bg-white shadow-md transition-opacity duration-500 ${phase !== 'initial' ? 'opacity-50' : ''}`}>
                    <h2 className="text-lg font-bold text-gray-700 mb-3 flex items-center gap-2">
                        <Camera className="w-5 h-5 text-indigo-500" />
                        診断したい衣類の写真
                    </h2>

                    <div className="flex flex-col items-center">
                        {imageUrl ? (
                            <div className="relative w-40 h-40 mb-3 border-4 border-indigo-400 rounded-lg overflow-hidden">
                                {/* 👚ここに診断したい衣類の写真を表示 */}
                                <Image
                                    src={imageUrl}
                                    alt="Uploaded clothing item"
                                    layout="fill"
                                    objectFit="cover"
                                />
                            </div>
                        ) : (
                            <div className="w-full h-40 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg mb-3 bg-gray-50">
                                <span className="text-gray-500">写真をアップロードしてください</span>
                            </div>
                        )}

                        <label htmlFor="image-upload" className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors cursor-pointer ${phase === 'initial'
                                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                            }`}>
                            写真を選択/撮影
                            <input
                                id="image-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageUpload}
                                disabled={phase !== 'initial'}
                            />
                        </label>
                    </div>

                    <button
                        onClick={startDiagnosis}
                        disabled={!imageUrl || phase !== 'initial'}
                        className={`mt-4 w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${imageUrl && phase === 'initial'
                                ? 'bg-green-500 text-white hover:bg-green-600 shadow-md'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                    >
                        <Lightbulb className="w-5 h-5" />
                        AI診断を開始する
                    </button>
                </section>

                {/* 2. AI対話エリア */}
                {(phase === 'asking' || phase === 'result') && (
                    <section className="mt-8 p-4 bg-white rounded-xl shadow-md">
                        <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2 border-b pb-2">
                            <MessageSquare className="w-5 h-5 text-purple-500" />
                            AIとの対話
                        </h2>

                        {/* 対話履歴 */}
                        <div className="h-64 overflow-y-auto space-y-4 pr-2 border-b pb-4">
                            {dialogueHistory.map((d, index) => (
                                <div key={index} className={`flex ${d.type === 'ai' ? 'justify-start' : 'justify-end'}`}>
                                    <div className={`max-w-[80%] p-3 rounded-xl text-sm whitespace-pre-wrap shadow-sm ${d.type === 'ai'
                                            ? 'bg-purple-100 text-purple-800 rounded-tl-none'
                                            : 'bg-indigo-500 text-white rounded-tr-none'
                                        }`}>
                                        {d.content}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="max-w-[80%] p-3 rounded-xl text-sm bg-purple-100 text-purple-800 rounded-tl-none flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        AIが考え中...
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 質問と回答ボタン */}
                        {phase === 'asking' && !isLoading && (
                            <div className="mt-4">
                                <p className="font-semibold mb-2 text-gray-700">AIからの質問:</p>
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-3">
                                    {currentQuestion.question}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {currentQuestion.options.map((option, index) => (
                                        <button
                                            key={index}
                                            onClick={() => handleAnswer(option)}
                                            className="px-4 py-2 bg-indigo-500 text-white text-sm font-medium rounded-full hover:bg-indigo-600 transition-colors shadow-md"
                                        >
                                            {option}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 3. 診断結果エリア */}
                        {phase === 'result' && (
                            <div className="mt-6 border-t pt-4">
                                <h3 className="text-xl font-bold text-green-600 mb-3 flex items-center gap-2">
                                    <CheckCircle className="w-6 h-6" />
                                    AI診断結果
                                </h3>
                                <div className={`p-4 rounded-xl shadow-lg border-l-4 ${finalAdvice.color} border-current`}>
                                    <p className="text-lg font-bold mb-1">推奨アクション: {finalAdvice.action}</p>
                                    <p className="text-gray-700">{finalAdvice.message}</p>
                                </div>

                                {/* 修正されたボタン群 */}
                                <div className="space-y-3 mt-4">
                                    <button
                                        onClick={resetDiagnosis} // 診断をリセットする新しいボタン
                                        className="w-full py-3 bg-indigo-500 text-white font-bold rounded-xl hover:bg-indigo-600 transition-colors shadow-md flex items-center justify-center gap-2"
                                    >
                                        <RefreshCw className="w-5 h-5" />
                                        別の衣類を診断する
                                    </button>
                                    <button
                                        onClick={handleBack}
                                        className="w-full py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors shadow-md flex items-center justify-center gap-2"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                        診断を終了してダッシュボードへ戻る
                                    </button>
                                </div>
                            </div>
                        )}

                    </section>
                )}
            </main>
        </div>
    );
}

// アイコンの定義
import { WashingMachine } from 'lucide-react';