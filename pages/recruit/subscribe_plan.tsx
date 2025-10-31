import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { loadStripe } from '@stripe/stripe-js';
import Link from 'next/link';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { app, db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/router';

console.log('🔍 ENV CHECK:', {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  monthly: process.env.NEXT_PUBLIC_STRIPE_AD_PRICE_ID,
  annual: process.env.NEXT_PUBLIC_STRIPE_AD_ANNUAL_PRICE_ID,
  invoice: process.env.NEXT_PUBLIC_STRIPE_AD_ANNUAL_INVOICE_PRICE_ID,
});

// Stripe公開鍵
const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
: null;

// ★★★ 求人用の環境変数 (柔軟な参照に修正) ★★★
// 月額プラン
const PRICE_ID_MONTHLY = 
    process.env.NEXT_PUBLIC_STRIPE_JOB_PRICE_ID || 
    process.env.STRIPE_JOB_PRICE_ID || 
    'missing_recruit_monthly_id';

// 年額（クレカ）
const PRICE_ID_ANNUAL_CARD = 
    process.env.NEXT_PUBLIC_STRIPE_JOB_ANNUALCR_PRICE_ID || 
    process.env.STRIPE_JOB_ANNUALCR_PRICE_ID || 
    process.env.NEXT_PUBLIC_STRIPE_JOB_ANNUAL_PRICE_ID || 
    'missing_recruit_annualcr_id'; 

// 年額（請求書）
const PRICE_ID_ANNUAL_INVOICE = 
    process.env.NEXT_PUBLIC_STRIPE_JOB_ANNUAL_INVOICE_PRICE_ID || 
    process.env.STRIPE_JOB_ANNUAL_INVOICE_PRICE_ID || 
    'missing_recruit_annual_invoice_id';


// ★★★ 求人用の料金 ★★★
const MONTHLY_PRICE_DISPLAY = 6600; // 税込 (割引価格)
const ORIGINAL_MONTHLY_PRICE_DISPLAY = 8800; // 税込 (定価)

const ANNUAL_PRICE_CARD_DISPLAY = 69600; // 税込 (年額カード割引価格)
const ANNUAL_PRICE_INVOICE_DISPLAY = 69600; // 税込 (年額請求書割引価格)
const ORIGINAL_ANNUAL_PRICE_DISPLAY = 105600; // 税込 (年額定価)


const CheckCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
<polyline points="22 4 12 14.01 9 11.01" />
</svg>
);

// 請求書決済完了後のステータスを保持する型
interface InvoiceSuccessData {
    pdfUrl: string;
    bankDetails: string;
}


// ★★★ Stripe Checkout セッション作成＆API呼び出し (リダイレクトを廃止) ★★★
const redirectToCheckout = async (
priceId: string,
paymentMethod: 'card' | 'invoice',
billingCycle: 'monthly' | 'annual' | 'annual_invoice',
userInfo: { firebaseUid: string; email: string }
): Promise<{ success: true, invoiceData?: InvoiceSuccessData, sessionId?: string }> => {
try {
  if (!stripePromise) throw new Error('Stripeキーが未設定です');
  // Price ID の存在チェック (設定忘れを防ぐ)
  if (priceId.startsWith('missing')) throw new Error('求人プランの価格IDが設定されていません。');


  // ★ 広告パートナーと同じAPIを流用
  const response = await fetch('/api/auth/register-and-create-invoice', { 
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      priceId,
      paymentMethod,
      serviceType: 'recruit', // サービスタイプを 'recruit' に設定
      firebaseUid: userInfo.firebaseUid,
      email: userInfo.email,
      billingCycle, // billingCycle を渡す
    }),
  });

  const data = await response.json();
  if (!response.ok || data.error) throw new Error(data.error || '決済セッションの作成に失敗しました。');

  if (paymentMethod === 'invoice') {
    // 請求書払いロジックを修正
    let alertMessage = '請求書払いによる申し込みを受け付けました。';

    // ダウンロード処理を強化 (ブラウザブロック対策)
    if (data.pdfUrl) {
      // 1. 新しいウィンドウで開く処理を併用 (ブロックされてもユーザーが手動でDLできる)
      window.open(data.pdfUrl, '_blank');
      
      alertMessage += '\n\n請求書PDFの発行と、新しいタブでの表示を試行しました。';
      alertMessage += 'もし新しいタブが開かない場合は、画面の【請求書PDFをダウンロード/表示】ボタンをご利用ください。';
    }

    alertMessage += '\n\n【重要】入金が確認されるまで、有料プランの機能はご利用いただけません。';
    alert(alertMessage);
    
    // 自動ダウンロード/リダイレクトを廃止し、成功データを返す
    return {
        success: true,
        invoiceData: { pdfUrl: data.pdfUrl, bankDetails: data.bankDetails },
    }; 

  } else {
    // クレジットカード決済
    return { success: true, sessionId: data.sessionId };
  }

} catch (err: any) {
  console.error('Checkout Error:', err);
  alert(`エラー: ${err.message || '不明なエラーが発生しました'}`);
  throw err; // 呼び出し元でエラーを捕捉させる
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
  // 決済後の処理を親コンポーネントに伝達するハンドラを追加
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
onCheckoutSuccess, // 追加
}) => {
  const [loading, setLoading] = useState(false);
  const isInvoice = billingCycle === 'annual_invoice';

  const handleClick = async () => {
    if (!userInfo.firebaseUid) {
      alert('ログイン情報が取得できませんでした。再ログインしてください。');
      window.location.href = '/partner/login';
      return;
    }
    setLoading(true);
    try {
        const result = await redirectToCheckout(priceId, isInvoice ? 'invoice' : 'card', billingCycle, userInfo);
        
        if (result.success) {
            if (isInvoice) {
                // 請求書決済完了を通知し、PDF情報を渡す
                onCheckoutSuccess('invoice', result.invoiceData); 
            } else {
                // クレカ決済開始
                const stripe = await stripePromise;
                if (!stripe) throw new Error('Stripeの初期化に失敗しました');
                
                // Stripe Checkoutへのリダイレクト
                const { error } = await stripe.redirectToCheckout({ sessionId: result.sessionId });
                if (error) throw new Error(error.message);

                onCheckoutSuccess('card'); // (実際にはリダイレクトされるため、この行は到達しない可能性が高い)
            }
        }
    } catch (e) {
        // エラーは redirectToCheckout で alert 済み
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
        className={`mt-6 w-full text-white font-bold py-3 rounded-lg shadow-md ${buttonClass} disabled:opacity-50`}
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

const RecruitSubscribePage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  // サービス固有のステータスで判定 (他のサービスの影響を受けない)
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null); 
  const [loading, setLoading] = useState(true);
  // 請求書決済完了後の情報を保持するステートを追加
  const [invoiceSuccess, setInvoiceSuccess] = useState<InvoiceSuccessData | null>(null); 
  const auth = getAuth(app);
  const router = useRouter(); 

  // 決済成功時のハンドラ。画面表示を切り替えるトリガーとなる
  const handleCheckoutSuccess = (type: 'card' | 'invoice', data?: InvoiceSuccessData) => {
    if (type === 'invoice' && data) {
        // 請求書決済が完了したら、専用の完了画面を表示するためにステートを更新
        setInvoiceSuccess(data);
    }
    // カード決済の場合はStripeがリダイレクトするため、ここでは何もしない
  };


  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const docRef = doc(db, 'users', currentUser.uid);
        // エラー回避のためオプション引数を削除 
        const snap = await getDoc(docRef); 
        
        if (snap.exists()) {
          const data = snap.data();
          // recruitSubscriptionStatusのみを取得
          setSubscriptionStatus(data.recruitSubscriptionStatus || null); 
        }
      }
      setLoading(false);
    });
    return () => unsub();
  }, [auth]);

  if (loading) return <div className="flex justify-center items-center h-screen text-gray-600">読み込み中...</div>;
  
  if (!user) {
    if (typeof window !== 'undefined') {
        router.push('/partner/login');
    }
    return <div className="flex justify-center items-center h-screen text-gray-600">ログインページにリダイレクトします...</div>;
  }
    
  // 請求書決済完了後の画面表示と、pending_invoiceの状態の処理を統合
  if (invoiceSuccess || subscriptionStatus === 'pending_invoice')
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6 text-center">
        <div className="bg-white p-8 rounded-xl shadow-lg border-4 border-yellow-500 max-w-lg mx-auto">
            <h1 className="text-2xl font-bold text-yellow-700 mb-4">請求書の発行を完了しました ⚠️</h1>
            <p className="text-lg text-gray-700 mb-4">
                銀行振込による入金確認中です。恐れ入りますが、入金が確認されるまでお待ちください。
                {/* PDFダウンロードリンクを直接表示 */}
                {(invoiceSuccess?.pdfUrl || subscriptionStatus === 'pending_invoice') && (
                    <div className="mt-4">
                        <a 
                            href={invoiceSuccess?.pdfUrl || '#'} // PDF URLがない場合はリンクを無効化
                            target="_blank" // 新しいタブで開く
                            rel="noopener noreferrer"
                            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 font-bold inline-block"
                        >
                            請求書PDFをダウンロード/表示
                        </a>
                        <p className="text-xs text-gray-500 mt-2">（新しいタブでPDFが開きます）</p>
                    </div>
                )}
            </p>
            <p className="text-gray-500 mb-6">入金確認後、管理者により有料プランが有効化されます。</p>
            {/* ユーザーが手動でダッシュボードへ戻るボタン */}
            <Link href="/recruit/dashboard" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">ダッシュボード（入金待ち）へ</Link>
        </div>
      </div>
    );
    
  // 'active' または 'trialing' の場合、有料として扱う
  if (subscriptionStatus === 'active' || subscriptionStatus === 'trialing') 
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <h1 className="text-2xl font-bold text-gray-700 mb-4">すでに有料AIプランをご利用中です 🎉</h1>
        <Link href="/recruit/dashboard" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">ダッシュボードに戻る</Link>
      </div>
    );
  
  // 決済フローが開始されていない、プラン選択画面の表示
  const userInfo = { firebaseUid: user.uid, email: user.email || '' };

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      <Head><title>有料AI求人プラン | adtown</title></Head>
      <main className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
            採用のミスマッチを防ぐ <span className="text-orange-600">有料AIプラン</span>
          </h1>
          <p className="mt-3 text-gray-600">無料の求人掲載に加えて、AIマッチング・AIアドバイス機能が利用可能になります。</p>
          <p className="mt-2 text-sm text-red-600 font-bold">【先着100社限定】割引価格で提供中！</p>
          <p className="mt-2 text-gray-500 text-sm">現在ログイン中: {user.email}</p>
        </div>

        {/* プラン一覧 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
          <PriceCard
            title="月額プラン"
            price={MONTHLY_PRICE_DISPLAY} 
            originalPrice={ORIGINAL_MONTHLY_PRICE_DISPLAY} 
            billingCycle="monthly"
            priceId={PRICE_ID_MONTHLY}
            features={[
              'AIマッチング候補者リスト',
              'AI求人アドバイス機能',
              'クレカ決済で毎月自動更新',
              '求人がない月はいつでも解約（停止）可能',
            ]}
            isRecommended={true}
            userInfo={userInfo}
            onCheckoutSuccess={handleCheckoutSuccess} // ハンドラを渡す
          />
          <PriceCard
            title="年額プラン（クレカ）"
            price={ANNUAL_PRICE_CARD_DISPLAY} 
            originalPrice={ORIGINAL_ANNUAL_PRICE_DISPLAY} 
            billingCycle="annual"
            priceId={PRICE_ID_ANNUAL_CARD} 
            features={[
              '年1回払い（クレカ）',
              `先着割引で最もお得 (¥${ANNUAL_PRICE_CARD_DISPLAY.toLocaleString()})`,
              'クレジットカードで自動更新',
            ]}
            isRecommended={false}
            userInfo={userInfo}
            onCheckoutSuccess={handleCheckoutSuccess} // ハンドラを渡す
          />
          <PriceCard
            title="年額プラン（請求書）"
            price={ANNUAL_PRICE_INVOICE_DISPLAY} 
            originalPrice={ORIGINAL_ANNUAL_PRICE_DISPLAY} 
            billingCycle="annual_invoice" 
            priceId={PRICE_ID_ANNUAL_INVOICE} 
            features={[
              '銀行振込による前払い',
              `先着割引で最もお得 (¥${ANNUAL_PRICE_INVOICE_DISPLAY.toLocaleString()})`,
              '経理処理に対応した請求書発行',
            ]}
            isRecommended={false}
            userInfo={userInfo}
            onCheckoutSuccess={handleCheckoutSuccess} // ハンドラを渡す
          />
        </div>

        <div className="mt-16 text-center text-gray-600">
          <p>無料プランのまま利用を続ける場合は <Link href="/recruit/dashboard" className="text-blue-600 underline">ダッシュボード</Link> へ戻る</p>
        </div>
      </main>
    </div>
  );
};

export default RecruitSubscribePage;
