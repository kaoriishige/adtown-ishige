import { GetServerSideProps, NextPage } from 'next';
// ▼▼▼ Client SDKのimportを削除 ▼▼▼
// import { collection, getDocs } from 'firebase/firestore'; 
import { admin } from '../../lib/firebase-admin';
import Link from 'next/link';

// 報酬データの型を定義
interface RewardData {
  id: string;
  paymentDate: admin.firestore.Timestamp;
  referrerUid: string;
  rewardAmount: number;
  referredUid: string;
}

// 表示する集計データの型
interface MonthlyRewardSummary {
  month: string;
  referrerEmail: string;
  referralCount: number;
  totalReward: number;
}

interface RewardsPageProps {
  summaries: MonthlyRewardSummary[];
}

const RewardsPage: NextPage<RewardsPageProps> = ({ summaries }) => {
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">紹介報酬：月別集計一覧</h1>
      
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-4 text-left font-semibold text-gray-700">月</th>
              <th className="p-4 text-left font-semibold text-gray-700">紹介者（メール）</th>
              <th className="p-4 text-left font-semibold text-gray-700">対象人数</th>
              <th className="p-4 text-left font-semibold text-gray-700">報酬額（円）</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {summaries.map((summary, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="p-4 whitespace-nowrap">{summary.month}</td>
                <td className="p-4 whitespace-nowrap">{summary.referrerEmail}</td>
                <td className="p-4 whitespace-nowrap">{summary.referralCount} 人</td>
                <td className="p-4 whitespace-nowrap">{summary.totalReward.toLocaleString()} 円</td>
              </tr>
            ))}
            {summaries.length === 0 && (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray-500">
                  報酬データはまだありません。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-8">
        <Link href="/admin" className="text-blue-600 hover:underline">
          管理トップに戻る
        </Link>
      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    const db = admin.firestore();
    // ▼▼▼ Admin SDKの正しい書き方に修正 ▼▼▼
    const rewardsSnapshot = await db.collection('referralRewards').get();
    
    const rewards = rewardsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as RewardData[];

    const summaryMap: { [key: string]: { totalReward: number; uids: Set<string>; referrerUid: string } } = {};

    for (const reward of rewards) {
      if (reward.paymentDate && reward.referrerUid) {
        const paymentDate = reward.paymentDate.toDate();
        const monthKey = `${paymentDate.getFullYear()}-${(paymentDate.getMonth() + 1).toString().padStart(2, '0')}`;
        const groupKey = `${monthKey}-${reward.referrerUid}`;

        if (!summaryMap[groupKey]) {
          summaryMap[groupKey] = {
            totalReward: 0,
            uids: new Set<string>(),
            referrerUid: reward.referrerUid,
          };
        }
        summaryMap[groupKey].totalReward += reward.rewardAmount;
        summaryMap[groupKey].uids.add(reward.referredUid);
      }
    }

    const referrerUids = [...new Set(Object.values(summaryMap).map(s => s.referrerUid))];
    const userRecords = await Promise.all(
      referrerUids.map(uid => admin.auth().getUser(uid).catch(() => null))
    );
    const emailMap = new Map(userRecords.filter(Boolean).map(u => [u!.uid, u!.email]));

    const summaries: MonthlyRewardSummary[] = Object.entries(summaryMap).map(([key, data]) => ({
      month: `${key.substring(0, 4)}-${key.substring(5, 7)}`,
      referrerEmail: emailMap.get(data.referrerUid) || '不明なユーザー',
      referralCount: data.uids.size,
      totalReward: data.totalReward,
    }));

    summaries.sort((a, b) => b.month.localeCompare(a.month));

    return { 
      props: { 
        summaries: JSON.parse(JSON.stringify(summaries)) 
      } 
    };

  } catch (error) {
    console.error("Error in getServerSideProps for rewards page:", error);
    return { props: { summaries: [] } };
  }
};

export default RewardsPage;