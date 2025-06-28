'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';

export default function ExportPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [csvUrl, setCsvUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // 🔐 認証チェック
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

  const handleExport = async () => {
    setLoading(true);
    setCsvUrl('');
    try {
      const res = await fetch('/api/run-export');
      const data = await res.json();
      if (data && data.csvUrl) {
        setCsvUrl(data.csvUrl);
      } else {
        alert('出力に失敗しました');
      }
    } catch (err) {
      alert('エラーが発生しました');
    }
    setLoading(false);
  };

  if (loadingAuth) return <p className="p-6 text-gray-600">読み込み中...</p>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">CSV出力（紹介報酬集計）</h1>

      <button
        onClick={handleExport}
        disabled={loading}
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? '出力中...' : 'CSVを出力する'}
      </button>

      {csvUrl && (
        <p className="mt-4 text-green-600">
          ✅ 出力完了：{' '}
          <a href={csvUrl} target="_blank" rel="noopener noreferrer" className="underline">
            CSVをダウンロード
          </a>
        </p>
      )}
    </div>
  );
}
