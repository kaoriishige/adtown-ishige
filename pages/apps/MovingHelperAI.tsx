import React, { useState, useEffect } from 'react';
import Head from 'next/head';
// ★修正: Check をインポートリストに追加
import { ArrowLeft, Sparkles, AlertTriangle, Loader2, Home, User, LogOut, ListTodo, Zap, Mail, Check } from 'lucide-react'; 
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

// --- JSONスキーマ定義 (手続きリストの構造) ---
const PROCESS_SCHEMA = {
    type: "OBJECT",
    properties: {
        adminProcedures: { 
            type: "ARRAY", 
            description: "行政への手続きリスト (転入届、マイナンバーなど)", 
            items: { type: "STRING" } 
        },
        utilityProcedures: { 
            type: "ARRAY", 
            description: "ライフラインの手続きリスト (電気、ガス、水道、インターネット)", 
            items: { type: "STRING" } 
        },
        otherTasks: { 
            type: "ARRAY", 
            description: "その他必要な手続きやタスク (郵便転送、保険、銀行など)", 
            items: { type: "STRING" } 
        }
    },
    required: ["adminProcedures", "utilityProcedures", "otherTasks"]
};


export default function MovingHelperApp() {
    const [moveType, setMoveType] = useState<'in' | 'out'>('in'); // 転入 or 転出
    const [familySize, setFamilySize] = useState('2人 (大人1, 子供1)');
    const [movingMonth, setMovingMonth] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [result, setResult] = useState<any>(null);
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
    const fetchProcedures = async () => {
        setIsGenerating(true);
        setResult(null);
        setUiMessage('');

        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || getEnvVar('__api_key');
        if (!apiKey) {
            setUiMessage("エラー: Gemini APIキーが設定されていません。");
            setIsGenerating(false);
            return;
        }
        
        if (!movingMonth) {
            setUiMessage("引越し月を入力してください。");
            setIsGenerating(false);
            return;
        }

        const action = moveType === 'in' ? '那須地域への転入' : '那須地域からの転出';
        const systemPrompt = `あなたは、日本の引越し手続きの専門家AIです。以下の条件に基づき、ユーザーが必要な全ての手続きを漏れなくリストアップしてください。

        【条件】
        1. 引越し種別: ${action}
        2. 家族構成: ${familySize}
        3. 引越し月: ${movingMonth}月
        4. 地域: 栃木県北エリア（那須塩原市、大田原市、那須町）の行政手続きを想定してください。
        5. リストは具体的かつ詳細に、JSON形式で出力してください。
        `;
        
        const userQuery = `上記の条件に基づき、行政手続き、ライフラインの手続き、その他雑務を完全に網羅したチェックリストを生成してください。`;

        try {
            const payload = {
                contents: [{ parts: [{ text: userQuery }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] },
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: PROCESS_SCHEMA,
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


    return (
        <div className="min-h-screen bg-gray-50 font-sans pb-20">
            <Head><title>引越し手続きAIナビ</title></Head>

            {/* ヘッダー */}
            <header className="bg-white shadow-sm sticky top-0 z-10 p-4 border-b border-gray-200">
                <div className="max-w-xl mx-auto flex items-center gap-3">
                    <button onClick={handleGoCategories} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft size={20} className="text-gray-600" />
                    </button>
                    
                    <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Mail className="w-6 h-6 text-indigo-500" />
                        引越し手続きAIナビ
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
                
                {/* 1. 条件フォーム */}
                {!result && (
                    <section className="mb-8 bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                        <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
                            <User size={20} /> 引越しの条件を入力 (栃木県北)
                        </h2>
                        
                        <div className="space-y-4">
                            
                            {/* 転入/転出 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">1. 引越しの種類</label>
                                <div className="flex space-x-4">
                                    <label className="inline-flex items-center">
                                        <input 
                                            type="radio" 
                                            name="moveType" 
                                            value="in" 
                                            checked={moveType === 'in'}
                                            onChange={() => setMoveType('in')}
                                            className="form-radio text-indigo-600 h-4 w-4"
                                        />
                                        <span className="ml-2 text-sm text-gray-700">栃木県北へ**転入**</span>
                                    </label>
                                    <label className="inline-flex items-center">
                                        <input 
                                            type="radio" 
                                            name="moveType" 
                                            value="out" 
                                            checked={moveType === 'out'}
                                            onChange={() => setMoveType('out')}
                                            className="form-radio text-indigo-600 h-4 w-4"
                                        />
                                        <span className="ml-2 text-sm text-gray-700">栃木県北から**転出**</span>
                                    </label>
                                </div>
                            </div>

                            {/* 家族構成 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">2. 家族構成</label>
                                <input
                                    type="text"
                                    value={familySize}
                                    onChange={(e) => setFamilySize(e.target.value)}
                                    placeholder="例: 4人 (大人2, 子供2)"
                                    required
                                    className="w-full p-3 border border-gray-300 rounded-lg"
                                />
                            </div>

                            {/* 引越し月 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">3. 引越し月 (半角数字)</label>
                                <input
                                    type="number"
                                    value={movingMonth}
                                    onChange={(e) => setMovingMonth(e.target.value)}
                                    placeholder="例: 3"
                                    min="1" max="12"
                                    required
                                    className="w-full p-3 border border-gray-300 rounded-lg"
                                />
                            </div>
                        </div>
                        
                        <button
                            onClick={fetchProcedures}
                            disabled={isGenerating || !movingMonth || !familySize}
                            className="w-full mt-6 py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                        >
                            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <ListTodo className="w-5 h-5" />}
                            手続きリストを生成する
                        </button>
                    </section>
                )}

                {/* 2. 結果表示 */}
                {result && (
                    <section className="bg-white p-6 rounded-xl shadow-xl border border-indigo-400">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Check className="w-6 h-6 text-green-600" />
                            引越し手続きチェックリスト
                        </h2>
                        
                        {/* 概要 */}
                        <div className="mb-6 p-3 bg-indigo-50 border-l-4 border-indigo-500 rounded-lg">
                            <h3 className="font-bold text-indigo-800 text-base mb-1">
                                概要: {moveType === 'in' ? '栃木県北への転入手続き' : '栃木県北からの転出手続き'} ({movingMonth}月)
                            </h3>
                            <p className="text-xs text-gray-700">
                                家族構成: {familySize}に基づき、必要な行政・ライフライン手続きをリストアップしました。
                            </p>
                        </div>

                        {/* 行政手続き */}
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-3 border-b pb-1 flex items-center gap-2">
                                役所手続き (行政)
                            </h3>
                            <ul className="space-y-2 text-sm list-disc list-inside ml-4">
                                {result.adminProcedures.map((item: string, index: number) => (
                                    <li key={index} className="text-gray-700">{item}</li>
                                ))}
                            </ul>
                        </div>
                        
                        {/* ライフライン */}
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-3 border-b pb-1 flex items-center gap-2">
                                ライフライン (電気・ガス・水道等)
                            </h3>
                            <ul className="space-y-2 text-sm list-disc list-inside ml-4">
                                {result.utilityProcedures.map((item: string, index: number) => (
                                    <li key={index} className="text-gray-700">{item}</li>
                                ))}
                            </ul>
                        </div>

                        {/* その他 */}
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-3 border-b pb-1 flex items-center gap-2">
                                その他（保険、郵便、学校など）
                            </h3>
                            <ul className="space-y-2 text-sm list-disc list-inside ml-4">
                                {result.otherTasks.map((item: string, index: number) => (
                                    <li key={index} className="text-gray-700">{item}</li>
                                ))}
                            </ul>
                        </div>
                        
                        <button
                            onClick={() => setResult(null)}
                            className="w-full mt-4 py-3 bg-green-600 text-white font-bold rounded-lg shadow-md hover:bg-green-700 transition-colors"
                        >
                            新しい条件でリストを生成する
                        </button>
                    </section>
                )}

                {/* 初期画面/結果なし */}
                {!result && !isGenerating && (
                    <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-dashed border-gray-300">
                        <Mail className="w-10 h-10 text-indigo-300 mx-auto mb-3" />
                        <p className="text-gray-600">引越し手続きの「漏れ」をAIが防ぎます。</p>
                        <p className="text-sm text-gray-500">条件を入力してリストを生成してください。</p>
                    </div>
                )}

            </main>
            
            <footer className="text-center py-6 text-xs text-gray-400">
                © 2025 みんなの那須アプリ
            </footer>
        </div>
    );
}