import { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { getFirestore, collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { app } from '../../lib/firebase'; // 既存のFirebase初期化ファイルに合わせてパスを調整

// --- 型定義 ---
interface AppData {
  id: string;
  name: string;
}
interface AdData {
  id: string;
  linkUrl: string;
  altText: string;
}
// 表示するアイテムの型（アプリか広告かを判別するため）
type DisplayItem = { type: 'app'; data: AppData } | { type: 'ad'; data: AdData };

// --- ページコンポーネント ---
const GenrePage: NextPage = () => {
  const router = useRouter();
  const { genre } = router.query;

  const [apps, setApps] = useState<AppData[]>([]);
  const [ads, setAds] = useState<AdData[]>([]);
  const [displayItems, setDisplayItems] = useState<DisplayItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!genre || typeof genre !== 'string') return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const db = getFirestore(app);

        // 1. ジャンルに一致するアプリを取得
        const appsQuery = query(collection(db, 'apps'), where('genre', '==', genre));
        const appsSnapshot = await getDocs(appsQuery);
        const appsData = appsSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || '名称未設定',
        }));
        setApps(appsData);

        // 2. 表示する広告を取得
        const adsQuery = query(collection(db, 'advertisements'), where('isActive', '==', true), orderBy('order', 'asc'));
        const adsSnapshot = await getDocs(adsQuery);
        const adsData = adsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as AdData));
        setAds(adsData);

      } catch (error) {
        console.error("データの取得に失敗しました:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [genre]);

  // --- ここから変更: 広告がない場合もプレースホルダーを挿入するロジック ---
  // アプリと広告のリストを結合して表示用リストを作成
  useEffect(() => {
    if (apps.length === 0) {
      setDisplayItems([]);
      return;
    }
    
    const combinedList: DisplayItem[] = [];
    let adIndex = 0;

    apps.forEach((app, index) => {
      combinedList.push({ type: 'app', data: app });
      // 3つ目のアプリの後に広告枠を挿入 (indexが2, 5, 8...)
      if ((index + 1) % 3 === 0) {
        if (ads.length > 0) {
          // 実際の広告データがあればそれを使う
          combinedList.push({ type: 'ad', data: ads[adIndex] });
          adIndex = (adIndex + 1) % ads.length; // 広告を循環させる
        } else {
          // 広告データがなければ、ユニークなIDを持つプレースホルダーを挿入
          const placeholderAd: AdData = { id: `placeholder-${index}`, linkUrl: '#', altText: '広告スペース' };
          combinedList.push({ type: 'ad', data: placeholderAd });
        }
      }
    });
    
    setDisplayItems(combinedList);
  }, [apps, ads]);
  // --- ここまで変更 ---

  const pageTitle = `${genre || 'アプリ'}の一覧 | みんなの那須アプリ`;

  return (
    <div className="bg-blue-50 min-h-screen">
      <Head>
        <title>{"pageTitle"}</title>
      </Head>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-8">
            <Link href="/home" className="text-blue-600 hover:underline">
                ← アプリのジャンル選択に戻る
            </Link>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-blue-900 text-center mb-12">
          {genre}のアプリ
        </h1>

        {loading ? (
          <p className="text-center text-gray-500">読み込み中...</p>
        ) : displayItems.length > 0 ? (
          <div className="max-w-2xl mx-auto space-y-4">
            {displayItems.map((item) => {
              if (item.type === 'app') {
                // --- アプリの表示 ---
                return (
                  <Link key={item.data.id} href={`/app/${item.data.id}`} legacyBehavior>
                    <a className="block w-full bg-white rounded-lg shadow-md p-4 text-center text-blue-700 font-semibold transition-transform hover:scale-105 text-lg">
                      {item.data.name}
                    </a>
                  </Link>
                );
              } else {
                // --- ★★★ 広告の表示 (四角い枠に変更) ★★★ ---
                return (
                  <a 
                    key={item.data.id} 
                    href={item.data.linkUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    // プレースホルダーの場合はクリックできないようにスタイルを調整
                    className={`block w-full h-28 rounded-lg shadow-md p-4 text-center border-2 border-dashed border-gray-300 flex items-center justify-center transition-colors ${
                      item.data.id.startsWith('placeholder')
                        ? 'bg-gray-50 cursor-default'
                        : 'bg-gray-100 group hover:bg-gray-200'
                    }`}
                    // プレースホルダーの場合はクリックイベントを無効化
                    onClick={(e) => { if (item.data.id.startsWith('placeholder')) e.preventDefault(); }}
                  >
                    <div>
                      <p className="font-semibold text-gray-700">{item.data.altText}</p>
                      <p className="text-xs text-gray-500 mt-1">広告</p>
                    </div>
                  </a>
                );
              }
            })}
          </div>
        ) : (
          <p className="text-center text-gray-500">このジャンルのアプリはまだありません。</p>
        )}
        
        <div className="text-center mt-16">
          <Link href="/apps/all" className="text-sm sm:text-base text-gray-600 hover:text-blue-600 hover:underline">
            すべてのアプリ一覧へ
          </Link>
        </div>
      </main>
    </div>
  );
};

export default GenrePage;






