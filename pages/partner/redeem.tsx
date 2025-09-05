import { NextPage } from 'next';
import Head from 'next/head';
import { useState } from 'react';
import QrScanner from 'react-qr-scanner';
import Link from 'next/link';
// ▼▼▼【修正点】アイコン名を RiCheckboxCircleLine に修正 ▼▼▼
import { RiCheckboxCircleLine, RiCloseCircleLine } from 'react-icons/ri';

const RedeemPage: NextPage = () => {
    const [scanResult, setScanResult] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleScan = async (result: any) => {
        if (result && !isLoading) {
            setIsLoading(true);
            setStatus('idle');
            setMessage('QRコードを検証中...');
            
            try {
                const scannedData = JSON.parse(result.text);
                const { userId, purchasedDealId } = scannedData;

                if (!userId || !purchasedDealId) {
                    throw new Error('無効なQRコードです。');
                }
                
                const response = await fetch('/api/deals/redeem', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, purchasedDealId }),
                });

                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.error || 'チケットの交換に失敗しました。');
                }
                
                setStatus('success');
                setMessage('チケットの交換が完了しました。');

            } catch (err: any) {
                setStatus('error');
                setMessage(err.message || 'エラーが発生しました。');
            } finally {
                setIsLoading(false);
            }
        }
    };
  
    const handleError = (err: any) => {
        console.error(err);
        setStatus('error');
        setMessage('カメラの読み込みに失敗しました。ページの再読み込みや、カメラのアクセス許可を確認してください。');
    }

    const resetScanner = () => {
        setStatus('idle');
        setMessage('');
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Head>
                <title>チケットを交換する</title>
            </Head>
            <div className="max-w-md mx-auto p-4 pt-10">
                <h1 className="text-3xl font-bold text-center mb-6">チケットを交換する</h1>

                {status === 'idle' && (
                    <div>
                        <p className="text-center text-gray-600 mb-4">お客様の提示したQRコードをスキャンしてください</p>
                        <div className="border-4 border-gray-300 rounded-lg overflow-hidden">
                            <QrScanner
                                delay={500}
                                onError={handleError}
                                onScan={handleScan}
                                style={{ width: '100%' }}
                            />
                        </div>
                        {isLoading && <p className="text-center mt-4">{message}</p>}
                    </div>
                )}

                {status === 'success' && (
                    <div className="text-center p-8 bg-white rounded-lg shadow-md">
                        {/* ▼▼▼【修正点】アイコン名を RiCheckboxCircleLine に修正 ▼▼▼ */}
                        <RiCheckboxCircleLine size={64} className="text-green-500 mx-auto mb-4" />
                        <p className="text-2xl font-bold text-green-600">{message}</p>
                        <button onClick={resetScanner} className="mt-6 bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700">
                            次のチケットをスキャン
                        </button>
                    </div>
                )}
                
                {status === 'error' && (
                    <div className="text-center p-8 bg-white rounded-lg shadow-md">
                        <RiCloseCircleLine size={64} className="text-red-500 mx-auto mb-4" />
                        <p className="text-xl font-bold text-red-600">{message}</p>
                        <button onClick={resetScanner} className="mt-6 bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700">
                            再試行
                        </button>
                    </div>
                )}

                 <div className="text-center mt-8">
                    <Link href="/partner/dashboard" className="text-blue-600 hover:underline">
                        パートナーダッシュボードへ戻る
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default RedeemPage;