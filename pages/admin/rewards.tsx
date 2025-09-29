import { GetServerSideProps, NextPage } from 'next';
import Link from 'next/link';
import nookies from 'nookies';
import { adminAuth, adminDb } from '@/lib/firebase-admin'; // 正しいインポートに修正
import { Timestamp } from 'firebase-admin/firestore';

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

// ページコンポーネント
const RewardsPage: NextPage<RewardsPageProps> = ({ summary }) => {
  return (
    <div className="p-5 bg-gray-50 min-h-screen">
      <Link href="/admin" className="text-blue-500 hover:underline">
        ← 管理メニューに戻る
      </Link>
      <h1 className="text-3xl font-bold my-6 text-center">報酬サマリー</h1>
      <div className="max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-600">報酬発生 合計件数</h2>
          <p className="text-3xl font-bold text-gray-900 mt-2">{summary.totalRewardsCount} 件</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-600">報酬発生 合計金額</h2>
          <p className="text-3xl font-bold text-gray-900 mt-2">{summary.totalRewardsAmount.toLocaleString()} 円</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-600">支払い済み 件数</h2>
          <p className="text-3xl font-bold text-green-600 mt-2">{summary.paidRewardsCount} 件</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-600">未払い 件数</h2>
          <p className="text-3xl font-bold text-red-600 mt-2">{summary.pendingRewardsCount} 件</p>
        </div>
      </div>
    </div>
  );
};

// サーバーサイドでのデータ取得
export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const cookies = nookies.get(context);
    if (!cookies.token) {
        return { redirect: { destination: '/admin/login', permanent: false } };
    }
    
    // 認証チェックを正しい呼び出しに修正
    await adminAuth.verifyIdToken(cookies.token);

    // Admin SDKを使ってFirestoreからデータを取得
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
        destination: '/admin/login',
        permanent: false,
      },
    };
  }
};

export default RewardsPage;