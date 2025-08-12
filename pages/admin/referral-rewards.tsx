import { GetServerSideProps, NextPage } from 'next';
import Link from 'next/link';
import { getAdminAuth, getAdminDb } from '../../lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// --- 型定義 ---

// ★変更点(1): 報酬データの方に氏名を追加★
interface Reward {
  id: string;
  referrerName: string; // 紹介者の氏名
  referrerEmail: string;
  referredName: string; // 被紹介者の氏名
  referredEmail: string;
  rewardAmount: number;
  rewardStatus: '支払い済み' | '未払い';
  createdAt: string;
}

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
                  {/* ★変更点(2): テーブルのヘッダーに氏名列を追加★ */}
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase">紹介者（氏名）</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase">紹介者（メール）</th>
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
                      {/* ★変更点(3): 取得した氏名とメールアドレスをそれぞれの列に表示★ */}
                      <td className="py-4 px-4 whitespace-nowrap">{reward.referrerName}</td>
                      <td className="py-4 px-4 whitespace-nowrap">{reward.referrerEmail}</td>
                      <td className="py-4 px-4 whitespace-nowrap">{reward.referredName}</td>
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
                    {/* ★変更点(4): colSpanを6に変更★ */}
                    <td colSpan={6} className="text-center py-10 text-gray-500">報酬データはありません。</td>
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

  if (!adminAuth || !adminDb) {
    console.error("Firebase Admin SDK for referral-rewards failed to initialize.");
    return { props: { rewards: [] } };
  }

  try {
    const rewardsSnapshot = await adminDb.collection('referralRewards').orderBy('createdAt', 'desc').get();
    
    // ★変更点(5): ユーザー情報を取得するヘルパー関数を、氏名も返すように変更★
    const usersCache = new Map<string, { name: string; email: string }>();
    const getUserInfo = async (uid: string): Promise<{ name: string; email: string }> => {
        if (!uid) return { name: 'UIDなし', email: '' };
        if (usersCache.has(uid)) return usersCache.get(uid)!;
        try {
            const userRecord = await adminAuth.getUser(uid);
            const userInfo = {
                name: userRecord.displayName || '氏名未登録',
                email: userRecord.email || 'メール不明',
            };
            usersCache.set(uid, userInfo);
            return userInfo;
        } catch (e) {
            const errorInfo = { name: 'ユーザー取得失敗', email: ''};
            usersCache.set(uid, errorInfo);
            return errorInfo;
        }
    };

    const rewards = await Promise.all(
      rewardsSnapshot.docs.map(async (doc) => {
        const data = doc.data();
        const createdAt = data.createdAt as Timestamp;
        
        // ★変更点(6): getUserInfoを使って、氏名とメールアドレスを両方取得★
        const referrerInfo = await getUserInfo(data.referrerUid);
        const referredInfo = await getUserInfo(data.referredUid);
        
        const reward: Reward = {
          id: doc.id,
          referrerName: referrerInfo.name,
          referrerEmail: referrerInfo.email,
          referredName: referredInfo.name, // 被紹介者も氏名を表示
          referredEmail: referredInfo.email,
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
