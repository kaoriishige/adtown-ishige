import { NextPage, GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import nookies from 'nookies';
import { getAdminAuth, getAdminDb } from '../../lib/firebase-admin';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useEffect, useState } from 'react';

// --- データ用の型定義 ---
interface KpiData {
  totalUsers: number; userChange: number; paidUsers: number; freeUsers: number;
  totalStores: number; storeChange: number; restaurantCount: number; beautyCount: number; otherCount: number;
  monthlyRevenue: number; revenueChangePercent: number;
  donationTotal: number; donationCount: number; donors: number;
}

// --- 将来的にAPIから取得するデータ（グラフ用は一旦モックのまま） ---
const newUserGraphData = [
  { name: '月', '通常登録': 30, '紹介経由': 15 }, { name: '火', '通常登録': 45, '紹介経由': 25 },
  { name: '水', '通常登録': 60, '紹介経由': 40 }, { name: '木', '通常登録': 50, '紹介経由': 30 },
  { name: '金', '通常登録': 70, '紹介経由': 55 }, { name: '土', '通常登録': 90, '紹介経由': 70 },
  { name: '日', '通常登録': 85, '紹介経由': 65 },
];
const popularStoresData = [
    { rank: 1, name: 'レストラン那須', total: 450000 }, { rank: 2, name: 'なっぴーベーカリー', total: 425000 },
    { rank: 3, name: 'ビューティーサロン四季', total: 380000 },
];
const pendingTasksData = { newStores: 3, userQuests: 5, userInquiries: 2 };

const AdminDashboardPage: NextPage = () => {
  const [kpiData, setKpiData] = useState<KpiData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 本番環境では、ここでAPIを呼び出します
        // const response = await fetch('/api/admin/dashboard-data');
        // const data = await response.json();
        // setKpiData(data);
        
        // 現在は仮のデータを表示します
        setKpiData({
            totalUsers: 1234, userChange: 12, paidUsers: 1000, freeUsers: 234,
            totalStores: 152, storeChange: 5, restaurantCount: 80, beautyCount: 20, otherCount: 52,
            monthlyRevenue: 1234567, revenueChangePercent: 15,
            donationTotal: 123456, donationCount: 246, donors: 88,
        });

      } catch (error) {
        console.error("Failed to fetch KPI data", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <p className="text-xl">データを読み込んでいます...</p>
        </div>
    );
  }

  if (!kpiData) {
    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <p className="text-xl text-red-500">データの読み込みに失敗しました。</p>
        </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>運営ダッシュボード</title>
      </Head>
      <header className="bg-white shadow-sm p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">運営管理ダッシュボード</h1>
        <div>
          <Link href="/admin" className="text-sm text-blue-600 hover:underline mr-4">管理メニューへ戻る</Link>
          <span>運営者：山田 太郎</span>
          <button className="ml-4 text-sm text-gray-600 hover:underline">ログアウト</button>
        </div>
      </header>

      <main className="p-8">
        {/* KPIサマリー */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-gray-500 text-sm font-medium">総ユーザー数</h2>
            <p className="text-3xl font-bold mt-1">{kpiData.totalUsers.toLocaleString()} 人</p>
            <p className="text-green-500 text-sm mt-1">↑ 前日比 +{kpiData.userChange}人</p>
            <p className="text-xs text-gray-400 mt-2">有料: {kpiData.paidUsers} / 無料: {kpiData.freeUsers}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-gray-500 text-sm font-medium">総加盟店数</h2>
            <p className="text-3xl font-bold mt-1">{kpiData.totalStores.toLocaleString()} 店舗</p>
            <p className="text-green-500 text-sm mt-1">↑ 前週比 +{kpiData.storeChange}店舗</p>
            <p className="text-xs text-gray-400 mt-2">飲食: {kpiData.restaurantCount} / 美容: {kpiData.beautyCount} / 他: {kpiData.otherCount}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-gray-500 text-sm font-medium">今月のポイント流通総額</h2>
            <p className="text-3xl font-bold mt-1">¥ {kpiData.monthlyRevenue.toLocaleString()}</p>
            <p className="text-green-500 text-sm mt-1">↑ 先月同期間比 +{kpiData.revenueChangePercent}%</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border-t-4 border-pink-400">
            <h2 className="text-gray-500 text-sm font-medium">オンライン子ども食堂 支援総額</h2>
            <p className="text-3xl font-bold mt-1">¥ {kpiData.donationTotal.toLocaleString()}</p>
            <p className="text-gray-600 text-sm mt-1">{kpiData.donationCount}食分 / {kpiData.donors}人から</p>
          </div>
        </section>

        {/* 詳細分析 */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow">
            <h2 className="font-bold mb-4">新規ユーザー登録数の推移（今週）</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={newUserGraphData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="通常登録" fill="#8884d8" />
                <Bar dataKey="紹介経由" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
             <h2 className="font-bold mb-4">人気加盟店ランキング（今月）</h2>
             <div className="space-y-4">
                {popularStoresData.map(store => (
                    <div key={store.rank}>
                        <div className="flex justify-between text-sm">
                            <span>{store.rank}. {store.name}</span>
                            <span className="font-semibold">¥{store.total.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                            <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${(store.total / popularStoresData[0].total) * 100}%` }}></div>
                        </div>
                    </div>
                ))}
             </div>
          </div>
        </section>

        {/* 直近の活動と通知 */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow">
                <h2 className="font-bold mb-4">対応が必要な項目</h2>
                <div className="space-y-4">
                    <div className="flex justify-between items-center bg-yellow-100 p-3 rounded-md">
                        <div>
                            <p className="font-semibold">新規加盟店の承認待ち</p>
                            <p className="text-sm text-yellow-800">{pendingTasksData.newStores}件</p>
                        </div>
                        <Link href="/admin/manageStores?status=pending" className="text-sm bg-yellow-500 text-white py-1 px-3 rounded-full hover:bg-yellow-600">確認する</Link>
                    </div>
                    <div className="flex justify-between items-center bg-blue-100 p-3 rounded-md">
                        <div>
                            <p className="font-semibold">ユーザー作成クエストの承認待ち</p>
                            <p className="text-sm text-blue-800">{pendingTasksData.userQuests}件</p>
                        </div>
                         <Link href="/admin/manageQuests?status=pending" className="text-sm bg-blue-500 text-white py-1 px-3 rounded-full hover:bg-blue-600">確認する</Link>
                    </div>
                     <div className="flex justify-between items-center bg-gray-200 p-3 rounded-md">
                        <div>
                            <p className="font-semibold">ユーザーからの問い合わせ</p>
                            <p className="text-sm text-gray-800">{pendingTasksData.userInquiries}件</p>
                        </div>
                         <Link href="/admin/inquiries?status=new" className="text-sm bg-gray-600 text-white py-1 px-3 rounded-full hover:bg-gray-700">確認する</Link>
                    </div>
                </div>
            </div>
        </section>
      </main>
    </div>
  );
};

// --- 管理者専用の認証保護 ---
export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const cookies = nookies.get(context);
    const token = await getAdminAuth().verifySessionCookie(cookies.token, true);
    const userDoc = await getAdminDb().collection('users').doc(token.uid).get();

    if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
      return { redirect: { destination: '/admin/login', permanent: false } };
    }
    return { props: {} };
  } catch (error) {
    return { redirect: { destination: '/admin/login', permanent: false } };
  }
};

export default AdminDashboardPage;