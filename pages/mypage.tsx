import { GetServerSideProps, NextPage } from 'next';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useState } from 'react'; // 状態管理のため追加
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase'; // クライアント用Firebase
import admin from '../lib/firebase-admin'; // 【修正点①】サーバー用Firebase Admin SDKをインポート
import nookies from 'nookies';

// Propsの型定義 (変更なし)
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

// 【修正点②】ナビゲーションリンクを配列として定義し、管理しやすくする
const navigationLinks = [
  { href: '/home', text: 'アプリページはこちら' },
  { href: '/payout-settings', text: '報酬受取口座を登録・編集する' },
  { href: '/referral-info', text: '紹介用URLとQRコード' },
  { href: '/contact', text: 'お問い合わせ・アプリ希望' },
  { href: '/cancel-subscription', text: '解約希望の方はこちら' },
];

const MyPage: NextPage<MyPageProps> = ({ user, rewards }) => {
  const router = useRouter();
  // 【修正点③】ログアウト処理中のローディング状態を管理
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true); // 処理開始
    try {
      await fetch('/api/logout'); // Cookieを削除するAPIをコール
      await signOut(auth);      // クライアント側でサインアウト
      router.push('/');         // トップページへリダイレクト
    } catch (error) {
      console.error('Logout failed', error);
      alert('ログアウトに失敗しました。');
      setIsLoggingOut(false); // エラー時にローディング状態を解除
    }
  };

  const buttonStyle = "w-full max-w-lg p-4 mb-4 text-lg font-bold text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors";

  return (
    <div className="flex flex-col min-h-screen">
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
            {/* 配列を元にリンクを自動生成 */}
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

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const cookies = nookies.get(context);
    const token = await admin.auth().verifyIdToken(cookies.token);
    const { uid, email } = token;

    // Firestoreから報酬データを取得
    const db = admin.firestore();
    const rewardsQuery = await db.collection('referralRewards')
      .where('referrerUid', '==', uid)
      .get();

    let total = 0;
    let pending = 0;

    rewardsQuery.forEach(doc => {
      const data = doc.data();
      total += data.rewardAmount;
      if (data.rewardStatus === 'pending') {
        pending += data.rewardAmount;
      }
    });

    return {
      props: {
        user: { uid, email: email || '' },
        rewards: { total, pending },
      },
    };
  } catch (error) {
    // 【修正点④】サーバー側でエラー内容をログに出力し、デバッグしやすくする
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