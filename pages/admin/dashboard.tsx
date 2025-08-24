import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { getAdminDb } from '../../lib/firebase-admin';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// --- 型定義 ---
interface DashboardData {
  totalUsers: number;
  totalPartners: number;
  monthlyRevenue: number;
  monthlyPayouts: number;
  topReferrers: { name: string; count: number }[];
  recentInquiries: { id: string; name: string; createdAt: string }[];
}

// ▼▼▼ 実際のデータを取得する関数に修正 ▼▼▼
async function fetchDashboardData(): Promise<DashboardData> {
  const db = getAdminDb();
  
  // ユーザー数とパートナー数を取得
  const usersSnapshot = await db.collection('users').get();
  const totalUsers = usersSnapshot.size;
  const totalPartners = usersSnapshot.docs.filter(doc => doc.data().role === 'partner').length;

  // 月間売上と支払い報酬額を取得 (今回は紹介報酬のデータから計算)
  // 実際の売上データはStripeのAPIなどから取得するのがより正確
  const referralRewardsSnapshot = await db.collection('referralRewards').get();
  let monthlyPayouts = 0;
  referralRewardsSnapshot.forEach(doc => {
    monthlyPayouts += doc.data().rewardAmount;
  });

  // トップ紹介者を取得
  const referrerCounts: { [key: string]: number } = {};
  referralRewardsSnapshot.forEach(doc => {
    const referrerUid = doc.data().referrerUid;
    if (referrerUid) {
      referrerCounts[referrerUid] = (referrerCounts[referrerUid] || 0) + 1;
    }
  });

  const topReferrers: { name: string; count: number }[] = [];
  const uids = Object.keys(referrerCounts).sort((a, b) => referrerCounts[b] - referrerCounts[a]).slice(0, 3);
  for (const uid of uids) {
    const userDoc = await db.collection('users').doc(uid).get();
    const userName = userDoc.exists ? (userDoc.data()?.storeName || '匿名') : '不明';
    topReferrers.push({ name: userName, count: referrerCounts[uid] });
  }

  // 最新の問い合わせを取得
  const inquiriesSnapshot = await db.collection('inquiries').orderBy('createdAt', 'desc').limit(5).get();
  const recentInquiries = inquiriesSnapshot.docs.map(doc => {
    const data = doc.data();
    const createdAt = data.createdAt.toDate().toLocaleDateString('ja-JP');
    return {
      id: doc.id,
      name: data.name,
      createdAt,
    };
  });

  return {
    totalUsers,
    totalPartners,
    monthlyRevenue: 0, // 仮の売上。Stripeなどから別途取得が必要
    monthlyPayouts,
    topReferrers,
    recentInquiries,
  };
}

const Dashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData().then(d => {
      setData(d);
      setLoading(false);
    });
  }, []);

  // ▼▼▼ 削除機能の追加 ▼▼▼
  const handleDeleteInquiry = async (inquiryId: string) => {
    if (window.confirm('この問い合わせを削除してもよろしいですか？')) {
      try {
        const response = await fetch('/api/admin/delete-inquiry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: inquiryId }),
        });

        if (response.ok) {
          // UIから削除
          setData(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              recentInquiries: prev.recentInquiries.filter(i => i.id !== inquiryId)
            };
          });
          alert('問い合わせを削除しました。');
        } else {
          alert('削除に失敗しました。');
        }
      } catch (error) {
        console.error('Failed to delete inquiry:', error);
        alert('削除中にエラーが発生しました。');
      }
    }
  };

  const chartData = {
    labels: data?.topReferrers.map(r => r.name) || [],
    datasets: [{
      label: '紹介成功数',
      data: data?.topReferrers.map(r => r.count) || [],
      backgroundColor: [
        'rgba(255, 99, 132, 0.5)',
        'rgba(54, 162, 235, 0.5)',
        'rgba(255, 206, 86, 0.5)',
      ],
      borderColor: [
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)',
      ],
      borderWidth: 1,
    }],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'トップ紹介パートナー',
      },
    },
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl font-semibold">データを読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="p-5 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link href="/admin" className="text-blue-500 hover:underline">
            ← 管理メニューに戻る
          </Link>
        </div>
        <h1 className="text-4xl font-extrabold mb-8 text-center text-gray-800">運営ダッシュボード</h1>
        
        {/* 主要なKPIカード */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
            <p className="text-sm text-gray-500 font-medium">総ユーザー数</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{data?.totalUsers}人</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
            <p className="text-sm text-gray-500 font-medium">総パートナー数</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{data?.totalPartners}社</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
            <p className="text-sm text-gray-500 font-medium">今月の売上（仮）</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">¥{data?.monthlyRevenue?.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
            <p className="text-sm text-gray-500 font-medium">今月の支払い報酬額</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">¥{data?.monthlyPayouts?.toLocaleString()}</p>
          </div>
        </div>

        {/* グラフとリスト */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">トップパートナー（紹介成功数）</h2>
            <Bar data={chartData} options={chartOptions} />
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">最近の問い合わせ</h2>
            <ul className="divide-y divide-gray-200">
              {data?.recentInquiries.map((inquiry) => (
                <li key={inquiry.id} className="py-4 flex justify-between items-center">
                  <div>
                    <p className="text-lg font-semibold text-gray-800">{inquiry.name}様</p>
                    <p className="text-sm text-gray-500">{inquiry.createdAt}</p>
                  </div>
                  {/* ▼▼▼ 削除ボタンを追加 ▼▼▼ */}
                  <button
                    onClick={() => handleDeleteInquiry(inquiry.id)}
                    className="text-red-500 hover:text-red-700 font-medium text-sm"
                  >
                    削除
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;