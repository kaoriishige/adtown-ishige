'use client';

import { useState } from 'react';

export default function SubscribePage() {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const res = await fetch('/.netlify/functions/create-checkout-session', {
        method: 'POST',
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Checkoutセッション作成に失敗しました');
      }
    } catch (error) {
      console.error('エラー:', error);
      alert('通信エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto text-center">
      <h1 className="text-2xl font-bold mb-4">サブスクリプション登録</h1>
      <p className="mb-6">7日間の無料トライアル後、月額¥980で継続課金されます。</p>
      <button
        onClick={handleSubscribe}
        disabled={loading}
        className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 font-semibold"
      >
        {loading ? '読み込み中...' : '登録してはじめる'}
      </button>
    </div>
  );
}


