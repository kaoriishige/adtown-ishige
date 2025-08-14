import { useEffect, useState } from 'react';
import { NextPage } from 'next';
import Link from 'next/link';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { app } from '../../lib/firebase'; // FirebaseクライアントSDKの初期化に合わせてパスを調整

// --- 型定義 ---
interface Reward {
  id: string;
  referrerName: string;
  referrerEmail: string;
  referrerRole: string;
  referredName: string;
  rewardAmount: number;
  rewardStatus: '支払い済み' | '未払い';
  createdAt: string; // ISO形式の文字列を期待
}

interface UserInfo {
  name: string;
  email: string;
  role: string;
}

// 月次サマリー用の型
interface MonthlySummary {
  month: string; // "YYYY-MM"形式
  partnerTotal: number;
  generalTotal: number;
  totalAmount: number;
}

// --- ページコンポーネント ---
const ReferralRewardsPage: NextPage = () => {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // 'summary' または 'details' を管理
  const [view, setView] = useState<'summary' | 'details'>('summary'); 
  // 詳細表示する月 ("YYYY-MM") を管理
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null); 

  useEffect(() => {
    const fetchRewards = async () => {
      try {
        setLoading(true);
        const db = getFirestore(app);

        const usersSnapshot = await getDocs(collection(db, 'users'));
        const usersMap = new Map<string, UserInfo>();
        usersSnapshot.forEach(doc => {
          const data = doc.data();
          usersMap.set(doc.id, {
            name: data.partnerInfo?.storeName || data.name || 'N/A',
            email: data.email || 'N/A',
            role: data.role || 'general',
          });
        });

        const rewardsSnapshot = await getDocs(collection(db, 'referralRewards'));
        const rewardsData: Reward[] = rewardsSnapshot.docs.map(doc => {
          const data = doc.data();
          const referrerInfo = usersMap.get(data.referrerUid) || { name: '不明', email: '不明', role: 'general' };
          const referredInfo = usersMap.get(data.referredUid) || { name: '不明', email: '不明', role: 'general' };
          return {
            id: doc.id,
            referrerName: referrerInfo.name,
            referrerEmail: referrerInfo.email,
            referrerRole: referrerInfo.role,
            referredName: referredInfo.name,
            rewardAmount: data.rewardAmount || 0,
            rewardStatus: data.rewardStatus === 'paid' ? '支払い済み' : '未払い',
            createdAt: data.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
          };
        });

        setRewards(rewardsData);

        // 月次サマリーを作成
        const summary = rewardsData.reduce((acc, reward) => {
          const month = reward.createdAt.substring(0, 7); // "YYYY-MM"
          if (!acc[month]) {
            acc[month] = { month, partnerTotal: 0, generalTotal: 0, totalAmount: 0 };
          }
          if (reward.referrerRole === 'partner') {
            acc[month].partnerTotal += reward.rewardAmount;
          } else {
            acc[month].generalTotal += reward.rewardAmount;
          }
          acc[month].totalAmount += reward.rewardAmount;
          return acc;
        }, {} as Record<string, MonthlySummary>);
        
        const summaryArray = Object.values(summary).sort((a, b) => b.month.localeCompare(a.month));
        setMonthlySummary(summaryArray);

      } catch (err) {
        console.error("Error fetching referral rewards:", err);
        setError("報酬履歴の取得に失敗しました。");
      } finally {
        setLoading(false);
      }
    };

    fetchRewards();
  }, []);

  // 詳細表示に切り替える関数
  const handleViewDetails = (month: string) => {
    setSelectedMonth(month);
    setView('details');
  };

  // サマリー表示に戻る関数
  const handleViewSummary = () => {
    setSelectedMonth(null);
    setView('summary');
  };

  // 詳細表示用のフィルタリングされた報酬リスト
  const detailedRewards = selectedMonth
    ? rewards.filter(r => r.createdAt.startsWith(selectedMonth))
    : [];

  return (
    <div className="container mx-auto p-4 bg-gray-50 min-h-screen">
      <Link href="/admin" className="text-blue-600 hover:underline">
        &larr; 管理メニューに戻る
      </Link>
      <h1 className="text-3xl font-bold my-6 text-gray-800">紹介報酬管理</h1>

      {loading && <p>読み込み中...</p>}
      {error && <p className="text-red-500 bg-red-100 p-3 rounded-md">{error}</p>}

      {!loading && !error && (
        <>
          {/* --- 月次サマリー表示 --- */}
          {view === 'summary' && (
            <div className="overflow-x-auto bg-white rounded-lg shadow">
              <table className="min-w-full border-collapse">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-600">月</th>
                    <th className="py-3 px-4 border-b text-right text-sm font-semibold text-gray-600">企業・店舗 合計</th>
                    <th className="py-3 px-4 border-b text-right text-sm font-semibold text-gray-600">一般 合計</th>
                    <th className="py-3 px-4 border-b text-right text-sm font-semibold text-gray-600">総合計</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlySummary.map(summary => (
                    <tr key={summary.month} onClick={() => handleViewDetails(summary.month)} className="hover:bg-blue-50 cursor-pointer">
                      <td className="py-3 px-4 border-b text-sm font-medium text-blue-700">{summary.month.replace('-', '年')}月</td>
                      <td className="py-3 px-4 border-b text-sm text-gray-700 text-right">{summary.partnerTotal.toLocaleString()} 円</td>
                      <td className="py-3 px-4 border-b text-sm text-gray-700 text-right">{summary.generalTotal.toLocaleString()} 円</td>
                      <td className="py-3 px-4 border-b text-sm text-gray-900 font-bold text-right">{summary.totalAmount.toLocaleString()} 円</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* --- 詳細表示 --- */}
          {view === 'details' && selectedMonth && (
            <div>
              <button onClick={handleViewSummary} className="mb-4 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition">
                &larr; 月次サマリーに戻る
              </button>
              <h2 className="text-2xl font-bold mb-4">{selectedMonth.replace('-', '年')}月 の明細</h2>
              <div className="overflow-x-auto bg-white rounded-lg shadow">
                <table className="min-w-full border-collapse">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-600">発生日時</th>
                      <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-600">紹介者</th>
                      <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-600">種別</th>
                      <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-600">被紹介者</th>
                      <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-600">報酬額</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailedRewards.map(reward => (
                       <tr key={reward.id} className="hover:bg-gray-50">
                         <td className="py-3 px-4 border-b text-sm text-gray-700">{new Date(reward.createdAt).toLocaleString('ja-JP')}</td>
                         <td className="py-3 px-4 border-b text-sm text-gray-700">{reward.referrerName}</td>
                         <td className="py-3 px-4 border-b text-sm text-center">
                           {reward.referrerRole === 'partner' ? (
                             <span className="bg-green-200 text-green-800 font-semibold py-1 px-3 rounded-full text-xs">企業・店舗</span>
                           ) : (
                             <span className="bg-blue-200 text-blue-800 font-semibold py-1 px-3 rounded-full text-xs">一般</span>
                           )}
                         </td>
                         <td className="py-3 px-4 border-b text-sm text-gray-700">{reward.referredName}</td>
                         <td className="py-3 px-4 border-b text-sm text-gray-700">{reward.rewardAmount.toLocaleString()} 円</td>
                       </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ReferralRewardsPage;
