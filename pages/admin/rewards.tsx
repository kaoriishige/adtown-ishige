'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function RewardsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [rewards, setRewards] = useState<Record<string, { referralCount: number; rewardAmount: number }>>({});
  const [month, setMonth] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
      } else {
        router.push('/login');
      }
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    setMonth(ym);
  }, []);

  useEffect(() => {
    const fetchSummary = async () => {
      if (!month) return;
      const docRef = doc(db, 'summaries', month);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setRewards(snap.data() as any);
      }
    };
    if (user && month) fetchSummary();
  }, [user, month]);

  if (loadingAuth) return <p className="p-6 text-gray-600">読み込み中...</p>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">紹介報酬集計（{month}）</h1>

      {Object.keys(rewards).length === 0 ? (
        <p className="text-gray-600">データがありません</p>
      ) : (
        <table className="w-full border text-sm">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="border px-3 py-2">メールアドレス</th>
              <th className="border px-3 py-2">紹介人数</th>
              <th className="border px-3 py-2">報酬金額（円）</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(rewards).map(([email, data]) => (
              <tr key={email}>
                <td className="border px-3 py-2">{email}</td>
                <td className="border px-3 py-2">{data.referralCount}</td>
                <td className="border px-3 py-2">{data.rewardAmount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
