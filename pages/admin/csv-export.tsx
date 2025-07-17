import Link from 'next/link';

const CsvExportPage = () => {
  const handleExport = (dataType: string) => {
    alert(`${dataType}のCSV出力機能は現在準備中です。`);
  };

  return (
    <div className="p-5 max-w-xl mx-auto">
      <Link href="/admin" className="text-blue-500 hover:underline">← 管理メニューに戻る</Link>
      <h1 className="text-3xl font-bold my-6 text-center">CSV出力</h1>
      <div className="bg-white shadow-md rounded p-8 space-y-4">
        <p className="text-sm text-gray-600">各種データをCSV形式でダウンロードします。</p>
        <button 
          onClick={() => handleExport('ユーザーリスト')}
          className="w-full bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
        >
          ユーザーリストをダウンロード
        </button>
      </div>
    </div>
  );
};

export default CsvExportPage;