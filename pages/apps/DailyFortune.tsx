import React, { useState, useEffect } from 'react'; // useMemoを削除
import Head from 'next/head';
import { ArrowLeft, Sparkles, Calendar, Gift, Loader2, LogOut } from 'lucide-react'; // AlertTriangle, ChevronDownを削除
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
// ★修正: signOutをインポートリストに追加
import { getAuth, signInAnonymously, onAuthStateChanged, signOut, signInWithCustomToken } from 'firebase/auth';

// --- 環境変数の取得 (APIキー用) ---
const getEnvVar = (name: string): any => {
    if (typeof window !== 'undefined' && (window as any)[name] !== undefined) {
        return (window as any)[name];
    }
    return undefined;
};

// Gemini API のエンドポイント
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent`;

// --- JSONスキーマ定義 (運勢の結果構造) ---
const FORTUNE_SCHEMA = {
    type: "OBJECT",
    properties: {
        overall: { type: "STRING", description: "今日の総合運 (150文字以内)" },
        love: { type: "STRING", description: "今日の恋愛運 (70文字以内)" },
        work: { type: "STRING", description: "今日の仕事運 (70文字以内)" },
        money: { type: "STRING", description: "今日の金運 (70文字以内)" },
        luckyItem: { type: "STRING", description: "ラッキーアイテム" },
        advice: { type: "STRING", description: "運気を上げるための具体的な行動アドバイス" }
    },
    required: ["overall", "love", "work", "money", "luckyItem", "advice"]
};


export default function DailyFortuneApp() {
    const [birthday, setBirthday] = useState('');
    const [fortuneResult, setFortuneResult] = useState<any>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [uiMessage, setUiMessage] = useState('');

    const [user, setUser] = useState<any>(null);

    // Firebase Auth初期化 (Authインスタンスとログイン状態の取得)
    useEffect(() => {
        const firebaseConfigRaw = getEnvVar('__firebase_config');
        const initialAuthToken = getEnvVar('__initial_auth_token') || null;

        if (!firebaseConfigRaw) {
            // Firebase設定がなくてもGeminiは動くため、警告のみ
            return;
        }

        try {
            const firebaseConfig = JSON.parse(firebaseConfigRaw);
            const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
            const auth = getAuth(app);

            // 認証試行
            if (initialAuthToken) {
                signInWithCustomToken(auth, initialAuthToken as string);
            } else {
                signInAnonymously(auth);
            }

            // 認証状態の監視
            onAuthStateChanged(auth, (currentUser) => {
                setUser(currentUser);
            });
        } catch (e: any) {
            console.error("Firebase Initialization Error:", e);
        }
    }, []);

    // API呼び出し関数
    const fetchFortune = async () => {
        setIsGenerating(true);
        setFortuneResult(null);
        setUiMessage('');

        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || getEnvVar('__api_key');
        if (!apiKey) {
            setUiMessage("エラー: Gemini APIキーが設定されていません。");
            setIsGenerating(false);
            return;
        }

        // 入力チェック
        if (!birthday) {
            setUiMessage("生年月日を入力してください。");
            setIsGenerating(false);
            return;
        }

        const dateString = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
        const systemPrompt = `あなたは、日本の那須地域専門の、優しくポジティブな運勢鑑定AIです。生年月日(${birthday})に基づき、今日の運勢を診断してください。
        
        【診断日】: ${dateString}
        
        【重要】
        1. 出力は必ずJSON形式とし、FORTUNE_SCHEMAに従ってください。
        2. 全ての運勢は非常にポジティブで、希望を与える内容にしてください。
        3. 運勢の根拠や生成過程は不要です。診断結果のみを簡潔に出力してください。
        `;

        try {
            const payload = {
                contents: [{ parts: [{ text: "今日の運勢を診断してください。" }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] },
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: FORTUNE_SCHEMA,
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
                setFortuneResult(parsedJson);
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

    // リンクの代わりにボタンを使用し、window.locationで遷移させる
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
            <Head><title>今日の運勢占い</title></Head>

            {/* ヘッダー */}
            <header className="bg-white shadow-sm sticky top-0 z-10 p-4 border-b border-gray-200">
                <div className="max-w-xl mx-auto flex items-center justify-between">
                    <button onClick={handleGoCategories} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft size={20} className="text-gray-600" />
                    </button>

                    <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Sparkles className="w-6 h-6 text-yellow-500" />
                        今日の運勢占い
                    </h1>

                    {/* 認証済みの場合のみログアウトボタンを表示 */}
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

                {/* 入力フォーム */}
                <section className="mb-8 bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                    <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
                        <Calendar size={20} /> あなたの生年月日
                    </h2>
                    <input
                        type="date"
                        value={birthday}
                        onChange={(e) => setBirthday(e.target.value)}
                        required
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500 text-lg font-semibold text-gray-700"
                    />
                    <button
                        onClick={fetchFortune}
                        disabled={isGenerating || !birthday}
                        className="w-full mt-4 py-3 bg-yellow-500 text-white font-bold rounded-lg shadow-md hover:bg-yellow-600 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                    >
                        {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                        今日の運勢を占う
                    </button>
                </section>

                {/* 運勢結果表示 */}
                {fortuneResult && (
                    <section className="bg-white p-6 rounded-xl shadow-xl border border-yellow-400">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Gift className="w-6 h-6 text-pink-500" />
                            {new Date().toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' })} の運勢
                        </h2>

                        {/* 総合運 */}
                        <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded-lg">
                            <h3 className="font-bold text-yellow-800 mb-1 flex items-center gap-2">
                                総合運
                            </h3>
                            <p className="text-base text-gray-700 leading-relaxed">{fortuneResult.overall}</p>
                        </div>

                        {/* 詳細運 */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            {['love', 'work', 'money'].map(key => (
                                <div key={key} className="p-3 border border-gray-200 rounded-lg">
                                    <h4 className="text-sm font-bold text-gray-600 mb-1 capitalize">
                                        {key === 'love' ? '恋愛運' : key === 'work' ? '仕事運' : '金運'}
                                    </h4>
                                    <p className="text-gray-700 text-sm">{fortuneResult[key]}</p>
                                </div>
                            ))}
                        </div>

                        {/* ラッキーアイテムとアドバイス */}
                        <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                            <p className="font-bold text-md text-gray-700 flex items-center gap-2">
                                ✨ ラッキーアイテム: <span className="text-yellow-600">{fortuneResult.luckyItem}</span>
                            </p>
                            <p className="text-sm text-gray-600">
                                <span className="font-bold text-gray-800 block mb-1">開運アドバイス:</span>
                                {fortuneResult.advice}
                            </p>
                        </div>
                    </section>
                )}

                {!fortuneResult && !isGenerating && (
                    <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-dashed border-gray-300">
                        <Gift className="w-10 h-10 text-pink-300 mx-auto mb-3" />
                        <p className="text-gray-600">あなたの今日の運勢を占います。</p>
                        <p className="text-sm text-gray-500">生年月日を入力してください。</p>
                    </div>
                )}

            </main>

            <footer className="text-center py-6 text-xs text-gray-400">
                © 2025 みんなの那須アプリ
            </footer>
        </div>
    );
}