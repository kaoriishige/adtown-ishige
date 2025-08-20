import { GetServerSideProps, NextPage } from 'next';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import nookies from 'nookies';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';

// Propsの型定義に、契約状況を追加
interface MyPageProps {
  user: {
    uid: string;
    email: string;
  };
  rewards: {
    total: number;
    pending: number;
  };
  subscriptionStatus: 'active' | 'trial' | 'canceled' | null; // 契約状況
}

const MyPage: NextPage<MyPageProps> = ({ user, rewards, subscriptionStatus }) => {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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

  // ★★★ 契約状況が 'active' の場合のみ、紹介機能が有効であると判断 ★★★
  const isReferralActive = subscriptionStatus === 'active';

  const buttonStyle = "w-full max-w-lg p-4 mb-4 text-lg font-bold text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors";

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-grow">
        <div className="p-5 text-center my-10">
          <h1 className="text-3xl font-bold mb-4">マイページ</h1>
          <p className="mb-8">ようこそ、{user.email}さん</p>

          {/* --- 紹介報酬セクション --- */}
          <div className="max-w-2xl mx-auto bg-green-100 border border-green-300 text-green-800 p-6 my-8 rounded-lg text-left shadow">
            <h2 className="text-2xl font-bold mb-4 text-green-900">あなたの紹介報酬 💰</h2>
            <div className="space-y-2 text-lg">
              <div className="flex justify-between">
                <span className="font-semibold">累計報酬額:</span>
                <span className="font-bold">{rewards.total.toLocaleString()} 円</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">未払い報酬額:</span>
                <span className="font-bold text-red-600">{rewards.pending.toLocaleString()} 円</span>
              </div>
            </div>
            <p className="text-xs mt-4 text-gray-600">※未払い報酬額が3,000円以上になると、翌月15日にご登録の口座へ自動で振り込まれます。</p>
          </div>
          
          {/* --- 注意書き --- */}
          <div className="max-w-2xl mx-auto bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 rounded-md mb-8 text-left">
            <h3 className="font-bold">紹介制度のご利用について</h3>
            <ul className="list-disc list-inside text-sm mt-2 space-y-1">
              <li>紹介機能は、有料プラン（月額980円）をご利用中のお客様のみお使いいただけます。</li>
              <li>無料トライアル期間中は、紹介機能をご利用になれません。</li>
              <li>有料プランを解約された場合、解約時点をもって紹介料のお支払いは停止されます。</li>
            </ul>
          </div>
          
          <div className="flex flex-col items-center">
            {/* --- ボタンのリスト --- */}
            <Link href="/home" className={buttonStyle}>アプリページはこちら</Link>
            <Link href="/payout-settings" className={buttonStyle}>報酬受取口座を登録・編集する</Link>
            
            {isReferralActive ? (
              // 有料会員の場合：クリックできるボタンを表示
              <Link href="/referral-info" className={buttonStyle}>
                紹介用URLとQRコード
              </Link>
            ) : (
              // それ以外の場合：クリックできない説明付きのグレーのボタンを表示
              <div className="w-full max-w-lg p-4 mb-4 text-center bg-gray-300 text-gray-600 rounded-lg cursor-not-allowed">
                <h3 className="font-bold text-lg">紹介用URLとQRコード</h3>
                <p className="text-sm mt-1">
                  (有料プランで利用可能)
                </p>
              </div>
            )}

            <Link href="/contact" className={buttonStyle}>お問い合わせ・アプリ希望</Link>
            {/* --- ★★★ ここを修正 ★★★ --- */}
            <Link href="/cancel-subscription" className={buttonStyle}>解約希望の方はこちら</Link>
            
            {/* --- 紹介制度の文章 --- */}
            <div className="max-w-2xl bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-6 my-8 rounded-lg text-left">
              <h2 className="text-2xl font-bold mb-4 text-yellow-800">紹介制度で“実質無料”どころか、副収入に！</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>9月末までに紹介した方には → 紹介報酬[30%]ずっと継続!!</li>
                <li>10月より初めて紹介された方は→紹介報酬[20%]</li>
              </ul>
            </div>

            <button onClick={handleLogout} disabled={isLoggingOut} className="mt-8 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400">
              {isLoggingOut ? 'ログアウト中...' : 'ログアウト'}
            </button>
          </div>
        </div>
      </main>
      <footer className="text-center text-xs text-gray-500 py-4 border-t">
        <Link href="/legal" className="hover:underline">特定商取引法に基づく表記</Link>
        <p className="mt-1">© 2025 株式会社adtown</p>
      </footer>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();
    const cookies = nookies.get(context);
    
    const token = await adminAuth.verifySessionCookie(cookies.token, true);
    const { uid, email } = token;

    const userDoc = await adminDb.collection('users').doc(uid).get();
    if (!userDoc.exists || userDoc.data()?.role === 'partner') {
        return { redirect: { destination: '/login', permanent: false } };
    }
    
    // データベースから契約状況を取得します
    const subscriptionStatus = userDoc.data()?.subscriptionStatus || null;
    
    const rewards = { total: 0, pending: 0 };

    return {
      props: {
        user: JSON.parse(JSON.stringify({ uid, email: email || '' })),
        rewards,
        subscriptionStatus, // ページに契約状況を渡す
      },
    };
  } catch (error) {
    return { redirect: { destination: '/login', permanent: false } };
  }
};

export default MyPage;