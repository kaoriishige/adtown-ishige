import { GetServerSideProps, NextPage } from 'next';
import Link from 'next/link';
import nookies from 'nookies';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// --- 型定義 ---
interface DashboardStats {
  totalUsers: number;
  totalPartners: number;
  monthlyRevenue: number; // 今月の売上（仮）
  monthlyPayouts: number; // 今月の支払い報酬額
}

interface TopPartner {
  id: string;
  name: string;
  referralCount: number;
}

interface RecentInquiry {
  id: string;
  name: string;
  category: string;
  createdAt: string;
}

interface DashboardPageProps {
  stats: DashboardStats;
  topPartners: TopPartner[];
  recentInquiries: RecentInquiry[];
}

// --- ページコンポーネント ---
const AdminDashboardPage: NextPage<DashboardPageProps> = ({ stats, topPartners, recentInquiries }) => {
  return (
    <div className="bg-gray-100 min-h-screen p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">運営ダッシュボード</h1>
          <Link href="/admin" className="text-sm text-blue-600 hover:underline">← 管理メニューに戻る</Link>
        </header>

        {/* --- KPIカード --- */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-sm font-medium text-gray-500">総ユーザー数</h2>
            <p className="text-3xl font-bold text-gray-800">{stats.totalUsers.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-sm font-medium text-gray-500">総パートナー数</h2>
            <p className="text-3xl font-bold text-gray-800">{stats.totalPartners.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-sm font-medium text-gray-500">今月の売上 (仮)</h2>
            <p className="text-3xl font-bold text-green-600">{stats.monthlyRevenue.toLocaleString()} 円</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-sm font-medium text-gray-500">今月の支払い報酬</h2>
            <p className="text-3xl font-bold text-red-600">{stats.monthlyPayouts.toLocaleString()} 円</p>
          </div>
        </section>

        {/* --- 2カラムレイアウト --- */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* --- トップパートナーランキング --- */}
          <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">トップパートナー (紹介成功数)</h2>
            <ul className="space-y-4">
              {topPartners.map((partner, index) => (
                <li key={partner.id} className="flex items-center">
                  <span className="text-lg font-bold text-gray-400 w-8">{index + 1}.</span>
                  <div className="flex-grow">
                    <p className="font-semibold text-gray-800">{partner.name}</p>
                  </div>
                  <p className="text-lg font-bold">{partner.referralCount.toLocaleString()} <span className="text-sm font-normal">件</span></p>
                </li>
              ))}
               {topPartners.length === 0 && <p className="text-gray-500">まだ紹介データがありません。</p>}
            </ul>
          </div>

          {/* --- 最近の問い合わせ --- */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">最近の問い合わせ</h2>
            <ul className="space-y-3">
              {recentInquiries.map(inquiry => (
                <li key={inquiry.id} className="border-b pb-2">
                  <p className="font-semibold text-gray-700">{inquiry.name}様</p>
                  <p className="text-sm text-gray-500">{inquiry.category} - {inquiry.createdAt}</p>
                </li>
              ))}
              {recentInquiries.length === 0 && <p className="text-gray-500">最近の問い合わせはありません。</p>}
            </ul>
            <Link href="/admin/inquiry-list" className="text-blue-600 hover:underline mt-4 block text-right">すべて表示 →</Link>
          </div>
        </section>
      </div>
    </div>
  );
};

// --- サーバーサイドでのデータ集計 ---
export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const cookies = nookies.get(context);
    await getAdminAuth().verifySessionCookie(cookies.token, true);

    const adminDb = getAdminDb();
    
    // --- KPIデータの集計 ---
    const usersSnapshot = await adminDb.collection('users').get();
    const totalUsers = usersSnapshot.docs.filter(doc => doc.data().role !== 'partner').length;
    const totalPartners = usersSnapshot.docs.filter(doc => doc.data().role === 'partner').length;

    const now = new Date();
    const monthKey = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    const summaryDoc = await adminDb.collection('referralSummaries').doc(monthKey).get();
    const monthlyPayouts = summaryDoc.exists ? summaryDoc.data()!.grandTotal : 0;
    const monthlyRevenue = 0; // TODO: Stripeから売上データを取得するロジックが必要

    // --- トップパートナーの集計 ---
    const rewardsSnapshot = await adminDb.collection('referralRewards').where('rewardAmount', '>', 0).get();
    const referralCounts: { [uid: string]: number } = {};
    rewardsSnapshot.forEach(doc => {
      const uid = doc.data().referrerUid;
      referralCounts[uid] = (referralCounts[uid] || 0) + 1;
    });
    
    const partnerUids = usersSnapshot.docs
      .filter(doc => doc.data().role === 'partner')
      .map(doc => ({ id: doc.id, name: doc.data().partnerInfo?.storeName || '名称未設定' }));

    const topPartners = partnerUids
      .map(p => ({ ...p, referralCount: referralCounts[p.id] || 0 }))
      .sort((a, b) => b.referralCount - a.referralCount)
      .slice(0, 5); // 上位5件

    // --- 最近の問い合わせの取得 ---
    const inquiriesSnapshot = await adminDb.collection('inquiries').orderBy('createdAt', 'desc').limit(5).get();
    const recentInquiries = inquiriesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        category: data.category,
        createdAt: (data.createdAt as Timestamp).toDate().toLocaleDateString('ja-JP'),
      };
    });

    return {
      props: {
        stats: { totalUsers, totalPartners, monthlyRevenue, monthlyPayouts },
        topPartners: JSON.parse(JSON.stringify(topPartners)),
        recentInquiries: JSON.parse(JSON.stringify(recentInquiries)),
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

export default AdminDashboardPage;