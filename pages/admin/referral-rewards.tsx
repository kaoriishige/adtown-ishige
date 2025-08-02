import { GetServerSideProps, NextPage } from 'next';
import Link from 'next/link';
import nookies from 'nookies';
import * as admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// --- ここからが直接書き込んだコード ---
let app: admin.app.App | null = null;
function initializeFirebaseAdmin(): admin.app.App {
  if (admin.apps.length > 0) {
    app = admin.app();
    return app;
  }
  const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (!serviceAccountBase64) {
    throw new Error('環境変数 FIREBASE_SERVICE_ACCOUNT_BASE64 が設定されていません。');
  }
  const serviceAccountJson = Buffer.from(serviceAccountBase64, 'base64').toString('utf-8');
  const serviceAccount = JSON.parse(serviceAccountJson);
  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  return app;
}
function getAdminAuth(): admin.auth.Auth | null {
  try {
    if (!app) initializeFirebaseAdmin();
    return admin.auth(app!);
  } catch (e) { return null; }
}
function getAdminDb(): admin.firestore.Firestore | null {
  try {
    if (!app) initializeFirebaseAdmin();
    return admin.firestore(app!);
  } catch (e) { return null; }
}
// --- ここまでが直接書き込んだコード ---

// 型定義
interface ReferralReward {
  id: string;
  referrerEmail: string;
  referredEmail: string;
  rewardAmount: number;
  rewardStatus: string;
  createdAt: string;
}

interface ReferralRewardsPageProps {
  rewards: ReferralReward[];
}

// サーバーサイドでのデータ取得
export const getServerSideProps: GetServerSideProps = async (context) => {
  const adminAuth = getAdminAuth();
  const adminDb = getAdminDb();

  if (!adminAuth || !adminDb) {
    return { redirect: { destination: '/login', permanent: false } };
  }

  try {
    // 管理者認証
    const cookies = nookies.get(context);
    await adminAuth.verifyIdToken(cookies.token);

    const rewardsSnapshot = await adminDb.collection('referralRewards').orderBy('createdAt', 'desc').get();
    
    // ユーザー情報を効率的に取得するためのキャッシュ
    const usersCache = new Map<string, string>();
    const getUserEmail = async (uid: string): Promise<string> => {
        if (usersCache.has(uid)) {
            return usersCache.get(uid)!;
        }
        try {
            const userRecord = await adminAuth.getUser(uid);
            const email = userRecord.email || '不明';
            usersCache.set(uid, email);
            return email;
        } catch (e) {
            usersCache.set(uid, '取得失敗');
            return '取得失敗';
        }
    };

    const rewards = await Promise.all(rewardsSnapshot.docs.map(async (doc) => {
      const data = doc.data();
      const createdAt = data.createdAt as Timestamp;
      
      const referrerEmail = await getUserEmail(data.referrerUid);
      const referredEmail = await getUserEmail(data.referredUid);
      
      return {
        id: doc.id,
        referrerEmail: referrerEmail,
        referredEmail: referredEmail,
        rewardAmount: data.rewardAmount || 0,
        rewardStatus: data.rewardStatus === 'paid' ? '支払い済み' : '未払い',
        createdAt: createdAt.toDate().toISOString(),
      };
    }));

    return { props: { rewards } };

  } catch (error) {
    console.error("Error fetching referral rewards:", error);
    return { redirect: { destination: '/login', permanent: false } };
  }
};

// ページコンポーネント
const ReferralRewardsPage: NextPage<ReferralRewardsPageProps> = ({ rewards }) => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">
        <Link href="/admin" className="text-blue-500 hover:underline">←</Link>
        {' '}紹介報酬履歴
      </h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-2 px-4 border-b">発生日時</th>
              <th className="py-2 px-4 border-b">紹介者</th>
              <th className="py-2 px-4 border-b">被紹介者</th>
              <th className="py-2 px-4 border-b">報酬額</th>
              <th className="py-2 px-4 border-b">ステータス</th>
            </tr>
          </thead>
          <tbody>
            {rewards.map((reward) => (
              <tr key={reward.id} className="text-center">
                <td className="py-2 px-4 border-b">{new Date(reward.createdAt).toLocaleString('ja-JP')}</td>
                <td className="py-2 px-4 border-b">{reward.referrerEmail}</td>
                <td className="py-2 px-4 border-b">{reward.referredEmail}</td>
                <td className="py-2 px-4 border-b">{reward.rewardAmount.toLocaleString()} 円</td>
                <td className="py-2 px-4 border-b">
                   <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    reward.rewardStatus === '支払い済み' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {reward.rewardStatus}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReferralRewardsPage;