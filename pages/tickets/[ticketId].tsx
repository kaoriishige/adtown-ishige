import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { RiArrowLeftLine, RiCoupon3Line, RiMapPinLine, RiStoreLine, RiTimeLine, RiRefreshLine } from 'react-icons/ri';

// --- データ用の型定義 ---
interface Deal {
    id: string;
    storeName: string;
    title: string;
    description: string;
    imageUrl?: string;
    storeAddress: string;
    type: 'クーポン' | 'お得情報';
    expiresAt: string;
}

const TicketDetailPage: NextPage = () => {
    const router = useRouter();
    const { ticketId } = router.query;
    const [deal, setDeal] = useState<Deal | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isUsed, setIsUsed] = useState(false); // チケット使用済み状態

    useEffect(() => {
        const fetchDeal = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // 本番では ticketId に基づいてFirestore/APIからデータを取得します
                // const response = await fetch(`/api/tickets/${ticketId}`);
                // const data = await response.json();
                // setDeal(data);
                
                // --- 現在は仮のデータを表示します ---
                const mockDeal: Deal = {
                    id: ticketId as string || 't1',
                    storeName: 'なっぴーベーカリー', 
                    title: 'パン全品10%OFFクーポン', 
                    description: 'この画面をスタッフに提示すると、パン全品が10%割引になります。\n※ 他の割引との併用不可。',
                    imageUrl: 'https://placehold.co/100x100/34d399/1f2937?text=COUPON',
                    storeAddress: '那須塩原市○○町1-2-3',
                    type: 'クーポン',
                    expiresAt: new Date(Date.now() + 86400000 * 7).toISOString(), // 7日後
                };
                setDeal(mockDeal);
                setIsUsed(false); // 初期状態では未使用とする

            } catch (error) {
                console.error("Failed to fetch ticket deal", error);
                setError('チケット情報の読み込みに失敗しました。');
            } finally {
                setIsLoading(false);
            }
        };
        fetchDeal();
    }, [ticketId]);

    // チケット使用処理
    const handleUseTicket = () => {
        if (!deal) return;
        if (window.confirm(`【重要】${deal.title}を使用済みにしますか？\nこの操作は元に戻せません。お店のスタッフの目の前でのみ行ってください。`)) {
            // 実際はAPIを叩いて使用済みフラグを立てる
            setIsUsed(true);
            alert("チケットを使用済みにしました。ご利用ありがとうございました！");
        }
    };

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center">読み込み中...</div>;
    }

    if (error || !deal) {
        return (
            <div className="p-4 text-center">
                <p className="text-red-500 mb-4">{error || '指定されたチケットが見つかりませんでした。'}</p>
                <Link href="/mypage" className="text-blue-600 hover:underline">
                    &larr; マイページに戻る
                </Link>
            </div>
        );
    }
    
    const expired = new Date(deal.expiresAt) < new Date();
    const buttonDisabled = isUsed || expired;
    const buttonText = expired ? '期限切れです' : isUsed ? '使用済み' : 'このチケットを使用する';

    return (
        <div className="min-h-screen bg-gray-50">
            <Head>
                {/* 💡 修正箇所: 43行目のエラーを解消 */}
                <title>{`チケット詳細: ${deal.title}`}</title>
            </Head>
            <div className="max-w-md mx-auto p-4 pt-10">
                <button onClick={() => router.back()} className="mb-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg text-sm">
                    <RiArrowLeftLine className="inline mr-1" /> マイページに戻る
                </button>

                {/* チケットカード */}
                <div className={`bg-white rounded-xl shadow-2xl overflow-hidden border-4 ${isUsed ? 'border-gray-400' : expired ? 'border-red-500' : 'border-indigo-500'}`}>
                    
                    {/* ヘッダー */}
                    <div className={`p-4 text-white ${isUsed ? 'bg-gray-400' : expired ? 'bg-red-500' : 'bg-indigo-600'}`}>
                        <div className="flex items-center text-lg font-bold">
                            <RiCoupon3Line className="mr-2" />
                            {deal.type}チケット
                        </div>
                    </div>

                    {/* 詳細 */}
                    <div className="p-6 space-y-4">
                        <h1 className="text-2xl font-extrabold text-gray-900">{deal.title}</h1>
                        <p className="text-gray-700 whitespace-pre-wrap">{deal.description}</p>
                        
                        <div className="pt-4 border-t border-dashed">
                            <div className="text-sm space-y-2">
                                <p className="flex items-center text-gray-600 font-medium">
                                    <RiStoreLine className="mr-2 text-indigo-500" />
                                    店舗: {deal.storeName}
                                </p>
                                <p className="flex items-start text-gray-600">
                                    <RiMapPinLine className="mr-2 mt-1 flex-shrink-0 text-indigo-500" />
                                    住所: {deal.storeAddress}
                                </p>
                                <p className={`flex items-center font-bold ${expired ? 'text-red-600' : isUsed ? 'text-gray-600' : 'text-orange-600'}`}>
                                    <RiTimeLine className="mr-2" />
                                    有効期限: {new Date(deal.expiresAt).toLocaleDateString('ja-JP')}まで
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* 使用ボタン */}
                <div className="mt-8">
                    <button
                        onClick={handleUseTicket}
                        disabled={buttonDisabled}
                        className={`w-full py-4 text-xl font-bold text-white rounded-lg transition ${buttonDisabled ? 'bg-gray-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                    >
                        {buttonText}
                    </button>
                    {!buttonDisabled && (
                        <p className="text-red-500 text-xs mt-2 text-center font-bold">
                            !!! 注意: 必ずスタッフの目の前でボタンを押してください !!!
                        </p>
                    )}
                </div>

            </div>
        </div>
    );
};

export default TicketDetailPage;