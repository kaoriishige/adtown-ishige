// pages/subscribe.tsx
'use client';

import Link from 'next/link';

export default function SubscribePage() {
  return (
    <div className="max-w-xl mx-auto p-6 text-center">
      <h1 className="text-2xl font-bold mb-4">プレミアムに登録</h1>
      <p className="mb-6 text-gray-700">
        7日間の無料お試し後、初月 ¥480、その後は月額 ¥980 のプランです。
      </p>
      <a
        href="https://buy.stripe.com/test_XXXXXXXXXXXXXXXXXX"
        target="_blank"
        rel="noopener noreferrer"
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded text-lg font-semibold"
      >
        プレミアムに登録する
      </a>

      <p className="text-xs text-gray-500 mt-6">
        ※ Stripe Checkoutを使用しています。登録後は自動的に課金開始されます。
      </p>

      <div className="mt-10">
        <Link href="/">
          <span className="text-blue-500 underline text-sm">← トップに戻る</span>
        </Link>
      </div>
    </div>
  );
}

