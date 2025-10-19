import { NextPage } from 'next';
import Head from 'next/head';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import React from 'react'; // Reactをインポート

// QrScanner を dynamic import で SSR 無効化
const QrScanner: any = dynamic(() => import('react-qr-scanner'), { ssr: false });

const PaymentPage: NextPage = () => {
  const [storeId, setStoreId] = useState<string | null>(null);
  const [storeName, setStoreName] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // ▼▼▼ 修正箇所 ▼▼▼
  // handleScanの引数の型を修正し、処理を簡潔にしました
  const handleScan = async (scannedData: string | null) => {
    if (scannedData) {
      setStoreId(scannedData);

      try {
        const res = await fetch(`/api/stores/${scannedData}`);
        if (!res.ok) throw new Error('店舗情報の取得に失敗しました。');
        const data = await res.json();
        setStoreName(data.storeName);
      } catch (e: any) {
        setPaymentStatus('error');
        setErrorMessage(e.message || '無効なQRコードです。');
        setStoreId(null); // エラー時にスキャン状態に戻す
      }
    }
  };
  // ▲▲▲ 修正ここまで ▲▲▲

  const handleError = (err: any) => {
    console.error(err);
    setPaymentStatus('error');
    setErrorMessage(
      'カメラの読み込みに失敗しました。ページの再読み込みや、カメラのアクセス許可を確認してください。'
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setPaymentStatus('idle');
    setErrorMessage('');

    try {
      const response = await fetch('/api/payment/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId, amount: Number(amount) }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '決済に失敗しました。');
      }
      setPaymentStatus('success');
    } catch (err: any) {
      setPaymentStatus('error');
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (paymentStatus === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center p-4">
        <h1 className="text-3xl font-bold text-green-600 mb-4">支払い完了</h1>
        <p className="text-lg">
          {storeName}への {Number(amount).toLocaleString()} ポイントの支払いが完了しました。
        </p>
        <Link
          href="/mypage"
          className="mt-8 inline-block bg-blue-600 text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-blue-700 transition"
        >
          マイページへ戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>{"ポイントで支払う"}</title>
      </Head>
      <div className="max-w-md mx-auto p-4 pt-10">
        <h1 className="text-3xl font-bold text-center mb-6">ポイントで支払う</h1>

        {!storeId ? (
          <div>
            <p className="text-center text-gray-600 mb-4">お店のQRコードをスキャンしてください</p>
            <div className="border-4 border-gray-300 rounded-lg overflow-hidden w-full">
              {/* ▼▼▼ 修正箇所 ▼▼▼ */}
              {/* QrScannerのpropsを調整しました */}
              <QrScanner
                onScan={handleScan}
                onError={handleError}
                style={ width: '100%' }
                constraints={{
                  audio: false,
                  video: { facingMode: 'environment' },
                }}
              />
              {/* ▲▲▲ 修正ここまで ▲▲▲ */}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">支払い先</label>
              <p className="text-2xl font-bold">{storeName || '店舗情報を読込中...'}</p>
            </div>
            <div className="mb-6">
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                支払いポイント数
              </label>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-3 px-4 text-2xl"
                placeholder="例: 1000"
                required
                min="1"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !amount || !storeName}
              className="w-full py-3 text-lg font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
            >
              {isLoading ? '処理中...' : `${Number(amount).toLocaleString()} P 支払う`}
            </button>
          </form>
        )}

        {paymentStatus === 'error' && (
          <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-md text-center">
            <p>{errorMessage}</p>
          </div>
        )}
        <div className="text-center mt-8">
          <Link href="/mypage" className="text-blue-600 hover:underline">
            マイページへ戻る
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
