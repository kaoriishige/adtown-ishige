import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { RiArrowLeftLine, RiCameraFill, RiAlertLine } from 'react-icons/ri';

const PaymentPage: NextPage = () => {
  const [paymentAmount, setPaymentAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // QRコードリーダーを起動し、読み取ったデータを処理する関数
  const handleScan = async () => {
    // この部分は、実際のQRコードスキャナライブラリ（例: react-qr-reader）
    // と連携する必要があります。
    // ここでは、スキャンが成功したと仮定したダミーの処理を実装します。
    
    const amount = parseInt(paymentAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      setError("正しい金額を入力してください。");
      return;
    }

    // ダミーの店舗ID
    const scannedStoreId = 'store_dummy_12345'; 

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/payment/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: scannedStoreId,
          amount: amount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '支払いに失敗しました。');
      }

      setSuccess(`支払いが完了しました！ (${amount.toLocaleString()} pt)`);
      setPaymentAmount(''); // 金額入力フィールドをクリア

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Head>
        <title>ポイントで支払う</title>
      </Head>

      {/* --- ヘッダー --- */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto p-4 flex items-center">
          <Link href="/mypage" className="text-gray-600 hover:text-gray-900">
            <RiArrowLeftLine size={24} />
          </Link>
          <h1 className="text-xl font-bold text-gray-800 mx-auto">
            ポイントで支払う
          </h1>
        </div>
      </header>

      {/* --- メインコンテンツ --- */}
      <main className="max-w-lg mx-auto p-4 w-full flex-grow flex flex-col justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center">
          
          <h2 className="text-lg font-semibold text-gray-700 mb-4">支払い金額を入力</h2>
          
          <div className="relative mb-6">
            <input
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder="例: 1500"
              className="w-full text-5xl font-bold text-center p-4 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-400">pt</span>
          </div>

          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-md text-left flex items-center">
              <RiAlertLine className="mr-3" />
              <span>{error}</span>
            </div>
          )}

           {success && (
            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded-md text-left">
              <p>{success}</p>
            </div>
          )}

          <button
            onClick={handleScan}
            disabled={isLoading || !paymentAmount}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold py-5 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:transform-none disabled:shadow-md"
          >
            <div className="flex items-center justify-center text-xl">
              <RiCameraFill className="mr-3" />
              <span>{isLoading ? '処理中...' : 'お店のQRコードをスキャン'}</span>
            </div>
          </button>
          
          <p className="text-xs text-gray-500 mt-4">
            お店のレジでQRコードを提示されたら、このボタンを押してスキャンしてください。
          </p>
        </div>
      </main>
    </div>
  );
};

export default PaymentPage;