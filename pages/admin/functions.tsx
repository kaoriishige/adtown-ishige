'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';

export default function FunctionsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [log, setLog] = useState('');
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

  const runFunction = async (endpoint: string, label: string) => {
    setLog(`🔄 ${label} を実行中...`);
    try {
      const res = await fetch(`/api/${endpoint}`);
      if (!res.ok) throw new Error('実行エラー');
      const data = await res.json();
      setLog(`✅ ${label} 完了：${JSON.stringify(data)}`);
    } catch (err) {
      setLog(`❌ ${label} 失敗`);
    }
  };

  if (loadingAuth) return <p className="p-6 text-gray-600">読み込み中...</p>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Cloud Functions 実行</h1>

      <div className="space-y-4">
        <button
          onClick={() => runFunction('run-summary', '紹介報酬集計')}
          className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
        >
          紹介報酬を集計する
        </button>

        <button
          onClick={() => runFunction('run-export', 'CSV出力')}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          CSVを出力する
        </button>
      </div>

      {log && <p className="mt-6 text-sm text-gray-700 whitespace-pre-line">{log}</p>}
    </div>
  );
}
