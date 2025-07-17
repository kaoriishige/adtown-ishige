'use client';

import { useEffect, useState } from 'react';
import { db } from '../../../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

type Reward = {
  id: string;
  month: string;
  userId: string;
  referralCount: number;
  totalAmount: number;
};

export default function AdminRewardsPage() {
  const [rewards, setRewards] = useState<Reward[]>([]);

  useEffect(() => {
    const fetchRewards = async () => {
      const snapshot = await getDocs(collection(db, 'referralSummaries'));
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Reward[];
      list.sort((a, b) => (a.month < b.month ? 1 : -1));
      setRewards(list);
    };
    fetchRewards();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-xl font-bold mb-4">紹介報酬（月別サマリー）</h1>

      {rewards.length === 0 ? (
        <p>報酬データがまだありません。</p>
      ) : (
        <table className="w-full border text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-2 py-1">月</th>
              <th className="border px-2 py-1">ユーザーID</th>
              <th className="border px-2 py-1">人数</th>
              <th className="border px-2 py-1">金額（円）</th>
            </tr>
          </thead>
          <tbody>
            {rewards.map((r) => (
              <tr key={r.id}>
                <td className="border px-2 py-1">{r.month}</td>
                <td className="border px-2 py-1">{r.userId}</td>
                <td className="border px-2 py-1 text-right">{r.referralCount}</td>
                <td className="border px-2 py-1 text-right">{r.totalAmount.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
