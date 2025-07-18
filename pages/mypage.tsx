// pages/mypage.tsx

import { useState } from 'react';
import { GetServerSideProps, NextPage } from 'next';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { signOut, User } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { admin } from '../lib/firebase-admin';
import nookies from 'nookies';

// ページが受け取るデータの型
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

const MyPage: NextPage<MyPageProps> = ({ user, rewards }) => {
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // pages/mypage.tsx の handleLogout 関数のみを修正

  // ログアウト処理
  const handleLogout = async () => {
    try {
      // サーバーサイドのCookieを削除するAPIを呼び出す
      await fetch('/api/logout');
      // クライアントサイドのFirebaseからもログアウト
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Logout failed', error);
      alert('ログアウトに失敗しました。');
    }
  };

  // 報酬口座登録の処理
  const handleRegisterPayouts = async () => {
    setIsRedirecting(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not found');

      const token = await currentUser.getIdToken();
      const response = await fetch('/api/create-connect-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Stripeアカウント連携の準備に失敗しました。');
      }

      const { url } = await response.json();
      window.location.href = url;

    } catch (error) {
      console.error(error);
      alert(`エラーが発生しました: ${error instanceof Error ? error.message : '時間をおいて再度お試しください。'}`);
      setIsRedirecting(false);
    }
  };

  const buttonStyle = "w-full max-w-lg p-4 mb-4 text-lg font-bold text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400";

  return (
    <div className="p-5 text-center my-10">
      <h1 className="text-3xl font-bold mb-4">マイページ</h1>
      <p className="mb-8">ようこそ、{user.email}さん</p>

      {/* ▼▼▼ 報酬表示セクションを追加 ▼▼▼ */}
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
      {/* ▲▲▲ ここまで追加 ▲▲▲ */}
      
      <div className="flex flex-col items-center">
        <Link href="/home" className={buttonStyle}>
          アプリページはこちら
        </Link>
        
        <button onClick={handleRegisterPayouts} disabled={isRedirecting} className={buttonStyle}>
          {isRedirecting ? '準備中...' : '報酬受取口座を登録・編集する'}
        </button>
        
        <Link href="/referral-info" className={buttonStyle}>
          紹介用URLとQRコード
        </Link>
        
        <div className="max-w-2xl bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-6 my-8 rounded-lg text-left">
          <h2 className="text-2xl font-bold mb-4 text-yellow-800">紹介制度で“実質無料”どころか、副収入に！</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>8月末までに紹介した方には → 紹介報酬[30%]ずっと継続!!</li>
            <li>9月より初めて紹介された方は→紹介報酬[20%]</li>
          </ul>
        </div>

        <Link href="/contact" className={buttonStyle}>
          お問い合わせ・アプリ希望
        </Link>
        <Link href="/cancel-subscription" className={buttonStyle}>
          解約希望の方はこちら
        </Link>
        <button onClick={handleLogout} className="mt-8 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">
          ログアウト
        </button>
      </div>
    </div>
  );
};

// ▼▼▼ サーバーサイドで報酬データを取得する処理を追加 ▼▼▼
export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const cookies = nookies.get(context);
    const token = await admin.auth().verifyIdToken(cookies.token);
    const { uid, email } = token;

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
    // ログインしていない場合はログインページへリダイレクト
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }
};

export default MyPage;
