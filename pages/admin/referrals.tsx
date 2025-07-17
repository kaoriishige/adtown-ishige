// pages/admin/referrals.tsx
import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../lib/firebase";

type ReferralLog = {
  id: string;
  userName: string;
  appName: string;
  createdAt: string;
  reward: number;
  status: string;
};

export default function ReferralManagementPage() {
  const [logs, setLogs] = useState<ReferralLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const q = query(collection(db, "referralLogs"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const results = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            userName: data.userName || "不明",
            appName: data.appName || "不明",
            createdAt: data.createdAt?.toDate().toLocaleString() || "未設定",
            reward: data.reward || 0,
            status: data.status || "未処理",
          };
        });
        setLogs(results);
      } catch (error) {
        console.error("紹介履歴の取得に失敗しました:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">紹介報酬管理</h1>

      {loading ? (
        <p>読み込み中...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border">ユーザー名</th>
                <th className="py-2 px-4 border">アプリ名</th>
                <th className="py-2 px-4 border">紹介日</th>
                <th className="py-2 px-4 border">報酬 (pt)</th>
                <th className="py-2 px-4 border">ステータス</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="text-center">
                  <td className="py-2 px-4 border">{log.userName}</td>
                  <td className="py-2 px-4 border">{log.appName}</td>
                  <td className="py-2 px-4 border">{log.createdAt}</td>
                  <td className="py-2 px-4 border">{log.reward}</td>
                  <td className="py-2 px-4 border">{log.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
