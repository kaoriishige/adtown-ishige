import { GetServerSideProps, NextPage } from 'next';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase'; // クライアント用Firebase
import nookies from 'nookies';
import { getAdminAuth, getAdminDb } from '../lib/firebase-admin'; // ★ 新しいインポート
import { Timestamp } from 'firebase-admin/firestore';

// Propsの型定義
interface MyPageProps {
  user: {
    uid: string;
    email: string;
  };
  rewards: {
    total: number;
    pending: number;
  };
}

// ナビゲーションリンクの配列
const navigationLinks = [
  { href: '/home', text: 'アプリページはこちら' },
  { href: '/payout-settings', text: '報酬受取口座を登録・編集する' },
  { href: '/referral-info', text: '紹介用URLとQRコード' },
  { href: '/contact', text: 'お問い合わせ・アプリ希望' },
  { href: '/cancel-subscription', text: '解約希望の方はこちら' },
];

// ページコンポーネント
const MyPage: NextPage<MyPageProps> = ({ user, rewards }) => {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/logout');
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Logout failed', error);
      alert('ログアウトに失敗しました。');
      setIsLoggingOut(false);
    }
  };

  const buttonStyle = "w-full max-w-lg p-4 mb-4 text-lg font-bold text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors";

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-grow">
        <div className="p-5 text-center my-10">
          <h1 className="text-3xl font-bold mb-4">マイページ</h1>
          <p className="mb-8">ようこそ、{user.email}さん</p>

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
          
          <div className="flex flex-col items-center">
            {navigationLinks.map((link) => (
              <Link key={link.href} href={link.href} className={buttonStyle}>
                {link.text}
              </Link>
            ))}
            
            <div className="max-w-2xl bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-6 my-8 rounded-lg text-left">
              <h2 className="text-2xl font-bold mb-4 text-yellow-800">紹介制度で“実質無料”どころか、副収入に！</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>8月末までに紹介した方には → 紹介報酬[30%]ずっと継続!!</li>
                <li>9月より初めて紹介された方は→紹介報酬[20%]</li>
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

// サーバーサイドでのデータ取得
export const getServerSideProps: GetServerSideProps = async (context) => {
  // ★ 新しい方法でAuthとDBを呼び出す
  const adminAuth = getAdminAuth();
  const adminDb = getAdminDb();

  if (!adminAuth || !adminDb) {
    console.error("Firebase Admin on MyPage failed to initialize.");
    return { redirect: { destination: '/login', permanent: false } };
  }

  try {
    const cookies = nookies.get(context);
    const token = await adminAuth.verifyIdToken(cookies.token);
    const { uid, email } = token;

    // Firestoreから報酬データを取得
    const rewardsQuery = await adminDb.collection('referralRewards')
      .where('referrerUid', '==', uid)
      .get();

    let total = 0;
    let pending = 0;

    rewardsQuery.forEach(doc => {
      const data = doc.data();
      total += data.rewardAmount || 0;
      if (data.rewardStatus === 'pending') {
        pending += data.rewardAmount || 0;
      }
    });

    return {
      props: {
        user: { uid, email: email || '' },
        rewards: { total, pending },
      },
    };
  } catch (error) {
    console.error("MyPage Auth Error or Data Fetch Error:", error);
    // 認証失敗時やエラー時はログインページへリダイレクト
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }
};

export default MyPage;