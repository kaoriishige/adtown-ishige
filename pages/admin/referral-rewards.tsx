import { GetServerSideProps, NextPage } from 'next';
import Link from 'next/link';
import nookies from 'nookies';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// --- 型定義 ---
interface MonthlySummary {
  month: string;
  partnerTotal: number;
  userTotal: number;
  grandTotal: number;
}

interface ReferralRewardsPageProps {
  summaries: MonthlySummary[];
}

// --- ページコンポーネント ---
const ReferralRewardsPage: NextPage<ReferralRewardsPageProps> = ({ summaries }) => {
  return (
    <div className="p-5 max-w-4xl mx-auto">
      <Link href="/admin" className="text-blue-500 hover:underline">
        ← 管理メニューに戻る
      </Link>
      <h1 className="text-3xl font-bold my-6 text-center">紹介報酬管理</h1>

      <div className="overflow-x-auto bg-white shadow-md rounded-lg">
        <table className="min-w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase">月</th>
              <th className="px-6 py-3 border-b-2 border-gray-200 text-right text-xs font-semibold text-gray-600 uppercase">企業・店舗 合計</th>
              <th className="px-6 py-3 border-b-2 border-gray-200 text-right text-xs font-semibold text-gray-600 uppercase">一般 合計</th>
              <th className="px-6 py-3 border-b-2 border-gray-200 text-right text-xs font-semibold text-gray-600 uppercase">総合計</th>
            </tr>
          </thead>
          <tbody>
            {summaries.map((summary) => (
              <tr key={summary.month} className="hover:bg-gray-50">
                <td className="px-6 py-4 border-b border-gray-200 font-medium">{summary.month.replace('-', '年')}月</td>
                <td className="px-6 py-4 border-b border-gray-200 text-right">{summary.partnerTotal.toLocaleString()} 円</td>
                <td className="px-6 py-4 border-b border-gray-200 text-right">{summary.userTotal.toLocaleString()} 円</td>
                <td className="px-6 py-4 border-b border-gray-200 text-right font-bold">{summary.grandTotal.toLocaleString()} 円</td>
              </tr>
            ))}
            {summaries.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-10 text-gray-500">報酬データがまだありません。</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- サーバーサイドでのデータ集計 ---
export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    // 認証チェック
    const cookies = nookies.get(context);
    await getAdminAuth().verifySessionCookie(cookies.token, true);

    const adminDb = getAdminDb();
    
    // 1. 全ユーザーのIDと役割(role)を取得
    const usersSnapshot = await adminDb.collection('users').get();
    const userRoles = new Map<string, string>();
    usersSnapshot.forEach(doc => {
      userRoles.set(doc.id, doc.data().role || 'user'); // roleがなければ一般ユーザーとみなす
    });

    // 2. 全報酬レコードを取得
    const rewardsSnapshot = await adminDb.collection('referralRewards').get();
    
    // 3. 月ごとに集計
    const monthlyData: { [key: string]: { partnerTotal: number; userTotal: number } } = {};

    rewardsSnapshot.forEach(doc => {
      const reward = doc.data();
      const referrerUid = reward.referrerUid;
      const rewardAmount = reward.rewardAmount || 0;
      const createdAt = (reward.createdAt as Timestamp).toDate();
      
      // 'YYYY-MM' 形式のキーを作成
      const monthKey = `${createdAt.getFullYear()}-${(createdAt.getMonth() + 1).toString().padStart(2, '0')}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { partnerTotal: 0, userTotal: 0 };
      }

      // ユーザーの役割に応じて金額を加算
      if (userRoles.get(referrerUid) === 'partner') {
        monthlyData[monthKey].partnerTotal += rewardAmount;
      } else {
        monthlyData[monthKey].userTotal += rewardAmount;
      }
    });

    // 4. ページに渡す形式に整形
    const summaries: MonthlySummary[] = Object.entries(monthlyData).map(([month, totals]) => ({
      month,
      ...totals,
      grandTotal: totals.partnerTotal + totals.userTotal,
    }));

    // 月の降順でソート
    summaries.sort((a, b) => b.month.localeCompare(a.month));

    return {
      props: {
        summaries: JSON.parse(JSON.stringify(summaries)),
      },
    };

  } catch (err) {
    return {
      redirect: {
        destination: '/admin/login',
        permanent: false,
      },
    };
  }
};

export default ReferralRewardsPage;