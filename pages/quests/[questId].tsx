import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { RiArrowLeftLine, RiTrophyFill, RiMapPinLine, RiCloseLine, RiCheckLine, RiTimerLine } from 'react-icons/ri';

// --- データ用の型定義 ---
interface Quest {
    id: string;
    title: string;
    description: string;
    rewardPoints: number;
    locationName: string;
    latitude: number;
    longitude: number;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    timeLimitMinutes: number;
}

const QuestDetailPage: NextPage = () => {
    const router = useRouter();
    const { questId } = router.query;
    const [quest, setQuest] = useState<Quest | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCheckingIn, setIsCheckingIn] = useState(false);

    useEffect(() => {
        const fetchQuest = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // 本番では questId に基づいたデータをFirestore/APIから取得
                // const response = await fetch(`/api/quests/${questId}`);
                // const data = await response.json();
                // setQuest(data);

                // --- 現在は仮のデータを表示します ---
                const mockQuest: Quest = {
                    id: questId as string || 'q1',
                    title: '那須のチーズ工房を探せ！',
                    description: '那須街道沿いにある、手作りチーズが有名な工房を見つけ出し、QRコードをスキャンしよう。',
                    rewardPoints: 500,
                    locationName: '那須のチーズ工房',
                    latitude: 37.0305,
                    longitude: 139.9880,
                    difficulty: 'Medium',
                    timeLimitMinutes: 60,
                };
                setQuest(mockQuest);

            } catch (error) {
                console.error("Failed to fetch quest details", error);
                setError('クエスト情報の読み込みに失敗しました。');
            } finally {
                setIsLoading(false);
            }
        };
        fetchQuest();
    }, [questId]);

    // チェックイン（クエスト達成）処理
    const handleCheckIn = async () => {
        if (!quest) return;

        setIsCheckingIn(true);
        setError(null);

        try {
            // 実際はユーザーの位置情報とクエストの緯度経度を比較し、
            // 近ければポイント付与APIを呼び出す
            // const response = await fetch('/api/quests/checkin', { /* ... body with location and questId */ });
            
            // 成功したと仮定
            alert(`${quest.title}をクリアし、${quest.rewardPoints} ポイントを獲得しました！`);
            router.push('/quests'); // クエスト一覧に戻る
            
        } catch (e: any) {
            setError(e.message || 'チェックイン処理中にエラーが発生しました。');
        } finally {
            setIsCheckingIn(false);
        }
    };

    // 難易度に応じた色を決定
    const getDifficultyColor = (difficulty: Quest['difficulty']) => {
        switch (difficulty) {
            case 'Easy': return 'bg-green-500';
            case 'Medium': return 'bg-yellow-500';
            case 'Hard': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    }

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center">読み込み中...</div>;
    }

    if (error || !quest) {
        return (
            <div className="p-4 text-center">
                <p className="text-red-500 mb-4">{error || '指定されたクエストが見つかりませんでした。'}</p>
                <Link href="/quests" className="text-blue-600 hover:underline">
                    &larr; クエスト一覧に戻る
                </Link>
            </div>
        );
    }

    // 💡 エラーが発生していた30行目付近のコードを修正し、JSXとして正しく記述

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Head>
                <title>クエスト詳細: {quest.title}</title>
            </Head>

            {/* --- ヘッダー --- */}
            <header className="bg-white shadow-md sticky top-0 z-10">
                <div className="max-w-lg mx-auto p-4 flex items-center">
                    <Link href="/quests" className="text-gray-600 hover:text-gray-900">
                        <RiArrowLeftLine size={24} />
                    </Link>
                    <h1 className="text-xl font-bold text-gray-800 mx-auto flex items-center">
                        {/* 💡 修正箇所: {クエスト詳細} -> クエスト詳細 */}
                        クエスト詳細
                    </h1>
                </div>
            </header>

            {/* --- メインコンテンツ --- */}
            <main className="max-w-lg mx-auto p-4 flex-grow w-full">
                <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
                    <div className="text-center">
                        <RiTrophyFill size={48} className="text-yellow-500 mx-auto mb-2" />
                        <h2 className="text-2xl font-extrabold text-gray-900">{quest.title}</h2>
                    </div>

                    {/* クエスト情報タグ */}
                    <div className="flex justify-center flex-wrap gap-2 text-sm font-semibold">
                        <span className={`text-white px-3 py-1 rounded-full ${getDifficultyColor(quest.difficulty)}`}>
                            難易度: {quest.difficulty}
                        </span>
                        <span className="bg-indigo-500 text-white px-3 py-1 rounded-full flex items-center">
                            <RiTrophyFill className="mr-1" />
                            {quest.rewardPoints} ポイント
                        </span>
                        {quest.timeLimitMinutes > 0 && (
                            <span className="bg-gray-400 text-white px-3 py-1 rounded-full flex items-center">
                                <RiTimerLine className="mr-1" />
                                制限時間: {quest.timeLimitMinutes} 分
                            </span>
                        )}
                    </div>

                    {/* 詳細 */}
                    <div>
                        <h3 className="text-lg font-bold border-b pb-1 mb-2 text-gray-700">クエスト内容</h3>
                        <p className="whitespace-pre-wrap text-gray-800">{quest.description}</p>
                    </div>

                    {/* 目標地点 */}
                    <div>
                        <h3 className="text-lg font-bold border-b pb-1 mb-2 text-gray-700">目標地点</h3>
                        <p className="flex items-center text-gray-800">
                            <RiMapPinLine className="mr-2 text-red-500" />
                            {quest.locationName} (現地でスキャンが必要です)
                        </p>
                    </div>
                </div>
            </main>

            {/* --- チェックインボタン (フッター) --- */}
            <footer className="bg-white border-t sticky bottom-0 z-10 p-4 shadow-2xl">
                {error && <div className="p-2 mb-2 text-sm bg-red-100 text-red-700 rounded">{error}</div>}
                <button
                    onClick={handleCheckIn}
                    disabled={isCheckingIn}
                    className="w-full bg-yellow-600 text-white font-bold py-4 rounded-xl text-lg hover:bg-yellow-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                >
                    <RiCheckLine size={24} className="mr-2" />
                    {isCheckingIn ? '位置情報を確認中...' : `チェックインして ${quest.rewardPoints} ポイント獲得`}
                </button>
            </footer>
        </div>
    );
};

export default QuestDetailPage;
