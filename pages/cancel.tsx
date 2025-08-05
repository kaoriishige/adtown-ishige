// pages/mypage/cancel.tsx
import { useState } from 'react';
import Link from 'next/link';
// ★修正点: インポートのパスを、より確実な絶対パスの書き方に変更します
import { useAuth } from '@/contexts/AuthContext'; // ログイン状態を取得
import { useRouter } from 'next/router';

export default function CancelSubscriptionPage() {
  const { user } = useAuth(); // ユーザー情報を取得
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCancelled, setIsCancelled] = useState(false);

  // 解約処理を実行する関数
  const handleCancelSubscription = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // サーバーサイドのAPIを呼び出して、Stripeのサブスクリプションを解約
      const response = await fetch('/api/cancel-subscription', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '解約処理に失敗しました。');
      }
      
      // 解約成功時の処理
      setIsCancelled(true);

    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました。');
    } finally {
      setIsLoading(false);
    }
  };

  // 解約成功後の画面
  if (isCancelled) {
    return (
      <div className="p-6 max-w-md mx-auto my-10 text-center bg-white shadow-md rounded-lg">
        <h1 className="text-2xl font-bold mb-4 text-green-600">解約手続きが完了しました</h1>
        <p className="text-gray-700 mb-6">ご利用ありがとうございました。またのご利用を心よりお待ちしております。</p>
        <Link href="/mypage" className="text-blue-500 hover:underline">
          マイページに戻る
        </Link>
      </div>
    );
  }

  // 解約確認画面
  return (
    <div className="p-6 max-w-md mx-auto my-10 text-center bg-white shadow-md rounded-lg">
      <h1 className="text-2xl font-bold mb-4 text-red-600">サブスクリプションの解約</h1>
      <p className="text-gray-700 mb-6">
        本当に解約しますか？<br/>
        解約手続きを行うと、現在の請求期間の終了日をもってサービスが停止され、それ以降の請求は発生しません。
      </p>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div className="flex justify-center space-x-4">
        <Link href="/mypage" className="px-6 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300">
          キャンセル
        </Link>
        <button
          onClick={handleCancelSubscription}
          disabled={isLoading}
          className="px-6 py-2 rounded bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-400"
        >
          {isLoading ? '処理中...' : '解約手続きを進める'}
        </button>
      </div>
    </div>
  );
}