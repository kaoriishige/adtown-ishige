import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { ArrowLeft, Sparkles, AlertTriangle, Loader2, Users, Lightbulb, User, LogOut } from 'lucide-react'; 
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

// --- JSONスキーマ定義 (変更なし) ---
const HINT_SCHEMA = {
    type: "OBJECT",
    properties: {
        type: { type: "STRING", description: "診断された苦手な相手のタイプ（例：完璧主義者、感情的タイプ）" },
        strategy: { type: "STRING", description: "そのタイプへの具体的な攻略戦略（接し方の基本）" },
        phrases: { 
            type: "ARRAY", 
            description: "相手に響く/ストレスを減らすための具体的な会話フレーズ3つ", 
            items: { type: "STRING" } 
        },
        stressRelief: { type: "STRING", description: "相手と接した後のストレス解消法または思考法のヒント" }
    },
    required: ["type", "strategy", "phrases", "stressRelief"]
};

// 診断の選択肢
const TYPE_OPTIONS = [
    "完璧主義で細かい指摘が多い人",
    "感情的で気分屋な人",
    "自己中心的で人の話を聞かない人",
    "受動的で何を考えているかわからない人",
    "理屈っぽく、正論でマウントを取る人",
    "その他（自由に記入）", // ユーザー入力のトリガー
];


export default function RelationshipHintApp() {
    const [selectedType, setSelectedType] = useState(TYPE_OPTIONS[0]);
    const [customTypeInput, setCustomTypeInput] = useState('');
    const [selectedContext, setSelectedContext] = useState<'private' | 'business'>('private');
    // ★追加: ユーザーと相手の性別ステート
    const [userGender, setUserGender] = useState<'female' | 'male'>('female'); 
    const [targetGender, setTargetGender] = useState<'female' | 'male'>('male');
    
    const [hintResult, setHintResult] = useState<any>(null);
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
    const fetchHint = async () => {
        setIsGenerating(true);
        setHintResult(null);
        setUiMessage('');

        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || getEnvVar('__api_key');
        if (!apiKey) {
            setUiMessage("エラー: Gemini APIキーが設定されていません。");
            setIsGenerating(false);
            return;
        }
        
        const finalType = selectedType === "その他（自由に記入）" && customTypeInput.trim()
            ? customTypeInput.trim()
            : selectedType;

        if (!finalType) {
            setUiMessage("相手のタイプを選択または入力してください。");
            setIsGenerating(false);
            return;
        }
        
        const contextText = selectedContext === 'business' 
            ? 'ビジネス（職場、取引先）での、礼儀正しさと効率を重視した言葉遣いと戦略' 
            : 'プライベート（友人、家族、ママ友）での、感情的なサポートと共感を重視した言葉遣いと戦略';

        // ★修正: 性別情報をプロンプトに追加
        const genderContext = `接する側: ${userGender === 'female' ? '女性' : '男性'}。苦手な相手: ${targetGender === 'female' ? '女性' : '男性'}。`;

        const systemPrompt = `あなたは、人間関係の心理学とコミュニケーション術に詳しい専門家です。以下の情報に基づいて、ユーザーがストレスを最小限に抑えるための具体的な戦略とヒントを提案してください。

        【重要】
        1. 出力は必ずJSON形式とし、HINT_SCHEMAに従ってください。
        2. トーンは専門的でありながらも、ユーザーに寄り添う優しい言葉遣いにしてください。
        3. 回答の文脈は「${contextText}」と「${genderContext}」を想定して、最適な言葉遣いと戦略を提案してください。
        `;
        
        const userQuery = `苦手な相手のタイプ: 「${finalType}」。文脈: ${contextText} (${genderContext})。これらに基づき、最も効果的な接し方、具体的なフレーズ、そしてユーザー自身のストレスを減らす方法を提案してください。`;

        try {
            const payload = {
                contents: [{ parts: [{ text: userQuery }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] },
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: HINT_SCHEMA,
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
                setHintResult(parsedJson);
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
        window.location.href = '/apps/categories';
    };

    const handleLogout = () => {
        try {
            const auth = getAuth(getApp());
            signOut(auth);
        } catch (e) {
            console.error("Logout error:", e);
        }
    };

    const isCustomInputActive = selectedType === "その他（自由に記入）";


    return (
        <div className="min-h-screen bg-gray-50 font-sans pb-20">
            <Head><title>苦手な人攻略ヒント</title></Head>

            {/* ヘッダー */}
            <header className="bg-white shadow-sm sticky top-0 z-10 p-4 border-b border-gray-200">
                <div className="max-w-xl mx-auto flex items-center gap-3">
                    <button onClick={handleGoCategories} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft size={20} className="text-gray-600" />
                    </button>
                    
                    <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Users className="w-6 h-6 text-indigo-500" />
                        苦手な人攻略ヒント
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
                
                {/* 入力フォーム */}
                {!hintResult && (
                    <section className="mb-8 bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                        <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
                            <User size={20} /> 診断条件を選ぶ
                        </h2>
                        
                        {/* 1. 目的/文脈選択 (プライベート/ビジネス) */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">1. 目的（どんな関係の相手ですか？）</label>
                            <div className="flex space-x-4">
                                <label className="inline-flex items-center">
                                    <input 
                                        type="radio" 
                                        name="context" 
                                        value="private" 
                                        checked={selectedContext === 'private'}
                                        onChange={() => setSelectedContext('private')}
                                        className="form-radio text-indigo-600 h-4 w-4"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">プライベート</span>
                                </label>
                                <label className="inline-flex items-center">
                                    <input 
                                        type="radio" 
                                        name="context" 
                                        value="business" 
                                        checked={selectedContext === 'business'}
                                        onChange={() => setSelectedContext('business')}
                                        className="form-radio text-indigo-600 h-4 w-4"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">ビジネス</span>
                                </label>
                            </div>
                        </div>
                        
                        {/* 2. 性別コンテキスト選択 (新規追加) */}
                        <div className="mb-4 grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">2-A. あなたの性別</label>
                                <div className="flex space-x-4">
                                    <label className="inline-flex items-center">
                                        <input 
                                            type="radio" 
                                            name="userGender" 
                                            value="female" 
                                            checked={userGender === 'female'}
                                            onChange={() => setUserGender('female')}
                                            className="form-radio text-pink-600 h-4 w-4"
                                        />
                                        <span className="ml-2 text-sm text-gray-700">女性</span>
                                    </label>
                                    <label className="inline-flex items-center">
                                        <input 
                                            type="radio" 
                                            name="userGender" 
                                            value="male" 
                                            checked={userGender === 'male'}
                                            onChange={() => setUserGender('male')}
                                            className="form-radio text-blue-600 h-4 w-4"
                                        />
                                        <span className="ml-2 text-sm text-gray-700">男性</span>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">2-B. 相手の性別</label>
                                <div className="flex space-x-4">
                                    <label className="inline-flex items-center">
                                        <input 
                                            type="radio" 
                                            name="targetGender" 
                                            value="female" 
                                            checked={targetGender === 'female'}
                                            onChange={() => setTargetGender('female')}
                                            className="form-radio text-pink-600 h-4 w-4"
                                        />
                                        <span className="ml-2 text-sm text-gray-700">女性</span>
                                    </label>
                                    <label className="inline-flex items-center">
                                        <input 
                                            type="radio" 
                                            name="targetGender" 
                                            value="male" 
                                            checked={targetGender === 'male'}
                                            onChange={() => setTargetGender('male')}
                                            className="form-radio text-blue-600 h-4 w-4"
                                        />
                                        <span className="ml-2 text-sm text-gray-700">男性</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* 3. 相手のタイプ選択 */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">3. 相手のタイプ</label>
                            <select
                                value={selectedType}
                                onChange={(e) => {
                                    setSelectedType(e.target.value);
                                    setCustomTypeInput(''); // タイプ変更時はカスタム入力をクリア
                                }}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-base font-semibold text-gray-700 mb-4"
                            >
                                {TYPE_OPTIONS.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                        </div>
                        
                        {/* 4. 自由入力欄 */}
                        {isCustomInputActive && (
                            <div className="mb-6">
                                <label className="block text-xs font-medium text-gray-500 mb-1">
                                    具体的なタイプを記入してください
                                </label>
                                <input
                                    type="text"
                                    value={customTypeInput}
                                    onChange={(e) => setCustomTypeInput(e.target.value)}
                                    placeholder="例: 会話泥棒タイプ、常に否定してくるタイプ"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                    required
                                />
                            </div>
                        )}
                        
                        <button
                            onClick={fetchHint}
                            disabled={isGenerating || (isCustomInputActive && !customTypeInput.trim())} // 自由入力時は入力が必須
                            className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                        >
                            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                            攻略ヒントを診断する
                        </button>
                    </section>
                )}

                {/* 結果表示 */}
                {hintResult && (
                    <section className="bg-white p-6 rounded-xl shadow-xl border border-indigo-400">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Lightbulb className="w-6 h-6 text-yellow-500" />
                            タイプ別 攻略ヒント
                        </h2>
                        
                        {/* 相手のタイプ */}
                        <div className="mb-4 p-3 bg-indigo-50 border-l-4 border-indigo-500 rounded-lg">
                            <h3 className="font-bold text-indigo-800 text-base mb-1">
                                診断された相手のタイプ
                            </h3>
                            <p className="text-lg font-semibold text-gray-900">{hintResult.type}</p>
                            <p className="text-xs text-gray-600 mt-1">
                                文脈: {selectedContext === 'business' ? 'ビジネス（職場等）' : 'プライベート（家族・友人等）'} / 
                                接する側: {userGender === 'female' ? '女性' : '男性'} / 相手: {targetGender === 'female' ? '女性' : '男性'}
                            </p>
                        </div>

                        {/* 攻略戦略 */}
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-2 border-b pb-1">
                                🧠 攻略戦略 (接し方の基本)
                            </h3>
                            <p className="text-gray-700 leading-relaxed text-sm">
                                {hintResult.strategy}
                            </p>
                        </div>
                        
                        {/* 具体的なフレーズ */}
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-3 border-b pb-1">
                                💬 使える会話フレーズ
                            </h3>
                            <ul className="space-y-2 text-sm">
                                {hintResult.phrases.map((phrase: string, index: number) => (
                                    <li key={index} className="p-3 bg-gray-100 rounded-lg border border-gray-200">
                                        &quot;{phrase}&quot;
                                    </li>
                                ))}
                            </ul>
                        </div>
                        
                        {/* ストレス解消法 */}
                        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
                            <h3 className="font-bold text-red-700 mb-2 flex items-center gap-1">
                                🧘 ストレスを減らす思考法
                            </h3>
                            <p className="text-gray-700 text-sm">
                                {hintResult.stressRelief}
                            </p>
                        </div>
                        
                        <button
                            onClick={() => setHintResult(null)}
                            className="w-full mt-4 py-3 bg-green-600 text-white font-bold rounded-lg shadow-md hover:bg-green-700 transition-colors"
                        >
                            別のタイプを診断する
                        </button>
                    </section>
                )}

                {/* 初期画面/ロード中 */}
                {!hintResult && !isGenerating && (
                    <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-dashed border-gray-300">
                        <Users className="w-10 h-10 text-indigo-300 mx-auto mb-3" />
                        <p className="text-gray-600">あなたの苦手な相手を攻略しましょう。</p>
                        <p className="text-sm text-gray-500">上のセクションで相手のタイプを選んでください。</p>
                    </div>
                )}

            </main>
            
            <footer className="text-center py-6 text-xs text-gray-400">
                © 2025 みんなの那須アプリ
            </footer>
        </div>
    );
}