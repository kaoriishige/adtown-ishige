import Link from 'next/link';
import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase'; // 既存の相対パスを維持
import { RiLayoutGridFill } from 'react-icons/ri';

// --- AppData 型を定義 ---
interface AppData {
    id: string;
    name: string;
    genre: string; // Firestoreのジャンル名（例: 教育・学習, 節約・特売）
    url: string; // admin/manageAppsで登録されたアプリのURL
    isActive: boolean; // 公開状態
}

// ---------------------------------------------------
// --- 感情ジャンル (emotionCategories) を削除 ---
// ---------------------------------------------------

// メインのジャンル (旧 functionCategories)
// (ユーザーが提示したアプリ一覧のジャンルと一致させます)
const mainCategories = [
    { label: '生活情報', slug: '生活情報' },
    { label: '健康支援', slug: '健康支援' },
    { label: '子育て', slug: '子育て' },
    { label: '節約・特売', slug: '節約・特売' },
    { label: 'エンタメ', slug: 'エンタメ' },
    { label: '防災・安全', slug: '防災・安全' },
    { label: '教育・学習', slug: '教育・学習' },
    { label: '診断・運勢', slug: '診断・運勢' },
    { label: '人間関係', slug: '人間関係' },
    { label: '趣味・文化', slug: '趣味・文化' },
    // 必要に応じて 'その他' も追加できます
    // { label: 'その他', slug: 'その他' },
];

// ジャンル名に基づいてアイコンを返すヘルパー関数
const getGenreIcon = (genre: string) => {
    switch (genre) {
        case '節約・特売':
            return '🛒';
        case '教育・学習':
        case '子育て':
            return '🎒';
        case '生活情報':
        case '診断・運勢':
            return '💡';
        case '防災・安全':
            return '🚨';
        case '人間関係':
        case '健康支援':
            return '❤️';
        case 'エンタメ':
        case '趣味・文化':
            return '🎨';
        default:
            return '📱';
    }
};

export default function AppsTopPage() {
    // useStateに型情報を渡し、エラー2345を解消
    const [apps, setApps] = useState<AppData[]>([] as AppData[]);

    useEffect(() => {
        const fetchApps = async () => {
            try {
                const snap = await getDocs(collection(db, 'apps'));
                
                const list: AppData[] = snap.docs.map((doc) => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        name: data.name || '名称未設定',
                        url: data.url || '#', // URLがない場合は '#' にフォールバック
                        genre: data.genre || 'その他',
                        isActive: data.isActive || false,
                    } as AppData;
                }).filter(app => app.isActive); // 公開中のアプリのみ表示
                
                setApps(list);
            } catch (e) {
                console.error("アプリデータの取得に失敗しました:", e);
            }
        };

        fetchApps();
    }, []);

    return (
        <div className="p-6 max-w-md mx-auto bg-white min-h-screen">
            <h1 className="text-2xl font-bold text-center mb-6 border-b pb-2">みんなの那須アプリ</h1>

            {/* --------------------------------------------------- */}
            {/* --- 感情ジャンルセクションを削除 --- */}
            {/* --------------------------------------------------- */}

            {/* 機能ジャンルセクション (アプリ一覧ページに遷移) */}
            <h2 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-green-500 pl-3">🧩 ジャンルで選ぶ</h2>
            <div className="grid grid-cols-3 gap-2">
                {mainCategories.map((cat) => (
                    <Link
                        key={cat.slug}
                        // ✅ 修正: /apps/all ページへ遷移し、genre クエリでフィルタリングを指示
                        href={`/apps/all?genre=${encodeURIComponent(cat.slug)}`}
                        className="bg-green-100 hover:bg-green-200 text-green-800 text-sm px-2 py-3 rounded-lg font-medium text-center transition-colors shadow-sm"
                    >
                        {cat.label}
                    </Link>
                ))}
            </div>

            {/* ---- Firestoreから直接アプリ一覧表示 ---- */}
            <h2 className="text-xl font-semibold mt-10 mb-4 border-l-4 border-gray-500 pl-3">📱 全公開アプリ一覧</h2>

            {apps.length === 0 ? (
                <p className="text-gray-500 text-center py-6">公開されているアプリはありません。</p>
            ) : (
                <div className="space-y-3">
                    {apps.map((app) => (
                        // <a>タグに変換し、URLに基づいてターゲットを設定する
                        <a
                            key={app.id}
                            href={app.url} 
                            // 外部URLなら別タブ、内部パスなら同一タブで開く
                            target={app.url.startsWith('http') ? '_blank' : '_self'}
                            rel={app.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                            className="block p-3 border border-gray-200 rounded-lg shadow-sm mb-2 hover:bg-gray-50 transition-colors text-gray-700 font-medium"
                        >
                            <div className="flex items-center space-x-2">
                                <span className="text-xl">{getGenreIcon(app.genre)}</span>
                                <span className="font-bold text-blue-600">[{app.genre || 'その他'}]</span>
                                <span>{app.name}</span>
                            </div>
                        </a>
                    ))}
                </div>
            )}
            
            <div className="text-center mt-10">
                <Link href="/home" className="text-gray-600 hover:text-blue-600 hover:underline">
                    ← ホームに戻る
                </Link>
            </div>
        </div>
    );
}