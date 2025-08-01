import { GetServerSideProps, NextPage } from 'next';
import Link from 'next/link';
import nookies from 'nookies';
import { getAdminAuth, getAdminDb } from '../../lib/firebase-admin';

// 型定義
interface ReferralReward {
  id: string;
  referrerEmail: string; // 紹介者のメールアドレス
  newUserEmail: string;  // 新規登録者のメールアドレス
  rewardAmount: number;  // 報酬額
  rewardStatus: string;  // ステータス (pending, paidなど)
  createdAt: string;     // 発生日時
}

interface ReferralRewardsPageProps {
  rewards: ReferralReward[];
}

const ReferralRewardsPage: NextPage<ReferralRewardsPageProps> = ({ rewards }) => {
  return (
    <div className="p-5">
      <Link href="/admin" className="text-blue-500 hover:underline">
        ← 管理メニューに戻る
      </Link>
      <h1 className="text-3xl font-bold my-6 text-center">紹介報酬管理</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow-md rounded-lg">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">発生日時</th>
              <th className="px-6 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">紹介者</th>
              <th className="px-6 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">新規登録者</th>
              <th className="px-6 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">報酬額</th>
              <th className="px-6 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ステータス</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {rewards.map((reward) => (
              <tr key={reward.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 border-b border-gray-200 whitespace-nowrap">{reward.createdAt}</td>
                <td className="px-6 py-4 border-b border-gray-200 whitespace-nowrap">{reward.referrerEmail}</td>
                <td className="px-6 py-4 border-b border-gray-200 whitespace-nowrap">{reward.newUserEmail}</td>
                <td className="px-6 py-4 border-b border-gray-200 whitespace-nowrap">{reward.rewardAmount.toLocaleString()} 円</td>
                <td className="px-6 py-4 border-b border-gray-200 whitespace-nowrap">{reward.rewardStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rewards.length === 0 && <p className="text-center mt-4">紹介報酬の履歴はありません。</p>}
      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const adminAuth = getAdminAuth();
  const adminDb = getAdminDb();

  if (!adminAuth || !adminDb) {
    console.error("Firebase Admin on ReferralRewards failed to initialize.");
    return { redirect: { destination: '/login', permanent: false } };
  }

  try {
    // 管理者認証
    const cookies = nookies.get(context);
    await adminAuth.verifyIdToken(cookies.token);

    // 報酬データを取得
    const rewardsSnapshot = await adminDb.collection('referralRewards').orderBy('createdAt', 'desc').get();
    
    const rewards = rewardsSnapshot.docs.map(doc => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : null;
      return {
        id: doc.id,
        referrerEmail: data.referrerEmail || '不明',
        newUserEmail: data.newUserEmail || '不明',
        rewardAmount: data.rewardAmount || 0,
        rewardStatus: data.rewardStatus || '不明',
        createdAt: createdAt ? createdAt.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }) : '日付不明',
      };
    });

    return { props: { rewards } };
  } catch (error) {
    console.error("Error fetching referral rewards:", error);
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }
};

export default ReferralRewardsPage;