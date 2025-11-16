import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, Query } from 'firebase/firestore';
import { db } from '../../lib/firebase'; // 相対パス
import Head from 'next/head';
import Link from 'next/link';
import { RiArrowLeftLine } from 'react-icons/ri';

// --- 型定義 ---
interface AppData {
    id: string;
    name: string;
    url: string;
    isActive: boolean;
    genre: string; // Firestoreのカテゴリ名
}

// --- ページコンポーネント ---
const AllAppsPage: NextPage = () => {
    const router = useRouter();
    // URLクエリから genre パラメータを取得
    const genreFilter = Array.isArray(router.query.genre) ? router.query.genre[0] : router.query.genre;
    
    const [apps, setApps] = useState<AppData[]>([] as AppData[]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // router.isReady はクエリパラメータがロードされるのを待つ
        if (!router.isReady) return;

        const fetchApps = async () => {
            setIsLoading(true);
            try {
                let q: Query;
                const appsCol = collection(db, 'apps');
                
                // フィルタリングロジック: genre クエリがあるかどうかで分岐
                if (genreFilter) {
                    // 特定のジャンルでフィルタ
                    q = query(
                        appsCol,
                        where('genre', '==', genreFilter),
                        where('isActive', '==', true)
                    );
                } else {
                    // クエリがない場合は、公開中のすべてのアプリを表示
                    q = query(appsCol, where('isActive', '==', true));
                }

                const snap = await getDocs(q);
                
                const appList: AppData[] = snap.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        name: data.name || '名称未設定',
                        url: data.url || '#',
                        isActive: data.isActive || false,
                        genre: data.genre || 'その他',
                    } as AppData;
                });
                
                setApps(appList);

            } catch (error) {
                console.error("アプリデータの取得に失敗しました:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchApps();
    }, [router.isReady, genreFilter]); // genreFilterが変わるたびに再実行

    const title = genreFilter ? `「${genreFilter}」のアプリ` : 'すべてのアプリ一覧';

    return (
        <>
            <Head>
                <title>{`${title} - みんなの那須アプリ`}</title>
            </Head>
            <div className="bg-gray-100 min-h-screen">
                <div className="max-w-md mx-auto bg-white shadow-lg">
                    <header className="p-4 border-b flex items-center">
                        {/* 戻るボタンはホームへ */}
                        <button onClick={() => router.push('/home')} className="text-gray-600 hover:text-gray-800 p-2">
                            <RiArrowLeftLine size={24} />
                        </button>
                        <h1 className="text-xl font-bold text-gray-900 ml-3 flex-grow truncate">
                            {title}
                        </h1>
                    </header>

                    <main className="p-4 space-y-4">
                        {isLoading ? (
                            <p className="text-center text-gray-500 py-6">アプリを読み込み中...</p>
                        ) : (
                            <>
                                {apps.length === 0 ? (
                                    <p className="text-gray-600 mt-4 text-center py-8 border rounded-lg bg-white">
                                        現在、{genreFilter ? `「${genreFilter}」` : 'この条件'}に属する公開アプリはありません。
                                    </p>
                                ) : (
                                    apps.map((app) => (
                                        // admin/manageAppsで入れたURLに接続するaタグ
                                        <a
                                            key={app.id}
                                            href={app.url}
                                            // 外部URLなら別タブ、内部パスなら同一タブで開く
                                            target={app.url.startsWith('http') ? '_blank' : '_self'}
                                            rel={app.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                                            className="block p-4 border border-blue-200 rounded-lg shadow-sm hover:bg-blue-50 transition-colors"
                                        >
                                            <p className="text-xs text-gray-500">[{app.genre || 'その他'}]</p>
                                            <h2 className="font-bold text-lg text-blue-700 mt-1">{app.name}</h2>
                                        </a>
                                    ))
                                )}
                            </>
                        )}
                    </main>
                </div>
            </div>
        </>
    );
};

export default AllAppsPage;
