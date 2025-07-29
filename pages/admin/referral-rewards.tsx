import { GetServerSideProps, NextPage } from 'next';
import admin from '../../lib/firebase-admin';

interface ReferralReward {
  id: string;
  referrerUid: string;
  referredUid: string;
  amount: number;
  status: string; // e.g., 'pending', 'paid'
  createdAt: string; // ISO string
}

interface ReferralRewardsPageProps {
  referralRewards: ReferralReward[];
  error?: string;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    // Firebase Admin SDKはlib/firebase-admin.tsで初期化されています
    const rewardsSnapshot = await admin.firestore().collection('rewards').get();
    const referralRewards = rewardsSnapshot.docs.map(doc => ({
      id: doc.id,
      referrerUid: doc.data().referrerUid || '',
      referredUid: doc.data().referredUid || '',
      amount: doc.data().amount || 0,
      status: doc.data().status || '',
      createdAt: doc.data().createdAt?.toDate().toISOString() || '',
    }));

    return {
      props: {
        referralRewards: JSON.parse(JSON.stringify(referralRewards)), // シリアライズ可能に変換
      },
    };
  } catch (error: any) {
    console.error("Error fetching referral rewards:", error);
    return {
      props: {
        referralRewards: [],
        error: "報酬データの取得に失敗しました。" + error.message,
      },
    };
  }
};

const ReferralRewardsPage: NextPage<ReferralRewardsPageProps> = ({ referralRewards, error }) => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">紹介報酬履歴</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {referralRewards.length === 0 ? (
        <p>紹介報酬履歴はありません。</p>
      ) : (
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b">ID</th>
              <th className="py-2 px-4 border-b">紹介者UID</th>
              <th className="py-2 px-4 border-b">被紹介者UID</th>
              <th className="py-2 px-4 border-b">報酬額</th>
              <th className="py-2 px-4 border-b">ステータス</th>
              <th className="py-2 px-4 border-b">作成日</th>
            </tr>
          </thead>
          <tbody>
            {referralRewards.map((reward) => (
              <tr key={reward.id}>
                <td className="py-2 px-4 border-b">{reward.id}</td>
                <td className="py-2 px-4 border-b">{reward.referrerUid}</td>
                <td className="py-2 px-4 border-b">{reward.referredUid}</td>
                <td className="py-2 px-4 border-b">{reward.amount}</td>
                <td className="py-2 px-4 border-b">{reward.status}</td>
                <td className="py-2 px-4 border-b">{new Date(reward.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ReferralRewardsPage;