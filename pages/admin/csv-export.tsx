// pages/admin/csv-export.tsx

import { useState } from 'react';
import Link from 'next/link';

const CsvExportPage = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleExport = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/export-users');
      if (!response.ok) {
        throw new Error('CSVの作成に失敗しました。');
    }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // ダウンロードするファイル名を指定
      a.download = `users-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : 'エラーが発生しました。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-5 max-w-xl mx-auto">
      <Link href="/admin" className="text-blue-500 hover:underline">← 管理メニューに戻る</Link>
      <h1 className="text-3xl font-bold my-6 text-center">CSV出力</h1>
      <div className="bg-white shadow-md rounded p-8 space-y-4">
        <p className="text-sm text-gray-600">各種データをCSV形式でダウンロードします。</p>
        <button 
          onClick={handleExport}
          disabled={isLoading}
          className="w-full bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400"
        >
          {isLoading ? '作成中...' : 'ユーザーリストをダウンロード'}
        </button>
      </div>
    </div>
  );
};

export default CsvExportPage;
