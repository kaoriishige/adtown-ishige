'use client';

import { useState } from 'react';

export default function AdminFunctionsPage() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const callFunction = async (endpoint: string, label: string) => {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch(`/api/${endpoint}`);
      const json = await res.json();
      if (res.ok) {
        setMessage(`✅ ${label} 実行完了`);
        if (json.url) {
          setMessage(prev => `${prev}\n📎 CSV: ${json.url}`);
        }
      } else {
        throw new Error(json.error || 'エラー');
      }
    } catch (err: any) {
      setMessage(`❌ ${label} 失敗：${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Cloud Functions 実行</h1>

      <div className="space-y-4">
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          disabled={loading}
          onClick={() =>
            callFunction('run-summary', '紹介報酬の月次集計')
          }
        >
          📊 紹介報酬を月次集計
        </button>

        <button
          className="bg-green-600 text-white px-4 py-2 rounded"
          disabled={loading}
          onClick={() =>
            callFunction('run-export', 'CSV出力')
          }
        >
          🧾 CSVを出力
        </button>
      </div>

      {message && (
        <pre className="mt-6 p-4 bg-gray-100 border rounded whitespace-pre-wrap">
          {message}
        </pre>
      )}
    </div>
  );
}
