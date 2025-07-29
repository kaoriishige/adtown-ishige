import { GetServerSideProps, NextPage } from 'next';
import { admin } from '../../lib/firebase-admin'; // 正しいインポートパス

interface RewardSummary {
  totalRewardsCount: number;
  totalRewardsAmount: number;
  // 必要に応じて他の概要データも追加
}

interface RewardsPageProps {
  summary: RewardSummary;
  error?: string;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const rewardsSnapshot = await admin.firestore().collection('rewards').get();
    let totalAmount = 0;
    rewardsSnapshot.forEach(doc => {
      totalAmount += doc.data().amount || 0;
    });

    const summary: RewardSummary = {
      totalRewardsCount: rewardsSnapshot.size,
      totalRewardsAmount: totalAmount,
    };

    return {
      props: {
        summary: JSON.parse(JSON.stringify(summary)), // シリアライズ可能に変換
      },
    };
  } catch (error: any) {
    console.error("Error fetching rewards summary:", error);
    return {
      props: {
        summary: { totalRewardsCount: 0, totalRewardsAmount: 0 },
        error: "報酬概要の取得に失敗しました。" + error.message,
      },
    };
  }
};

const RewardsPage: NextPage<RewardsPageProps> = ({ summary, error }) => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">報酬概要</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded mb-4">
        <p>累計報酬数: {summary.totalRewardsCount}</p>
        <p>累計報酬額: {summary.totalRewardsAmount.toLocaleString()} 円</p>
      </div>
      {/* 必要に応じて個別の報酬を表示するUIを追加 */}
    </div>
  );
};

export default RewardsPage;