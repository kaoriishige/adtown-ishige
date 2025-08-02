import { GetServerSideProps, NextPage } from 'next';
import Link from 'next/link';
import { getAdminAuth, getAdminDb } from '../../lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// --- 型定義 ---

// 報酬データの型
interface Reward {
  id: string;
  referrerEmail: string;
  referredEmail: string;
  rewardAmount: number;
  rewardStatus: '支払い済み' | '未払い';
  createdAt: string; // JSONで渡せるように文字列にする
}

// ページコンポーネントが受け取るPropsの型
interface ReferralRewardsPageProps {
  rewards: Reward[];
}


// --- ページコンポーネント ---

const ReferralRewardsPage: NextPage<ReferralRewardsPageProps> = ({ rewards }) => {
  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link href="/admin" className="text-blue-600 hover:underline">
            ← 管理メニューに戻る
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-800 text-center mb-8">
          紹介報酬履歴
        </h1>

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase">発生日時</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase">紹介者</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase">被紹介者</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase">報酬額</th>
                  <th className="py-3 px-4 text-center text-xs font-semibold text-gray-600 uppercase">ステータス</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {rewards.length > 0 ? (
                  rewards.map((reward) => (
                    <tr key={reward.id} className="hover:bg-gray-50">
                      <td className="py-4 px-4 whitespace-nowrap">{new Date(reward.createdAt).toLocaleString('ja-JP')}</td>
                      <td className="py-4 px-4 whitespace-nowrap">{reward.referrerEmail}</td>
                      <td className="py-4 px-4 whitespace-nowrap">{reward.referredEmail}</td>
                      <td className="py-4 px-4 whitespace-nowrap">{reward.rewardAmount.toLocaleString()} 円</td>
                      <td className="py-4 px-4 text-center">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          reward.rewardStatus === '支払い済み' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {reward.rewardStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-gray-500">報酬データはありません。</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};


// --- サーバーサイドでのデータ取得 ---

export const getServerSideProps: GetServerSideProps = async () => {
  const adminAuth = getAdminAuth();
  const adminDb = getAdminDb();

  // Firebase Admin SDKが初期化できない場合は、空のデータを返す
  if (!adminAuth || !adminDb) {
    console.error("Firebase Admin SDK for referral-rewards failed to initialize.");
    return { props: { rewards: [] } };
  }

  try {
    // 認証チェックは一時的にすべて削除しています

    const rewardsSnapshot = await adminDb.collection('referralRewards').orderBy('createdAt', 'desc').get();
    
    // ユーザー情報を効率的に取得するためのキャッシュ
    const usersCache = new Map<string, string>();
    const getUserEmail = async (uid: string): Promise<string> => {
        if (!uid) return 'UIDなし';
        if (usersCache.has(uid)) return usersCache.get(uid)!;
        try {
            const userRecord = await adminAuth.getUser(uid);
            const email = userRecord.email || 'メールアドレス不明';
            usersCache.set(uid, email);
            return email;
        } catch (e) {
            usersCache.set(uid, 'ユーザー取得失敗');
            return 'ユーザー取得失敗';
        }
    };

    // 取得した報酬データとユーザー情報を組み合わせる
    const rewards = await Promise.all(
      rewardsSnapshot.docs.map(async (doc) => {
        const data = doc.data();
        const createdAt = data.createdAt as Timestamp;
        
        const referrerEmail = await getUserEmail(data.referrerUid);
        const referredEmail = await getUserEmail(data.referredUid);
        
        const reward: Reward = {
          id: doc.id,
          referrerEmail,
          referredEmail,
          rewardAmount: data.rewardAmount || 0,
          rewardStatus: data.rewardStatus === 'paid' ? '支払い済み' : '未払い',
          createdAt: createdAt.toDate().toISOString(),
        };
        return reward;
      })
    );

    return { 
      props: { 
        rewards: JSON.parse(JSON.stringify(rewards)) 
      } 
    };

  } catch (error) {
    console.error("Error fetching referral rewards:", error);
    return { props: { rewards: [] } };
  }
};

export default ReferralRewardsPage;
