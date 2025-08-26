import { useEffect, useState } from 'react';
import { NextPage, GetServerSideProps } from 'next'; // ★ GetServerSidePropsを追加
import Link from 'next/link';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar } from 'react-chartjs-2';
// ★★★ 認証チェック用のモジュールを追加 ★★★
import nookies from 'nookies';
import { getAdminAuth, getAdminDb } from '../../lib/firebase-admin'; // パスは環境に合わせて修正

ChartJS.register( CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement );

// --- 型定義 ---
interface DashboardData {
  totalUsers: number;
  totalPartners: number;
  monthlyRevenue: number;
  monthlyPayouts: number;
  topReferrers: { name: string; count: number }[];
  recentInquiries: { id: string; name: string; createdAt: string }[];
}

// ... fetchDashboardData 関数は変更なし ...

const Dashboard: NextPage = () => { // ★ propsを受け取らないので型定義を削除
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ... useEffectの中身は変更なし ...
  }, []);
  
  // ... handleDeleteInquiry, chartData, chartOptions は変更なし ...
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl font-semibold">データを読み込み中...</div>
      </div>
    );
  }

  // ... return (...) で返されるJSXの見た目は変更なし ...
  return (
    <div className="p-5 bg-gray-100 min-h-screen">
      {/* ... ページの表示内容は変更なし ... */}
    </div>
  );
};

// ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
// ★★★ この関数を追加して、管理者専用の認証保護をかけます ★★★
// ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const cookies = nookies.get(context);
    const token = await getAdminAuth().verifySessionCookie(cookies.token, true);
    const userDoc = await getAdminDb().collection('users').doc(token.uid).get();

    // 役割が 'admin' でないユーザーはアクセスを拒否
    if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
      return { redirect: { destination: '/', permanent: false } };
    }

    // 管理者であればページを表示
    return { props: {} };

  } catch (error) {
    // 未ログインのユーザーもアクセスを拒否
    return { redirect: { destination: '/', permanent: false } };
  }
};

export default Dashboard;