import { GetServerSideProps, NextPage } from 'next';
import Link from 'next/link';
import nookies from 'nookies';
import { getAdminAuth, getAdminDb } from '../../lib/firebase-admin';

// 型定義
interface RewardSummary {
  totalRewardsCount: number;
  totalRewardsAmount: number;
  paidRewardsCount: number;
  pendingRewardsCount: number;
}

interface RewardsPageProps {
  summary: RewardSummary;
}

const RewardsPage: NextPage<RewardsPageProps> = ({ summary }) => {
  return (
    <div className="p-5">
      <Link href="/admin" className="text-blue-500 hover:underline">
        ← 管理メニューに戻る
      </Link>
      <h1 className="text-3xl font-bold my-6 text-center">報酬サマリー</h1>
      <div className="max-w-xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-600">報酬発生件数</h2>
          <p className="text-3xl font-bold text-gray-900">{summary.totalRewardsCount} 件</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-600">報酬総額</h2>
          <p className="text-3xl font-bold text-gray-900">{summary.totalRewardsAmount.toLocaleString()} 円</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-600">支払い済み件数</h2>
          <p className="text-3xl font-bold text-green-600">{summary.paidRewardsCount} 件</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-600">未払い件数</h2>
          <p className="text-3xl font-bold text-red-600">{summary.pendingRewardsCount} 件</p>
        </div>
      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const adminAuth = getAdminAuth();
  const adminDb = getAdminDb();

  if (!adminAuth || !adminDb) {
    console.error("Firebase Admin on RewardsPage failed to initialize.");
    return { redirect: { destination: '/login', permanent: false } };
  }

  try {
    // 管理者認証
    const cookies = nookies.get(context);
    await adminAuth.verifyIdToken(cookies.token);

    // 全ての報酬データを取得
    const rewardsSnapshot = await adminDb.collection('referralRewards').get();

    const summary: RewardSummary = {
      totalRewardsCount: rewardsSnapshot.size,
      totalRewardsAmount: 0,
      paidRewardsCount: 0,
      pendingRewardsCount: 0,
    };

    rewardsSnapshot.forEach(doc => {
      const data = doc.data();
      summary.totalRewardsAmount += data.rewardAmount || 0;
      if (data.rewardStatus === 'paid') {
        summary.paidRewardsCount++;
      } else if (data.rewardStatus === 'pending') {
        summary.pendingRewardsCount++;
      }
    });

    return { props: { summary } };
  } catch (error) {
    console.error("Error fetching rewards summary:", error);
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }
};

export default RewardsPage;