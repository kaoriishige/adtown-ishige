import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, type User } from 'firebase/auth';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import { loadStripe } from '@stripe/stripe-js';

// Stripe初期化
const stripePromise = loadStripe(process.env.STRIPE_PUBLISHABLE_KEY || '');

export default function RecruitSubscribePage() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Firebase初期化（Netlify/Client-side対応）
        const win = window as any;
        const firebaseConfig = win.__firebase_config ? JSON.parse(win.__firebase_config) : {};
        const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
        const auth = getAuth(app);
        const db = getFirestore(app);

        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                
                // ✅ リアルタイム監視：Stripe決済完了後にWebhookがDBを更新するのを「出待ち」する
                const userRef = doc(db, 'users', currentUser.uid);
                const unsubscribeDoc = onSnapshot(userRef, (snap) => {
                    if (snap.exists()) {
                        const data = snap.data();
                        // 採用プランがactiveになったら自動遷移
                        if (data.recruitSubscriptionStatus === 'active') {
                            window.location.replace('/recruit/dashboard');
                        }
                    }
                    setLoading(false);
                }, (err) => {
                    console.error("Firestore Error:", err);
                    setLoading(false);
                });

                return () => unsubscribeDoc();
            } else {
                // 未ログインならログインへ
                window.location.href = '/partner/login';
            }
        });

        return () => unsubscribeAuth();
    }, []);

    /**
     * サブスク購入処理
     */
    const handlePurchase = async () => {
        if (!user || !user.uid) {
            setError("ユーザー情報の取得に失敗しました。再ログインしてください。");
            return;
        }

        setIsProcessing(true);
        setError(null);

        try {
            // ✅ APIに情報を送信（firebaseUidを確実に含める）
            const response = await fetch('/api/auth/register-and-subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: user.email,
                    firebaseUid: user.uid, // 🚨 これを渡さないとAPIでエラーになる
                    serviceType: 'recruit',
                    billingCycle: 'monthly',
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || '決済セッションの生成に失敗しました');
            }

            const stripe = await stripePromise;
            if (!stripe) throw new Error('Stripeの初期化に失敗しました');

            // Stripeチェックアウト画面へ遷移
            const { error: stripeError } = await stripe.redirectToCheckout({
                sessionId: data.sessionId,
            });

            if (stripeError) throw stripeError;

        } catch (err: any) {
            console.error('Checkout Error:', err);
            setError(err.message || '予期せぬエラーが発生しました');
            setIsProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-xs font-black text-gray-400 uppercase tracking-[0.3em]">Authenticating</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <Head>
                <title>採用プラン購読 | RECRUIT AI</title>
            </Head>

            <div className="w-full max-w-md">
                {/* ヘッダーロゴ風デザイン */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-black text-gray-900 italic tracking-tighter">
                        RECRUIT <span className="text-orange-600">AI</span>
                    </h1>
                </div>

                {/* プランカード */}
                <div className="bg-white rounded-[3rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] border-[6px] border-orange-600 overflow-hidden relative">
                    <div className="p-10">
                        <h2 className="text-xl font-black text-gray-800 mb-6 text-center">プロフェッショナル採用プラン</h2>
                        
                        <div className="text-center mb-10">
                            <div className="flex items-baseline justify-center">
                                <span className="text-6xl font-black tracking-tighter text-gray-900">¥6,600</span>
                                <span className="text-gray-400 font-bold ml-2">/月</span>
                            </div>
                            <div className="mt-4 inline-block px-4 py-1 bg-orange-50 text-orange-600 text-[10px] font-black rounded-full border border-orange-100">
                                全てのAI機能が解放されます
                            </div>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg text-red-700 text-xs font-bold animate-pulse">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4 mb-10">
                            {[
                                "AIマッチング候補者の全件表示",
                                "求人票のAI自動リライト機能",
                                "スカウトメール生成（制限なし）",
                                "いつでもオンラインで解約可能"
                            ].map((text, idx) => (
                                <div key={idx} className="flex items-center text-gray-600 text-sm font-bold">
                                    <svg className="w-4 h-4 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                    </svg>
                                    {text}
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={handlePurchase}
                            disabled={isProcessing}
                            className={`
                                w-full py-5 rounded-2xl text-xl font-black text-white shadow-xl transition-all
                                ${isProcessing 
                                    ? 'bg-gray-300 cursor-not-allowed' 
                                    : 'bg-orange-600 hover:bg-orange-700 active:scale-95'
                                }
                            `}
                        >
                            {isProcessing ? "リダイレクト中..." : "プランを購読する"}
                        </button>

                        <p className="mt-6 text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                            Secure Payment via Stripe
                        </p>
                    </div>
                </div>
                
                <p className="mt-8 text-center text-xs text-gray-400 font-medium">
                    ログイン中のアカウント: <span className="text-gray-600 font-bold">{user?.email}</span>
                </p>
            </div>
        </div>
    );
}