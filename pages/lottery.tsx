import { NextPage } from 'next';
import Head from 'next/head';
import { useState, useEffect, useCallback } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import Link from 'next/link';

interface LotteryResult {
    name: string;
    value: number;
}

const LotteryPage: NextPage = () => {
    const [canPlay, setCanPlay] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [result, setResult] = useState<LotteryResult | null>(null);
    const [error, setError] = useState('');

    const checkCanPlay = useCallback(async () => {
        try {
            const response = await fetch('/api/user/get-mypage-data');
            const data = await response.json();
            if (data.lastLotteryPlayedAt) {
                const lastPlayedDate = new Date(data.lastLotteryPlayedAt._seconds * 1000);
                if ((new Date().getTime() - lastPlayedDate.getTime()) > 23 * 60 * 60 * 1000) {
                    setCanPlay(true);
                } else {
                    setCanPlay(false);
                }
            } else {
                setCanPlay(true);
            }
        } catch (e) {
            setError('情報の取得に失敗しました。');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        checkCanPlay();
    }, [checkCanPlay]);
    
    const handlePlay = async () => {
        setIsLoading(true);
        setResult(null);
        setError('');
        try {
            const functions = getFunctions();
            const playDailyLottery = httpsCallable(functions, 'playDailyLottery');
            const response: any = await playDailyLottery();
            if (response.data.success) {
                setResult(response.data.prize);
                setCanPlay(false); // プレイ後はボタンを無効化
            } else {
                throw new Error(response.data.error);
            }
        } catch (err: any) {
            setError(err.message || '福引に失敗しました。');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <Head><title>{"もしもボックス・チャレンジ"}</title></Head>
            <div className="w-full max-w-md text-center">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <h1 className="text-3xl font-bold mb-2">もしもボックス</h1>
                    <p className="text-gray-600 mb-8">1日1回、運試し！</p>
                    
                    {result ? (
                        <div>
                            <p className="text-lg">結果は...</p>
                            <p className="text-4xl font-black my-4 text-indigo-600">{result.name}</p>
                            {result.value > 0 && <p>おめでとうございます！</p>}
                        </div>
                    ) : (
                        <button onClick={handlePlay} disabled={isLoading || !canPlay} className="w-full bg-pink-500 text-white px-8 py-4 rounded-lg font-bold text-xl hover:bg-pink-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition">
                            {isLoading ? '抽選中...' : (canPlay ? 'チャレンジ！' : 'また明日！')}
                        </button>
                    )}

                    {error && <p className="text-red-500 mt-4">{error}</p>}
                </div>
                <div className="mt-6">
                    <Link href="/mypage" className="text-blue-600 hover:underline">マイページに戻る</Link>
                </div>
            </div>
        </div>
    );
};

export default LotteryPage;