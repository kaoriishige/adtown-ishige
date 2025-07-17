import Link from 'next/link';

const ManualFunctionsPage = () => {
  const handleRunTask = (taskName: string) => {
    alert(`${taskName} の実行機能は現在準備中です。`);
  };

  return (
    <div className="p-5 max-w-xl mx-auto">
      <Link href="/admin" className="text-blue-500 hover:underline">← 管理メニューに戻る</Link>
      <h1 className="text-3xl font-bold my-6 text-center">関数手動実行</h1>
      <div className="bg-white shadow-md rounded p-8 space-y-4">
        <p className="text-sm text-gray-600">時間のかかる処理や、定期実行される処理をここから手動でトリガーします。</p>
        <button 
          onClick={() => handleRunTask('紹介報酬の月次集計')}
          className="w-full bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
        >
          紹介報酬の月次集計を実行
        </button>
      </div>
    </div>
  );
};

export default ManualFunctionsPage;


