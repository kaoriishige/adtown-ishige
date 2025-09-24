import { GetServerSideProps, NextPage } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import nookies from 'nookies';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import {
    RiQrCodeLine, RiFileList3Line, RiCopperCoinLine, RiGiftLine,
    RiLogoutCircleRLine, RiMoneyCnyCircleLine, RiInformationLine,
    RiMailSendLine, RiHome2Line, RiTicketLine, RiTaskLine,
    RiStore2Line, RiRecycleLine,
    RiShoppingBasketLine // フリマ用のアイコンを追加
} from 'react-icons/ri';
import { loadStripe } from '@stripe/stripe-js';
import Stripe from 'stripe';
import { getAdminStripe } from '@/lib/stripe-admin';

const stripePromise = typeof window !== 'undefined' ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!) : null;

// --- 型定義 (変更なし) ---
interface PurchasedDeal {
  id: string;
  title: string;
  storeName: string;
}
interface AcceptedQuest {
  id:string;
  title: string;
  status: 'accepted' | 'submitted' | 'completed' | 'rejected';
}
interface MyPageProps {
  user: { uid: string; email: string; };
  points: { balance: number; usableBalance: number; pendingBalance: number; activationStatus: string; expiredAmount: number; };
  rewards: { total: number; pending: number; };
  subscriptionStatus: 'active' | 'trial' | 'trialing' | 'canceled' | 'free' | null;
  purchasedDeals: PurchasedDeal[];
  acceptedQuests: AcceptedQuest[];
}

// --- コンポーネント ---
const MyPage: NextPage<MyPageProps> = ({ user, points, rewards, subscriptionStatus, purchasedDeals, acceptedQuests }) => {
  // --- ロジック部分 (お客様のコードから変更なし) ---
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isReissuing, setIsReissuing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (router.query.session_id) {
        setMessage('アップグレードありがとうございます！すべての機能が利用可能になりました。');
    }
    if (router.query.reissue === 'success') {
      setMessage('ポイントの再発行手続きが完了しました！');
    }
    if (router.query.reissue === 'cancel') {
      setMessage('ポイントの再発行手続きはキャンセルされました。');
    }
  }, [router.query]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/sessionLogout', { method: 'POST' });
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Logout failed', error);
      alert('ログアウトに失敗しました。');
      setIsLoggingOut(false);
    }
  };

  const handleReissue = async () => {
    setIsReissuing(true);
    try {
      if (!stripePromise) {
          alert('Stripeの読み込みに失敗しました。');
          setIsReissuing(false);
          return;
      }
      const response = await fetch('/api/points/reissue', { method: 'POST' });
      const sessionData = await response.json();
      if (response.ok && sessionData.sessionId) {
        const stripe = await stripePromise;
        await stripe?.redirectToCheckout({ sessionId: sessionData.sessionId });
      } else {
        alert(sessionData.error || '再発行手続きに失敗しました。');
      }
    } catch (error) {
      alert('エラーが発生しました。');
    } finally {
      setIsReissuing(false);
    }
  };

  const getActivationMessage = (status: string) => {
    if (status === 'awaiting_november_payment') return "11月の課金が確認されると、ポイントが使えるようになります。";
    if (status === 'awaiting_next_payment') return "翌月の課金が確認されると、ポイントが使えるようになります。";
    return null;
  };

  const activationMessage = getActivationMessage(points.activationStatus);

  return (
    <div className="min-h-screen bg-gray-100">
      <Head><title>マイページ - みんなの那須アプリ</title></Head>
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-xl mx-auto p-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">マイページ</h1>
          <button onClick={handleLogout} disabled={isLoggingOut} className="flex items-center text-sm font-semibold text-gray-600 hover:text-red-500 disabled:opacity-50 transition-colors">
            <RiLogoutCircleRLine className="mr-1" />ログアウト
          </button>
        </div>
      </header>
      <main className="max-w-xl mx-auto p-4 sm:p-6 pb-24">
        <p className="text-center text-gray-600 mb-6">ようこそ、{user.email}さん</p>
        {message && (<div className="my-4 p-4 bg-blue-100 text-blue-800 rounded-lg text-center">{message}</div>)}

        <section className="bg-white p-6 rounded-xl shadow-md mb-8">
            <h2 className="text-lg font-bold mb-4 text-gray-800">あなたの紹介報酬 💰</h2>
            <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                    <p className="text-sm text-gray-500">累計紹介ポイント</p>
                    <p className="text-3xl font-bold text-gray-800">{rewards.total.toLocaleString()}<span className="text-base font-normal ml-1">pt</span></p>
                </div>
                <div>
                    <p className="text-sm text-gray-500">未確定ポイント</p>
                    <p className="text-3xl font-bold text-blue-600">{rewards.pending.toLocaleString()}<span className="text-base font-normal ml-1">pt</span></p>
                </div>
            </div>
            <p className="text-xs mt-4 text-gray-600 text-center">※紹介で獲得したポイントは、承認後「なっぴーポイント残高」に加算されます。</p>
        </section>

        <section className="mb-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <Link href="/fleamarket?action=list" className="bg-gradient-to-br from-orange-400 to-red-500 text-white p-4 rounded-lg shadow-md text-center flex flex-col items-center justify-center aspect-square hover:shadow-lg hover:from-orange-500 transition-all col-span-2 sm:col-span-1">
                    <RiShoppingBasketLine size={32} className="text-white mb-2" />
                    <span className="font-semibold text-sm">フリマに出品する</span>
                </Link>
                <Link href="/home" className="bg-blue-500 text-white p-4 rounded-lg shadow-md text-center flex flex-col items-center justify-center aspect-square hover:shadow-lg hover:bg-blue-600 transition-all">
                    <RiHome2Line size={32} className="text-white mb-2" />
                    <span className="font-semibold text-sm">アプリトップ</span>
                </Link>
                <Link href="/referral-info" className="bg-white p-4 rounded-lg shadow-md text-center flex flex-col items-center justify-center aspect-square hover:shadow-lg hover:bg-gray-100 transition-all">
                    <RiGiftLine size={32} className="text-pink-500 mb-2" />
                    <span className="font-semibold text-sm text-gray-800">紹介用URL</span>
                </Link>
                <Link href="/deals" className="bg-white p-4 rounded-lg shadow-md text-center flex flex-col items-center justify-center aspect-square hover:shadow-lg hover:bg-gray-100 transition-all">
                    <RiStore2Line size={32} className="text-orange-500 mb-2" />
                    <span className="font-semibold text-sm text-gray-800">地域の店舗情報</span>
                </Link>
                <Link href="/food-loss" className="bg-white p-4 rounded-lg shadow-md text-center flex flex-col items-center justify-center aspect-square hover:shadow-lg hover:bg-gray-100 transition-all">
                    <RiRecycleLine size={32} className="text-green-500 mb-2" />
                    <span className="font-semibold text-sm text-gray-800">フードロス情報</span>
                </Link>
            </div>
        </section>

        <section className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-6 rounded-xl shadow-lg mb-8">
          <div className="mb-4 p-3 bg-red-500/80 rounded-lg text-center font-bold text-sm">
            <p>現在準備中です。サービス開始までもうしばらくお待ちください。</p>
          </div>
          <h2 className="text-sm font-bold opacity-80 mb-2">なっぴーポイント残高</h2>
          <div className="text-5xl font-black tracking-tight flex items-baseline">
            {points.usableBalance.toLocaleString()}
            <span className="text-2xl font-bold ml-1">pt</span>
          </div>
          <div className="mt-4 bg-white/20 p-3 rounded-lg text-sm">
            <div className="flex justify-between">
              <span>保有ポイント合計:</span>
              <span>{points.balance.toLocaleString()} pt</span>
            </div>
            <div className="flex justify-between mt-1">
              <span>利用待機中ポイント:</span>
              <span>{points.pendingBalance.toLocaleString()} pt</span>
            </div>
          </div>
          {activationMessage && (
            <div className="mt-4 bg-yellow-100 text-yellow-800 text-xs p-3 rounded-lg text-center font-bold">
                {activationMessage}
            </div>
          )}
          {points.expiredAmount > 0 && (
            <div className="mt-4 border-t border-white/30 pt-4">
              <div className="flex justify-between items-center text-md">
                <p>失効ポイント:</p>
                <span className="font-bold">{points.expiredAmount.toLocaleString()} P</span>
              </div>
              <p className="text-xs text-white/80 mt-2">
                手数料 {Math.max(1, Math.floor(points.expiredAmount * 0.05)).toLocaleString()} 円で、失効した全てのポイントを再発行できます。
              </p>
              <button
                onClick={handleReissue}
                disabled={isReissuing}
                className="w-full mt-3 p-2 text-sm font-bold text-blue-600 bg-white rounded-lg hover:bg-gray-100 transition-colors disabled:bg-gray-300"
              >
                {isReissuing ? '処理中...' : '失効ポイントを再発行する'}
              </button>
            </div>
          )}
        </section>

        <section className="mb-8">
          <div className="grid grid-cols-3 gap-4">
            <Link href="/payment" className="bg-white p-4 rounded-lg shadow-md text-center flex flex-col items-center justify-center aspect-square hover:shadow-lg hover:bg-gray-100 transition-all">
              <RiQrCodeLine size={32} className="text-blue-500 mb-2" />
              <span className="font-semibold text-sm text-gray-800">ポイントで支払う</span>
            </Link>
            <Link href="/points/history" className="bg-white p-4 rounded-lg shadow-md text-center flex flex-col items-center justify-center aspect-square hover:shadow-lg hover:bg-gray-100 transition-all">
              <RiFileList3Line size={32} className="text-green-500 mb-2" />
              <span className="font-semibold text-sm text-gray-800">ポイント履歴</span>
            </Link>
            <Link href="/points/charge" className="bg-white p-4 rounded-lg shadow-md text-center flex flex-col items-center justify-center aspect-square hover:shadow-lg hover:bg-gray-100 transition-all">
              <RiCopperCoinLine size={32} className="text-yellow-500 mb-2" />
              <span className="font-semibold text-sm text-gray-800">ポイントをチャージ</span>
            </Link>
          </div>
        </section>

        <section className="bg-white p-4 sm:p-6 rounded-xl shadow-md mb-8">
          <h2 className="text-lg font-bold mb-4 text-gray-800 flex items-center">
            <RiTaskLine className="mr-3 text-yellow-500" />
            参加中のクエスト
          </h2>
          {acceptedQuests.length > 0 ? (
            <div className="space-y-3">
              {acceptedQuests.map((quest) => (
                <div key={quest.id} className="border p-4 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="font-bold text-gray-900">{quest.title}</p>
                    <div className="text-sm mt-1">
                      {quest.status === 'accepted' && <span className="font-bold text-blue-600">参加中</span>}
                      {quest.status === 'submitted' && <span className="font-bold text-gray-600">承認待ち</span>}
                      {quest.status === 'completed' && <span className="font-bold text-green-600">完了済み</span>}
                      {quest.status === 'rejected' && <span className="font-bold text-red-600">却下</span>}
                    </div>
                  </div>
                  {quest.status === 'accepted' && (
                    <Link href={`/quests/submit/${quest.id}`} className="bg-yellow-500 text-white font-bold py-2 px-4 rounded-lg text-xs hover:bg-yellow-600 transition-colors shrink-0">
                      完了報告
                    </Link>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">現在参加中のクエストはありません。</p>
          )}
        </section>

        <section className="mt-12 space-y-4">
          <Link href="/contact" className="block w-full text-center bg-white text-gray-700 font-bold py-3 px-6 rounded-lg hover:bg-gray-100 transition-colors shadow-sm hover:shadow-md">
            <span>お問い合わせ</span>
          </Link>
          <Link href="/cancel-subscription" className="block w-full text-center bg-red-100 text-red-700 font-bold py-3 px-6 rounded-lg hover:bg-red-200 transition-colors shadow-sm hover:shadow-md">
            <span>解約手続き</span>
          </Link>
        </section>
      </main>
    </div>
  );
};

// --- サーバーサイド処理 (お客様のコードから一切変更ありません) ---
export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const cookies = nookies.get(context);
    if (!cookies.token) {
      return { redirect: { destination: '/login?from=/mypage', permanent: false } };
    }

    const token = await getAdminAuth().verifySessionCookie(cookies.token, true);
    const { uid, email } = token;

    const userRef = getAdminDb().collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return { redirect: { destination: '/login', permanent: false } };
    }

    let userData = userDoc.data() || {};
    let userPlan = userData.plan || 'free';

    const { session_id } = context.query;

    if (session_id && userPlan === 'free') {
      const stripe = getAdminStripe();
      try {
        const session = await stripe.checkout.sessions.retrieve(session_id as string, {
          expand: ['subscription'],
        });

        const subscription = session.subscription as Stripe.Subscription;
        if (subscription && ['active', 'trialing'].includes(subscription.status)) {
          await userRef.update({
            plan: 'paid',
            subscriptionStatus: subscription.status,
          });
          userPlan = 'paid';
        }
      } catch (error) {
        console.error("Stripe session retrieval failed:", error);
      }
    }

    if (userPlan === 'free') {
      return { redirect: { destination: '/home', permanent: false } };
    }

    const pointsData = userData.points || {};
    const points = {
      balance: pointsData.balance || 0,
      usableBalance: pointsData.usableBalance || 0,
      pendingBalance: pointsData.pendingBalance || 0,
      activationStatus: pointsData.activationStatus || '',
      expiredAmount: pointsData.expiredAmount || 0,
    };

    const rewards = { total: userData.totalRewards || 0, pending: userData.unpaidRewards || 0 };
    const subscriptionStatus = userData.subscriptionStatus || null;

    const purchasedDealsSnapshot = await userRef.collection('purchasedDeals').where('used', '==', false).get();
    const purchasedDeals = purchasedDealsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PurchasedDeal[];

    const acceptedQuestsSnapshot = await userRef.collection('acceptedQuests').limit(5).get();
    const acceptedQuests = acceptedQuestsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AcceptedQuest[];

    return {
      props: {
        user: { uid, email: email || '' },
        points,
        rewards,
        subscriptionStatus,
        purchasedDeals: JSON.parse(JSON.stringify(purchasedDeals)),
        acceptedQuests: JSON.parse(JSON.stringify(acceptedQuests)),
      },
    };
  } catch (error) {
    console.error("An error occurred in mypage.tsx getServerSideProps:", error);
    return { redirect: { destination: '/login', permanent: false } };
  }
};

export default MyPage;