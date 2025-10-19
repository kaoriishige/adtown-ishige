import Image from 'next/image';import { NextPage } 
from 'next';
import Head from 'next/head';
import { useState, useEffect, useCallback } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import Link from 'next/link';
import { RiArrowLeftLine } from 'react-icons/ri';

// 型定義
interface Fruit {
  id: string;
  amount: number;
  createdAt: any; // Timestamp
}
interface TreeState {
    level: number;
    exp: number;
    expToNextLevel: number;
    fruits: Fruit[];
    lastWatered: any; // Timestamp
}

const TreePage: NextPage = () => {
    const [tree, setTree] = useState<TreeState | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [canWater, setCanWater] = useState(false);

    const fetchTreeData = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/user/get-mypage-data');
            if (!response.ok) throw new Error('データの読み込みに失敗しました。');
            const data = await response.json();
            setTree(data.tree);

            // 水やり可能かどうかの判定
            if (data.tree.lastWatered) {
                const lastWateredDate = new Date(data.tree.lastWatered._seconds * 1000);
                // 23時間以上経過しているかチェック
                if ((new Date().getTime() - lastWateredDate.getTime()) > 23 * 60 * 60 * 1000) {
                    setCanWater(true);
                } else {
                    setCanWater(false);
                }
            } else {
                setCanWater(true); // まだ一度も水をやっていない場合
            }

        } catch (error: any) {
            setMessage(error.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTreeData();
    }, [fetchTreeData]);

    const handleInteraction = async (interactionType: 'water' | 'harvest', fruitId?: string) => {
        setIsLoading(true);
        setMessage('');
        try {
            const functions = getFunctions();
            const interactWithTree = httpsCallable(functions, 'interactWithTree');
            const result: any = await interactWithTree({ interactionType, fruitId });
            
            if (result.data.success) {
                setMessage(result.data.message);
                await fetchTreeData(); // 最新の木の状態に更新
            } else {
                throw new Error(result.data.error || 'エラーが発生しました。');
            }
        } catch (error: any) {
            setMessage(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (!tree) {
        return <div className="p-8 text-center">読み込み中...</div>;
    }
    
    const expPercentage = (tree.exp / tree.expToNextLevel) * 100;

    return (
        <div className="min-h-screen bg-green-50">
            <Head><title>{"なっぴーのなる木"}</title></Head>
            <div className="max-w-md mx-auto p-4 pt-6">
                <Link href="/mypage" className="mb-4 inline-flex items-center text-gray-600 hover:text-gray-900 font-bold">
                    <RiArrowLeftLine className="mr-2" />
                    マイページに戻る
                </Link>

                <div className="bg-white rounded-2xl shadow-xl p-6 text-center mt-4">
                    <h1 className="text-3xl font-bold text-green-800">なっぴーのなる木</h1>
                    
                    <div className="my-6">
                        {/* 木のレベルに応じて画像を変更する（仮） */}
                        <Image 
  src="/images/some-image.png" 
  alt="説明" 
  width={500} 
  height={300}
  className="..." 
/>
                        <p className="font-bold text-2xl mt-4">Level {tree.level}</p>
                    </div>
                    
                    <div>
                        <p className="text-sm font-bold text-gray-600">次のレベルまで</p>
                        <div className="w-full bg-gray-200 rounded-full h-4 mt-1">
                            <div className="bg-yellow-400 h-4 rounded-full transition-all duration-500" style={{ width: `${expPercentage}%` }}></div>
                        </div>
                        <p className="text-sm mt-1 text-gray-500">{tree.exp} / {tree.expToNextLevel} EXP</p>
                    </div>
                    
                    <div className="mt-6">
                        <button onClick={() => handleInteraction('water')} disabled={isLoading || !canWater} className="w-full bg-blue-500 text-white px-6 py-3 rounded-lg font-bold text-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition">
                            {canWater ? '水をやる (1日1回)' : 'また明日！'}
                        </button>
                    </div>
                </div>

                {tree.fruits.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-xl p-6 text-center mt-6">
                        <h2 className="text-xl font-bold text-yellow-600 mb-4">実った果実を収穫しよう！</h2>
                        <div className="flex flex-wrap justify-center gap-2">
                            {tree.fruits.map(fruit => (
                                <button key={fruit.id} onClick={() => handleInteraction('harvest', fruit.id)} disabled={isLoading} className="bg-red-500 text-white px-4 py-2 rounded-full font-bold hover:bg-red-600 disabled:bg-gray-400 transition">
                                    {fruit.amount}P 収穫🍓
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                
                {message && <p className="mt-4 font-bold text-center text-indigo-700">{message}</p>}
            </div>
        </div>
    );
};

export default TreePage;