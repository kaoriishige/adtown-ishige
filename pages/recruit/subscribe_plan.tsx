// This file is now configured for local standalone preview environment compatibility,
// addressing the "Could not resolve @stripe/stripe-js" error.
// WARNING: This configuration may cause a 'UnhandledSchemeError' in Netlify build environments.
import React, { useState, useEffect } from 'react'; // useCallbackを削除
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, User, signInAnonymously, signInWithCustomToken, type Auth } from 'firebase/auth';
import { getFirestore, doc, getDoc, type Firestore } from 'firebase/firestore';

// ★★★ 修正: ローカルプレビューエラー(Could not resolve "@stripe/stripe-js")を回避するため、CDNインポートに戻す ★★★
// @ts-expect-error: CDN import cannot be typed
import { loadStripe } from 'https://js.stripe.com/v3/+esm'; 

// ★ 修正: グローバル変数をTypeScriptに宣言
declare let __firebase_config: string | undefined;
declare let __initial_auth_token: string | undefined;

// ★ 修正: 環境変数フォールバック (この環境では process.env が利用できないため)
// ユーザーの元のコードを尊重し、Next.jsの変数がない場合は空文字列またはデフォルト値を使用します。
const NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) ? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY : '';

// ★★★ 求人用の環境変数 (フォールバック値をそのまま使用) ★★★
// 実行環境で process.env が利用できない場合は、右側のフォールバック値が適用されます。
const PRICE_ID_MONTHLY = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_STRIPE_JOB_PRICE_ID) || 'missing_recruit_monthly_id';
const PRICE_ID_ANNUAL_CARD = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_STRIPE_JOB_ANNUALCR_PRICE_ID) || 'missing_recruit_annualcr_id';
const PRICE_ID_ANNUAL_INVOICE = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_STRIPE_JOB_ANNUAL_INVOICE_PRICE_ID) || 'missing_recruit_annual_invoice_id';

// ★★★ 求人用の料金 ★★★
const MONTHLY_PRICE_DISPLAY = 6600;
const ORIGINAL_MONTHLY_PRICE_DISPLAY = 8800;
const ANNUAL_PRICE_CARD_DISPLAY = 69600;
const ANNUAL_PRICE_INVOICE_DISPLAY = 69600;
const ORIGINAL_ANNUAL_PRICE_DISPLAY = 105600;


// ★ 修正: Firebaseの初期化をファイルグローバルで行う
let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

try {
    // __firebase_config は環境からグローバル変数として提供される
    const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
    if (Object.keys(firebaseConfig).length > 0) {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
    } else {
        console.warn("Firebase config is empty or not defined.");
    }
} catch (e) {
    console.error("Firebase init error:", e);
}

const stripePromise = NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    ? loadStripe(NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
    : null;

if (!stripePromise) {
    console.warn("Stripe public key is not set. Stripe will be disabled.");
}

// プランカード用のチェックアイコン
const CheckCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
<polyline points="22 4 12 14.01 9 11.01" />
</svg>
);

// 機能比較表用のチェック/バツ アイコン
const CheckIcon = (enabled: boolean) => {
    if (enabled) {
        return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>;
    }
    return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>;
};


interface InvoiceSuccessData {
    pdfUrl: string;
    bankDetails: string;
}

const redirectToCheckout = async (
    priceId: string,
    paymentMethod: 'card' | 'invoice',
    billingCycle: 'monthly' | 'annual' | 'annual_invoice',
    userInfo: { firebaseUid: string; email: string }
): Promise<{ success: true, invoiceData?: InvoiceSuccessData, sessionId?: string }> => {
    try {
        if (!stripePromise) throw new Error('Stripeキーが未設定です');
        if (priceId.startsWith('missing')) throw new Error('求人プランの価格IDが設定されていません。');

        const apiUrl = paymentMethod === 'invoice'
            ? '/api/auth/register-and-create-invoice'
            : '/api/auth/register-and-create-session';

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                priceId,
                paymentMethod,
                serviceType: 'recruit',
                firebaseUid: userInfo.firebaseUid,
                email: userInfo.email,
                billingCycle,
            }),
        });

        const data = await response.json();
        if (!response.ok || data.error) throw new Error(data.error || '決済セッションの作成に失敗しました。');

        if (paymentMethod === 'invoice') {
            let consoleMessage = '請求書払いによる申し込みを受け付けました。';

            if (data.pdfUrl) {
                window.open(data.pdfUrl, '_blank');
                consoleMessage += '\n\n請求書PDFの発行と、新しいタブでの表示を試行しました。';
                consoleMessage += 'もし新しいタブが開かない場合は、画面の【請求書PDFをダウンロード/表示】ボタンをご利用ください。';
            }

            consoleMessage += '\n\n【重要】入金が確認されるまで、有料プランの機能はご利用いただけません。';
            // 修正: alertは使えないため、console.logに変更
            console.log(consoleMessage);

            return {
                success: true,
                invoiceData: { pdfUrl: data.pdfUrl, bankDetails: data.bankDetails },
            };
        } else {
            return { success: true, sessionId: data.sessionId };
        }

    } catch (err: any) {
        console.error('Checkout Error:', err);
        // 修正: alertは使えないため、console.errorに変更
        console.error(`エラー: ${err.message || '不明なエラーが発生しました'}`);
        throw err;
    }
};

interface PriceCardProps {
    title: string;
    price: number;
    originalPrice?: number;
    billingCycle: 'monthly' | 'annual' | 'annual_invoice';
    priceId: string;
    features: string[];
    isRecommended: boolean;
    userInfo: { firebaseUid: string; email: string };
    onCheckoutSuccess: (type: 'card' | 'invoice', data?: InvoiceSuccessData) => void;
}

const PriceCard: React.FC<PriceCardProps> = ({
    title,
    price,
    originalPrice,
    billingCycle,
    priceId,
    features,
    isRecommended,
    userInfo,
    onCheckoutSuccess,
}) => {
    const [loading, setLoading] = useState(false);
    const isInvoice = billingCycle === 'annual_invoice';

    const handleClick = async () => {
        if (!userInfo.firebaseUid) {
            // 修正: alertは使えないため、console.errorに変更
            console.error('ログイン情報が取得できませんでした。再ログインしてください。');
            window.location.href = '/partner/login';
            return;
        }
        setLoading(true);
        try {
            const result = await redirectToCheckout(priceId, isInvoice ? 'invoice' : 'card', billingCycle, userInfo);

            if (result.success) {
                if (isInvoice) {
                    onCheckoutSuccess('invoice', result.invoiceData);
                } else {
                    const stripe = await stripePromise;
                    if (!stripe) throw new Error('Stripeの初期化に失敗しました');

                    if (result.sessionId) {
                        const { error } = await stripe.redirectToCheckout({ sessionId: result.sessionId });
                        if (error) throw new Error(error.message);
                    } else {
                        throw new Error('決済セッションIDが取得できませんでした。');
                    }
                }
            }
        } catch (e) {
            // エラーアラートは redirectToCheckout 内で実行
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const buttonClass = isInvoice ?
        'bg-blue-600 hover:bg-blue-700' :
        'bg-orange-600 hover:bg-orange-700';

    return (
        <div className={`p-8 rounded-xl shadow-xl flex flex-col ${isRecommended ? 'bg-white border-4 border-orange-500 scale-[1.05]' : 'bg-gray-50 border'}`}>
            {(isRecommended || isInvoice) && (
                <div className="text-sm font-bold text-white bg-orange-500 py-1 px-4 rounded-full self-center -mt-10 mb-2">
                    {isInvoice ? '年額一括' : '先着100社様 限定価格'}
                </div>
            )}
            <h3 className="text-2xl font-extrabold text-gray-900 mb-1">{title}</h3>
            <p className="mt-2 text-gray-500 text-sm">{isInvoice ? '年額一括払い（請求書）' : '初期費用 0円 / クレジットカード'}</p>
            <div className="mt-2 flex items-baseline">
                <span className="text-4xl font-extrabold tracking-tight text-gray-900">¥{price.toLocaleString()}</span>
                <span className="ml-1 text-xl font-medium text-gray-500">{billingCycle === 'monthly' ? '/月' : '/年'}</span>
            </div>
            {originalPrice && <p className="text-sm text-gray-400 line-through">定価 ¥{originalPrice.toLocaleString()} {billingCycle === 'monthly' ? '/ 月' : '/ 年'}</p>}
            <button
                onClick={handleClick}
                disabled={loading}
                className={`mt-6 w-full text-white font-bold py-3 rounded-lg shadow-md ${buttonClass} disabled:opacity-50 transition duration-150`}
            >
                {loading ? '処理中...' : isInvoice ? '請求書で申し込む' : 'クレジットカードで申し込む'}
            </button>
            <ul className="mt-6 space-y-2 text-gray-700 text-sm">
                {features.map((f, i) => (
                    <li key={i} className="flex items-start"><CheckCircleIcon className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />{f}</li>
                ))}
            </ul>
        </div>
    );
};

interface SubscriptionInfo {
    status: string | null;
    invoicePdfUrl?: string;
}

const RecruitSubscribePage: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo>({ status: null });
    const [loading, setLoading] = useState(true);
    const [invoiceSuccess, setInvoiceSuccess] = useState<InvoiceSuccessData | null>(null);

    const [sessionId, setSessionId] = useState<string | null>(null);
    const [successQuery, setSuccessQuery] = useState<string | null>(null);

    // 1. クライアントマウント時にURLパラメータを取得
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const queryParams = new URLSearchParams(window.location.search);
            setSessionId(queryParams.get('session_id'));
            setSuccessQuery(queryParams.get('success'));
        }
    }, []);


    const handleCheckoutSuccess = (type: 'card' | 'invoice', data?: InvoiceSuccessData) => {
        if (type === 'invoice' && data) {
            setInvoiceSuccess(data);
        }
    };

    // 2. ユーザー認証とサブスクリプションステータス取得
    useEffect(() => {
        // Firebaseサービスが初期化されているか確認
        if (!auth || !db) {
            console.error("Firebase services (auth, db) are not initialized.");
            setIsAuthLoading(false);
            setLoading(false);
            return;
        }

        // 認証リスナーを設定
        const unsub = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            setIsAuthLoading(false); // 認証状態が確定

            if (currentUser) {
                try {
                    // Firestoreの読み込み
                    const docRef = doc(db, 'users', currentUser.uid);
                    const snap = await getDoc(docRef);

                    if (snap.exists()) {
                        const data = snap.data();
                        const subStatus = data.recruitSubscriptionStatus || null;
                        const pdfUrl = data.recruitInvoicePdfUrl || null;
                        setSubscriptionInfo({ status: subStatus, invoicePdfUrl: pdfUrl });
                    } else {
                        setSubscriptionInfo({ status: null });
                    }
                } catch (error) {
                    console.error("Firestore read failed:", error);
                    setSubscriptionInfo({ status: null });
                }
            } else {
                setSubscriptionInfo({ status: null });
            }
            // データ読み込み完了（認証状態と初期データロードが完了）
            setLoading(false);
        });

        // 認証処理の実行 (リスナーが設定された後に実行)
        const handleSignIn = async () => {
            try {
                // 既にユーザーがいる場合はサインイン処理をスキップ (onAuthStateChangedが処理する)
                if (auth?.currentUser) {
                    return;
                }

                if (typeof window !== 'undefined') {
                    // __initial_auth_token は環境からグローバル変数として提供される
                    if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                        await signInWithCustomToken(auth, __initial_auth_token);
                    } else {
                        await signInAnonymously(auth);
                    }
                }
            } catch (error) {
                console.error("Firebase sign-in error:", error);
                setIsAuthLoading(false);
                setLoading(false);
            }
        };

        handleSignIn();

        return () => unsub(); // クリーンアップ
    }, []); // 依存配列を空にし、マウント時に1回だけ実行

    // 3. 決済成功時のトークンリフレッシュとダッシュボードへのリダイレクト処理
    useEffect(() => {
        // session_idとsuccess=trueがあり、認証ロードが完了していて、ユーザーがログインしている
        if (sessionId && successQuery === 'true' && !isAuthLoading && user) {
            console.log("💳 Stripe Checkout Success detected. Starting token refresh...");

            const handlePostCheckout = async () => {
                try {
                    // Firebaseトークンを強制的にリフレッシュし、Stripeのサブスクリプション情報が反映されたカスタムクレームを取得
                    await user.getIdToken(true);
                    console.log("✅ Token successfully refreshed.");
                } catch (error) {
                    console.error("Token refresh failed:", error);
                }
                // ダッシュボードへのリダイレクト
                window.location.replace('/recruit/dashboard?payment_status=success');
            };

            handlePostCheckout();
        } else if (sessionId && successQuery === 'true' && !isAuthLoading && !user) {
            // 成功クエリがあるがユーザーがいない場合、ログインページにリダイレクト
            window.location.replace('/partner/login');
        }
    }, [sessionId, successQuery, isAuthLoading, user]);


    if (loading || isAuthLoading) return (
        <div className="flex justify-center items-center h-screen bg-gray-50">
            <div className="flex items-center space-x-2 text-gray-600">
                <svg className="animate-spin h-5 w-5 text-orange-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>読み込み中...</span>
            </div>
        </div>
    );

    if (!user) {
        if (typeof window !== 'undefined') {
            window.location.href = '/partner/login';
        }
        return <div className="flex justify-center items-center h-screen text-gray-600">ログインページにリダイレクトします...</div>;
    }

    if (subscriptionInfo.status === 'active' || subscriptionInfo.status === 'trialing') {
        // ★ 修正: リダイレクトもクライアントサイドでのみ実行
        if (typeof window !== 'undefined') {
            window.location.replace('/recruit/dashboard');
        }
        return <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
            <h1 className="text-2xl font-bold text-gray-700 mb-4">有料プラン利用中のためリダイレクトします...</h1>
            {/* Next.js ESLint 警告抑制 */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/recruit/dashboard" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-150 shadow-md">ダッシュボードに戻る</a>
        </div>;
    }

    if (invoiceSuccess || subscriptionInfo.status === 'pending_invoice')
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6 text-center">
                <div className="bg-white p-8 rounded-xl shadow-lg border-4 border-yellow-500 max-w-lg mx-auto">
                    <h1 className="text-3xl font-extrabold text-yellow-700 mb-4">請求書の発行を完了しました ⚠️</h1>
                    <p className="text-lg text-gray-700 mb-4">
                        銀行振込による入金確認中です。恐れ入りますが、入金が確認されるまでお待ちください。
                    </p>

                    {(invoiceSuccess?.pdfUrl || subscriptionInfo.invoicePdfUrl) && (
                        <div className="mt-6">
                            <a
                                href={invoiceSuccess?.pdfUrl || subscriptionInfo.invoicePdfUrl || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 font-bold inline-block shadow-md transition duration-150"
                            >
                                請求書PDFをダウンロード/表示
                            </a>
                            <p className="text-xs text-gray-500 mt-2">（新しいタブでPDFが開きます）</p>
                        </div>
                    )}
                    
                    <p className="text-gray-500 mt-6 mb-6">入金確認後、管理者により有料プランが有効化されます。</p>
                    {/* Next.js ESLint 警告抑制 */}
                    {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                    <a href="/recruit/dashboard" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-150 shadow-md">ダッシュボード（入金待ち）へ</a>
                </div>
            </div>
        );

    const userInfo = { firebaseUid: user.uid, email: user.email || '' };

    return (
        <div className="bg-gray-50 min-h-screen font-sans">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
                        採用のミスマッチを防ぐ <span className="text-orange-600">有料AIプラン</span>
                    </h1>
                    <p className="mt-3 text-lg text-gray-600">無料の求人掲載に加えて、AIマッチング・AIアドバイス機能が利用可能になります。</p>
                    <p className="mt-2 text-base text-red-600 font-bold">【先着100社限定】割引価格で提供中！</p>
                    <p className="mt-2 text-sm text-gray-500">現在ログイン中: {user.email || 'Email not available'}</p>
                </div>

                {/* プラン一覧 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
                    <PriceCard
                        title="月額プラン"
                        price={MONTHLY_PRICE_DISPLAY}
                        originalPrice={ORIGINAL_MONTHLY_PRICE_DISPLAY}
                        billingCycle="monthly"
                        priceId={PRICE_ID_MONTHLY}
                        features={[
                            'AIスカウト候補者リスト (閲覧可)',
                            'AI厳選の潜在候補者リスト (閲覧可)',
                            'AI求人アドバイス機能',
                            'クレカ決済で毎月自動更新',
                            '求人がない月はいつでも停止可能',
                        ]}
                        isRecommended={true}
                        userInfo={userInfo}
                        onCheckoutSuccess={handleCheckoutSuccess}
                    />
                    <PriceCard
                        title="年額プラン（クレカ）"
                        price={ANNUAL_PRICE_CARD_DISPLAY}
                        originalPrice={ORIGINAL_ANNUAL_PRICE_DISPLAY}
                        billingCycle="annual"
                        priceId={PRICE_ID_ANNUAL_CARD}
                        features={[
                            'AIスカウト候補者リスト (閲覧可)',
                            'AI厳選の潜在候補者リスト (閲覧可)',
                            'AI求人アドバイス機能',
                            `先着割引で最もお得 (¥${ANNUAL_PRICE_CARD_DISPLAY.toLocaleString()})`,
                            'クレジットカードで自動更新',
                        ]}
                        isRecommended={false}
                        userInfo={userInfo}
                        onCheckoutSuccess={handleCheckoutSuccess}
                    />
                    <PriceCard
                        title="年額プラン（請求書）"
                        price={ANNUAL_PRICE_INVOICE_DISPLAY}
                        originalPrice={ORIGINAL_ANNUAL_PRICE_DISPLAY}
                        billingCycle="annual_invoice"
                        priceId={PRICE_ID_ANNUAL_INVOICE}
                        features={[
                            'AIスカウト候補者リスト (閲覧可)',
                            'AI厳選の潜在候補者リスト (閲覧可)',
                            'AI求人アドバイス機能',
                            `先着割引で最もお得 (¥${ANNUAL_PRICE_INVOICE_DISPLAY.toLocaleString()})`,
                            '経理処理に対応した請求書発行',
                        ]}
                        isRecommended={false}
                        userInfo={userInfo}
                        onCheckoutSuccess={handleCheckoutSuccess}
                    />
                </div>

                {/* 機能比較表セクション */}
                <div className="mt-20 bg-white p-8 md:p-12 rounded-xl shadow-lg border">
                    <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-8">
                        プラン別 機能一覧
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">機能</th>
                                    <th scope="col" className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">無料プラン</th>
                                    <th scope="col" className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-orange-50">
                                        有料AIプラン<br />(月額・年額)
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                <tr>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">求人票の作成・公開</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">{CheckIcon(true)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center bg-orange-50">{CheckIcon(true)}</td>
                                </tr>
                                <tr>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">応募者への対応</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">{CheckIcon(true)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center bg-orange-50">{CheckIcon(true)}</td>
                                </tr>
                                <tr>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">AI求人アドバイス機能</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">{CheckIcon(false)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center bg-orange-50">{CheckIcon(true)}</td>
                                </tr>
                                <tr>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 font-bold text-orange-600">AIスカウト候補者リスト閲覧</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">{CheckIcon(false)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center bg-orange-50">{CheckIcon(true)}</td>
                                </tr>
                                <tr>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 font-bold text-orange-600">AI厳選の潜在候補者リスト閲覧</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">{CheckIcon(false)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center bg-orange-50">{CheckIcon(true)}</td>
                                </tr>
                                <tr>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">初期費用</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">0円</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center bg-orange-50">0円</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>


                <div className="mt-16 text-center text-gray-600">
                    {/* Next.js ESLint 警告抑制 */}
                    {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                    <p>無料プランの利用を続ける場合は <a href="/recruit/dashboard" className="text-blue-600 underline hover:text-blue-700 transition duration-150">ダッシュボード</a> へ戻る</p>
                </div>
            </div>
        </div>
    );
};

export default RecruitSubscribePage;