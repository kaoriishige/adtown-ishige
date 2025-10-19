import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { RiArrowLeftLine, RiEmotionHappyLine, RiMapPinLine } from 'react-icons/ri';

// --- 型定義 ---
interface AppItem {
    id: string;
    name: string;
    genre: string;
    description: string;
    iconUrl: string;
}

interface EmotionAppProps {
    emotion: string;
    apps: AppItem[]; // 💡 アプリリストをPropsで渡すか、内部で定義
}

// ダミーデータ
const mockApps: AppItem[] = [
    { id: 'app1', name: '特売情報ナビ', genre: '買い物', description: 'お得な情報を見つけて気分を上げよう！', iconUrl: 'https://placehold.co/50x50/a5f3fc/1f2937?text=SALE' },
    { id: 'app2', name: '那須の景観スポット', genre: '観光', description: '美しい景色で心を落ち着かせよう。', iconUrl: 'https://placehold.co/50x50/8b5cf6/1f2937?text=MAP' },
    { id: 'app3', name: '相性診断（占い）', genre: 'エンタメ', description: '今日の運勢を占って不安を解消！', iconUrl: 'https://placehold.co/50x50/fca5a5/1f2937?text=QUIZ' },
];

const EmotionAppPage: NextPage<EmotionAppProps> = () => {
    const router = useRouter();
    const { emotion } = router.query;
    
    // 💡 修正: appsをuseStateで定義（本来はAPI取得）
    const [apps, setApps] = useState<AppItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const decodedEmotion = (emotion as string || '不明な感情');
    const displayEmotion = decodeURIComponent(decodedEmotion);

    useEffect(() => {
        // 実際はAPIコールで感情に合ったアプリを取得
        // デバッグ目的でダミーデータをセット
        setApps(mockApps);
        setIsLoading(false);
    }, [emotion]);


    return (
        <div className="min-h-screen bg-gray-50">
            <Head>
                <title>{displayEmotion}に合うアプリ一覧</title>
            </Head>

            <header className="bg-white shadow-md sticky top-0 z-10">
                <div className="max-w-xl mx-auto p-4 flex items-center">
                    <button onClick={() => router.back()} className="text-gray-600 hover:text-gray-900">
                        <RiArrowLeftLine size={24} />
                    </button>
                    <h1 className="text-xl font-bold text-gray-800 mx-auto flex items-center">
                        <RiEmotionHappyLine className="mr-2 text-indigo-500" />
                        {displayEmotion}に合うアプリ一覧
                    </h1>
                </div>
            </header>

            <main className="max-w-xl mx-auto p-4 w-full">
                {/* 34行目周辺のスタイルミスを修正 */}
                <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
                    
                    {/* 35行目周辺のスタイルミスと変数ミスを修正 */}
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>
                        {/* 💡 修正箇所: 以前のエラー行周辺の記述を修正 */}
                        {displayEmotion}に合うアプリ一覧
                    </h1>
                    
                    <p className="text-gray-600 mb-6">あなたの今の気分にぴったりのアプリや情報です。</p>

                    {isLoading ? (
                         <div className="text-center p-8">読み込み中...</div>
                    ) : apps.length === 0 ? (
                        <div className="p-8 bg-white rounded-lg shadow text-center text-gray-500">
                            現在、{displayEmotion}に合うおすすめアプリはありません。
                        </div>
                    ) : (
                        <ul className="space-y-4">
                            {apps.map((app) => (
                                <li key={app.id}>
                                    <Link 
                                        href={`/app/view/${app.id}`} 
                                        className="flex items-center p-4 bg-white rounded-lg shadow transition transform hover:shadow-md hover:scale-[1.01]"
                                        style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '15px' }}
                                    >
                                        <img src={app.iconUrl} alt={app.name} className="w-12 h-12 rounded-lg mr-4 flex-shrink-0" />
                                        <div>
                                            <h3 className="font-bold text-lg text-indigo-600">{app.name}</h3>
                                            <p className="text-sm text-gray-500">{app.description}</p>
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </main>
        </div>
    );
};

export default EmotionAppPage;