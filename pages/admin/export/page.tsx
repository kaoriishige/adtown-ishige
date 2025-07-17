'use client';

import { useState } from 'react';

export default function ExportPage() {
  const [loading, setLoading] = useState(false);
  const [csvUrl, setCsvUrl] = useState('');

  const handleExport = async () => {
    setLoading(true);
    setCsvUrl('');
    try {
      const res = await fetch('/api/run-export');
      const json = await res.json();
      setCsvUrl(json.url); // 生成されたCSVファイルの公開URL
    } catch (err) {
      alert('CSV出力に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-xl font-bold mb-4">紹介報酬CSV出力</h1>

      <button
        onClick={handleExport}
        disabled={loading}
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
      >
        {loading ? '出力中...' : '今月のCSVを生成'}
      </button>

      {csvUrl && (
        <div className="mt-4">
          <p className="mb-1">✅ CSVファイルが生成されました：</p>
          <a
            href={csvUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            ダウンロードはこちら
          </a>
        </div>
      )}
    </div>
  );
}
