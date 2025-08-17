import { GetServerSideProps, NextPage } from 'next';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import nookies from 'nookies';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';

interface PartnerDashboardProps {
  user: {
    uid: string;
    email: string;
    storeName: string;
  };
  rewards: {
    total: number;
    pending: number;
  };
}

// --- ★★★ ナビゲーションリンクを定義 ★★★ ---
const navigationLinks = [
  { href: '/partner/payout-settings', text: '報酬受取口座を登録・編集する' },
  { href: '/partner/referral-info', text: '紹介用URLとQRコード' },
  { href: '/contact', text: 'お問い合わせ' }, // テキストを修正
];

const PartnerDashboard: NextPage<PartnerDashboardProps> = ({ user, rewards }) => {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      // サーバーサイドのセッションを破棄するAPIを呼び出す
      await fetch('/api/auth/sessionLogout', { method: 'POST' });
      // クライアントサイドの認証状態をクリア
      await signOut(auth);
      // ログインページへリダイレクト
      router.push('/partner/login');
    } catch (error) {
      console.error('Logout failed', error);
      setIsLoggingOut(false);
    }
  };

  const buttonStyle = "block w-full max-w-lg text-center bg-blue-600 text-white font-bold py-4 px-6 rounded-lg shadow-md hover:bg-blue-700 transition-transform transform hover:scale-105";

  // --- ★★★ 表示部分のJSXを修正 ★★★ ---
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-lg">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-4">
          パートナーマイページ
        </h1>
        <p className="text-center text-gray-600 mb-8">
          ようこそ、{user.storeName}様
        </p>

        {/* --- 紹介報酬セクション --- */}
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-6 rounded-lg shadow-md mb-8">
          <h2 className="font-bold text-xl mb-4">あなたの紹介報酬 💰</h2>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-lg">累計報酬額:</span>
              <span className="text-2xl font-bold">
                {rewards.total.toLocaleString()} 円
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-lg">未払い報酬額:</span>
              <span className="text-2xl font-bold">
                {rewards.pending.toLocaleString()} 円
              </span>
            </div>
          </div>
          <p className="text-xs text-green-600 mt-4">
            ※未払い報酬額が3,000円以上になると、翌月15日にご登録の口座へ自動で振り込まれます。
          </p>
        </div>

        {/* --- メニューボタンセクション --- */}
        <div className="space-y-4">
          {navigationLinks.map((link) => (
            <Link key={link.href} href={link.href} className={buttonStyle}>
              {link.text}
            </Link>
          ))}
        </div>

        {/* --- ログアウトボタン --- */}
        <div className="text-center mt-12">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="bg-gray-200 text-gray-700 font-semibold py-2 px-6 rounded-lg hover:bg-gray-300"
          >
            {isLoggingOut ? 'ログアウト中...' : 'ログアウト'}
          </button>
        </div>
      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();
    const cookies = nookies.get(context);
    
    // Cookieからセッショントークンを検証
    const token = await adminAuth.verifySessionCookie(cookies.token, true);
    const { uid, email } = token;

    const userDoc = await adminDb.collection('users').doc(uid).get();
    // パートナーでなければログインページに追い返す
    if (!userDoc.exists || userDoc.data()?.role !== 'partner') {
        return { redirect: { destination: '/partner/login', permanent: false } };
    }
    
    const storeName = userDoc.data()?.storeName || 'パートナー';

    // (報酬データの取得ロジックはひとまず固定値)
    const rewards = { total: 0, pending: 0 };

    return {
      props: {
        user: JSON.parse(JSON.stringify({ uid, email: email || '', storeName })),
        rewards,
      },
    };
  } catch (error) {
    // エラーがあれば問答無用でログインページへ
    return {
      redirect: {
        destination: '/partner/login',
        permanent: false,
      },
    };
  }
};

export default PartnerDashboard;