import { useState } from 'react';
import Link from 'next/link';

const ManualFunctionsPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleRunTask = async () => {
    // 確認ダイアログを表示
    const isConfirmed = window.confirm(
      '本当に先月分の紹介報酬を再計算しますか？\nこの処理は時間がかかり、既存のデータに影響を与える可能性があります。'
    );

    if (!isConfirmed) {
      return; // キャンセルされたら何もしない
    }

    setIsLoading(true);
    setMessage('');
    try {
      const response = await fetch('/api/manual/recalculate-rewards', {
        method: 'POST',
      });
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '処理の実行に失敗しました。');
      }

      setMessage(data.message || '処理は正常に開始されました。');

    } catch (error) {
      console.error(error);
      setMessage(error instanceof Error ? error.message : 'エラーが発生しました。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-5 max-w-xl mx-auto">
      <Link href="/admin" className="text-blue-500 hover:underline">← 管理メニューに戻る</Link>
      <h1 className="text-3xl font-bold my-6 text-center">関数手動実行</h1>
      <div className="bg-white shadow-md rounded p-8 space-y-4">
        <p className="text-sm text-gray-600">時間のかかる処理や、定期実行される処理をここから手動でトリガーします。操作には十分ご注意ください。</p>
        
        {/* メッセージ表示エリア */}
        {message && (
          <div className={`p-4 rounded text-center ${message.includes('失敗') || message.includes('エラー') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message}
          </div>
        )}

        <button 
          onClick={handleRunTask}
          disabled={isLoading}
          className="w-full bg-red-600 hover:bg-red-800 text-white font-bold py-3 px-4 rounded transition-colors disabled:bg-gray-400"
        >
          {isLoading ? '実行中...' : '先月分の紹介報酬を再計算する'}
        </button>
      </div>
    </div>
  );
};

export default ManualFunctionsPage;



