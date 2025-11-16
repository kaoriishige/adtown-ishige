import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../../lib/firebase"; // 相対パス
import Link from "next/link";
import { RiArrowLeftLine } from "react-icons/ri";

// ✅ 修正: AppData 型を定義
interface AppData {
    id: string;
    name: string;
    url: string;
    isActive: boolean;
    genre: string; // Firestoreのカテゴリ名（感情カテゴリの場合は 'emotionCategory' フィールドを想定）
}

export default function EmotionCategoryPage() {
    const router = useRouter();
    // slugはURLから取得したカテゴリ名（例: trouble）
    const slug = Array.isArray(router.query.slug) ? router.query.slug[0] : router.query.slug;

    // ✅ 修正: useStateに型情報を渡し、エラー2345を解消
    const [apps, setApps] = useState<AppData[]>([] as AppData[]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!slug) return;

        const fetchApps = async () => {
            setIsLoading(true);
            try {
                // データベースの 'emotionCategory' フィールドと slug が一致するものを検索
                // 注: 実際のFirestoreフィールド名に合わせて 'emotionCategory' は調整してください。
                const q = query(
                    collection(db, "apps"),
                    where("emotionCategory", "==", slug), 
                    where("isActive", "==", true) // 公開中のもののみ
                );

                const snap = await getDocs(q);
                // ✅ 修正: 取得したデータを AppData 型にマッピングし、エラー2339を解消
                const list: AppData[] = snap.docs.map((doc) => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        name: data.name || '名称未設定',
                        url: data.url || '#',
                        isActive: data.isActive || false,
                        genre: data.genre || '',
                    } as AppData;
                });
                
                setApps(list);
            } catch (e) {
                console.error(`感情カテゴリ [${slug}] のアプリ取得に失敗しました:`, e);
            } finally {
                setIsLoading(false);
            }
        };

        fetchApps();
    }, [slug]);

    const title = slug || 'カテゴリ';

    return (
        <div className="bg-gray-100 min-h-screen">
            <div className="max-w-md mx-auto bg-white shadow-lg">
                <header className="p-4 border-b flex items-center">
                    <button onClick={() => router.push('/apps/categories')} className="text-gray-600 hover:text-gray-800 p-2">
                        <RiArrowLeftLine size={24} />
                    </button>
                    <h1 className="text-xl font-bold text-gray-900 ml-3 flex-grow truncate">
                        🎭 感情カテゴリ：{title}
                    </h1>
                </header>

                <main className="p-4 space-y-4">
                    {isLoading ? (
                        <p className="text-center text-gray-500 py-6">アプリを読み込み中...</p>
                    ) : (
                        <>
                            {apps.map((app) => (
                                // ✅ 修正: aタグに target/rel を設定し、外部URLに安全にリンク
                                <a
                                    key={app.id}
                                    href={app.url}
                                    target={app.url.startsWith('http') ? '_blank' : '_self'}
                                    rel={app.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                                    className="block p-4 border border-blue-200 rounded-lg shadow-sm hover:bg-blue-50 transition-colors"
                                >
                                    <h2 className="font-bold text-lg text-blue-700">{app.name}</h2>
                                    <p className="text-xs text-gray-500 mt-1">
                                        URL: <span className="truncate inline-block max-w-xs">{app.url}</span>
                                    </p>
                                </a>
                            ))}

                            {apps.length === 0 && (
                                <p className="text-gray-600 mt-4 text-center py-8 border rounded-lg bg-white">
                                    現在、**「{title}」**に属する公開アプリはありません。
                                </p>
                            )}
                        </>
                    )}
                </main>
            </div>
        </div>
    );
}
