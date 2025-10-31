import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { loadStripe } from '@stripe/stripe-js';
import Link from 'next/link';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { app, db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

// Stripe公開鍵
const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
: null;

// 環境変数
const PRICE_ID_MONTHLY = process.env.NEXT_PUBLIC_STRIPE_AD_PRICE_ID || 'missing_monthly_id';
const PRICE_ID_ANNUAL = process.env.NEXT_PUBLIC_STRIPE_AD_ANNUAL_PRICE_ID || 'missing_annual_id';
const PRICE_ID_ANNUAL_INVOICE = process.env.NEXT_PUBLIC_STRIPE_AD_ANNUAL_INVOICE_PRICE_ID || PRICE_ID_ANNUAL; 

const MONTHLY_PRICE_DISPLAY = 3850; // 税込
const ANNUAL_PRICE_DISPLAY = 39600; // 税込
const ANNUAL_SAVINGS = 52800 - 39600; // 割引額 (定価 52,800円からの割引)

const CheckCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
<polyline points="22 4 12 14.01 9 11.01" />
</svg>
);

// Stripe Checkout セッション作成＆リダイレクト
const redirectToCheckout = async (
priceId: string,
paymentMethod: 'card' | 'invoice',
userInfo: { firebaseUid: string; email: string }
) => {
try {
  if (!stripePromise) throw new Error('Stripeキーが未設定です');

  const billingCycle =
    paymentMethod === 'invoice' ? 'annual_invoice' :
      priceId === PRICE_ID_MONTHLY ? 'monthly' : 'annual';

  const response = await fetch('/api/auth/register-and-create-invoice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      priceId,
      paymentMethod,
      serviceType: 'adver',
      firebaseUid: userInfo.firebaseUid,
      email: userInfo.email,
      billingCycle,
    }),
  });

  const data = await response.json();
  if (!response.ok || data.error) throw new Error(data.error || '決済セッションの作成に失敗しました。');

  if (paymentMethod === 'invoice') {
    // 請求書払い
    
    // PDFダウンロード処理を先に実行
    if (data.pdfUrl) {
      const a = document.createElement('a');
      a.href = data.pdfUrl;
      a.download = '請求書.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
    
    // ダウンロード開始を待つための遅延とリダイレクト
    setTimeout(() => {
      window.location.href = '/partner/dashboard?payment_status=invoice_pending';
    }, 100); 
    
    // alertをリダイレクト後に表示
    alert('請求書を発行し、ダウンロードを開始しました。PDFをご確認ください。\n入金確認まで有料プラン機能はご利用いただけません。');

  } else {
    // クレジットカード
    const stripe = await stripePromise;
    if (!stripe) throw new Error('Stripeの初期化に失敗しました');
    const { error } = await stripe.redirectToCheckout({ sessionId: data.sessionId });
    if (error) throw new Error(error.message);
  }

} catch (err: any) {
  console.error('Checkout Error:', err);
  alert(`エラー: ${err.message || '不明なエラーが発生しました'}`);
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
    await redirectToCheckout(priceId, isInvoice ? 'invoice' : 'card', userInfo);
    setLoading(false);
  };

  return (
    <div className={`p-8 rounded-xl shadow-xl flex flex-col ${isRecommended ? 'bg-white border-4 border-orange-500 scale-[1.05]' : 'bg-gray-50 border'}`}>
      {isRecommended && (
        <div className="text-sm font-bold text-white bg-orange-500 py-1 px-4 rounded-full self-center -mt-10 mb-2">
          一番人気！
        </div>
      )}
      <h3 className="text-2xl font-extrabold text-gray-900 mb-1">{title}</h3>
      <p className="mt-2 text-gray-500 text-sm">{isInvoice ? '年額一括払い（請求書）' : '初期費用 0円 / 月額または年額'}</p>
      <div className="mt-2 flex items-baseline">
        <span className="text-4xl font-extrabold tracking-tight text-gray-900">¥{price.toLocaleString()}</span>
        <span className="ml-1 text-xl font-medium text-gray-500">{billingCycle === 'monthly' ? '/月' : '/年'}</span>
      </div>
      {originalPrice && <p className="text-sm text-gray-400 line-through">定価 ¥{originalPrice.toLocaleString()} / 年</p>}
      <button
        onClick={handleClick}
        disabled={loading}
        className={`mt-6 w-full text-white font-bold py-3 rounded-lg shadow-md ${isInvoice ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-600 hover:bg-orange-700'} disabled:opacity-50`}
      >
        {loading ? '処理中...' : isInvoice ? '請求書で申し込む' : 'クレジットカードで申し込む'}
      </button>
      <ul className="mt-6 space-y-2 text-gray-700 text-sm">
        {features.map((f, i) => (
          <li key={i} className="flex items-start"><CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" />{f}</li>
        ))}
      </ul>
    </div>
  );
};

const PartnerSubscribePage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  // isPaid フラグと、ステータスを保持するステートを追加
  const [isPaid, setIsPaid] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null); // 'pending_invoice'などを保持
  const [loading, setLoading] = useState(true);
  const auth = getAuth(app);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const docRef = doc(db, 'users', currentUser.uid);
        const snap = await getDoc(docRef);
        
        if (snap.exists()) {
          const data = snap.data();
          // isPaid フラグを取得
          setIsPaid(!!data.isPaid);
          // サブスクリプションステータスを取得
          setSubscriptionStatus(data.adverSubscriptionStatus || null); 
        }
      }
      setLoading(false);
    });
    return () => unsub();
  }, [auth]);

  if (loading) return <div className="flex justify-center items-center h-screen text-gray-600">読み込み中...</div>;
  
  if (!user)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6 text-center">
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <p className="text-lg font-semibold text-red-600 mb-4">ログインが必要です</p>
          <Link href="/partner/login" className="bg-orange-600 text-white py-2 px-5 rounded hover:bg-orange-700">ログイン画面へ</Link>
        </div>
      </div>
    );

  // isPaidがtrue (クレカ決済完了/管理者有効化済み) の場合
  if (isPaid)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <h1 className="text-2xl font-bold text-gray-700 mb-4">すでに有料プランをご利用中です 🎉</h1>
        <Link href="/partner/dashboard" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">ダッシュボードに戻る</Link>
      </div>
    );
  
  // isPaidはfalseだが、請求書払いで「入金待ち」の場合
  if (subscriptionStatus === 'pending_invoice')
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6 text-center">
        <div className="bg-white p-8 rounded-xl shadow-lg border-4 border-yellow-500">
            <h1 className="text-2xl font-bold text-yellow-700 mb-4">請求書の発行を完了しました ⚠️</h1>
            <p className="text-lg text-gray-700 mb-4">銀行振込による入金確認中です。恐れ入りますが、入金が確認されるまでお待ちください。</p>
            <p className="text-gray-500 mb-6">入金確認後、管理者により有料プランが有効化されます。</p>
            <Link href="/partner/dashboard" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">ダッシュボード（入金待ち）へ</Link>
        </div>
      </div>
    );


  const userInfo = { firebaseUid: user.uid, email: user.email || '' };

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      <Head><title>有料パートナープラン | adtown</title></Head>
      <main className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
            集客と収益を最大化する <span className="text-orange-600">有料パートナープラン</span>
          </h1>
          <p className="mt-3 text-gray-600">無料掲載に加えて、AIマッチング・分析ツールが利用可能。</p>
          <p className="mt-2 text-sm text-red-600 font-bold">【先着100社限定】割引価格で提供中！</p>
          <p className="mt-2 text-gray-500 text-sm">現在ログイン中: {user.email}</p>
        </div>

        {/* プラン一覧 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
          <PriceCard
            title="月額プラン"
            price={MONTHLY_PRICE_DISPLAY}
            billingCycle="monthly"
            priceId={PRICE_ID_MONTHLY}
            features={['クレカ決済で毎月自動更新', '月単位で解約可能', 'まずはお試しに最適']}
            isRecommended={true}
            userInfo={userInfo}
          />
          <PriceCard
            title="年額プラン（クレカ）"
            price={ANNUAL_PRICE_DISPLAY}
            originalPrice={52800}
            billingCycle="annual"
            priceId={PRICE_ID_ANNUAL}
            features={['年1回払いでお得', `年間¥${ANNUAL_SAVINGS.toLocaleString()}割引`, '長期利用向け']}
            isRecommended={false}
            userInfo={userInfo}
          />
          <PriceCard
            title="年額プラン（請求書）"
            price={ANNUAL_PRICE_DISPLAY}
            originalPrice={52800}
            billingCycle="annual_invoice"
            priceId={PRICE_ID_ANNUAL_INVOICE}
            features={['銀行振込による前払い', '経理処理に対応した請求書発行', '法人利用に最適']}
            isRecommended={false}
            userInfo={userInfo}
          />
        </div>

        <div className="mt-16 text-center text-gray-600">
          <p>無料プランのまま利用を続ける場合は <Link href="/partner/dashboard" className="text-blue-600 underline">ダッシュボード</Link> へ戻る</p>
        </div>
      </main>
    </div>
  );
};

export default PartnerSubscribePage;

