import { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext'; // 既存のAuthContextに合わせてパスを調整してください
import { collection, getDocs, getFirestore, query, where, orderBy, limit } from 'firebase/firestore'; // limit をインポート
import { app } from '@/lib/firebase'; // 既存のFirebase初期化ファイルに合わせてパスを調整してください

// --- 型定義 ---
interface Ad {
  id: string;
  imageUrl: string;
  linkUrl: string;
  altText: string;
}

const HomePage: NextPage = () => {
  const { user } = useAuth();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loadingAds, setLoadingAds] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);

    const fetchAds = async () => {
      try {
        const db = getFirestore(app);
        const adsCollection = collection(db, 'advertisements');
        // --- ここから変更: limit(5) を追加して取得件数を5件に制限 ---
        const q = query(adsCollection, where('isActive', '==', true), orderBy('order', 'asc'), limit(5));
        // --- ここまで変更 ---
        const adSnapshot = await getDocs(q);
        
        const adsData = adSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Ad));
        
        setAds(adsData);
      } catch (error) {
        console.error("広告データの取得に失敗しました:", error);
      } finally {
        setLoadingAds(false);
      }
    };
    fetchAds();
  }, []);

  const genres = [
    '生活情報', '健康支援', '節約・特売', '人間関係', '教育・学習', '子育て',
    '防災・安全', '診断・運勢', 'エンタメ', '趣味・文化'
  ];

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-md mx-auto p-4">
        <header className="text-center py-6">
          <h1 className="text-2xl font-bold text-gray-800">みんなの那須アプリ</h1>
          <p className="text-sm text-gray-500 mt-2">下記のジャンルからお選びください。</p>
          {user && <p className="text-sm text-gray-600 mt-4">ようこそ、{user.email}さん</p>}
        </header>

        <main>
          {/* --- ジャンル選択ボタン --- */}
          <section className="mb-8">
            <div className="flex flex-wrap justify-center gap-2">
              {genres.map(genre => (
                <Link key={genre} href={`/genre/${genre}`} className="bg-gray-100 text-gray-700 text-sm font-medium py-2 px-4 rounded-full hover:bg-blue-100 transition">
                  {genre}
                </Link>
              ))}
            </div>
          </section>

          {/* --- 主要機能ボタン (店舗情報) --- */}
          <section className="mb-8 space-y-3">
            <Link href="/deals" className="block text-center text-white font-bold py-4 px-6 rounded-full shadow-md transition transform hover:scale-105" style={{ background: 'linear-gradient(to right, #ef4444, #f97316)' }}>
              店舗のお得情報はこちら
            </Link>
          </section>

          {/* --- ★★★ ここから広告カード ★★★ --- */}
          {isClient && (
            <section className="mb-8">
              <h2 className="text-lg font-bold text-gray-700 text-center mb-4">
                地域を応援する企業
              </h2>
              {loadingAds ? (
                <div className="grid grid-cols-2 gap-3">
                  {/* --- ここから変更: プレースホルダーを5つ表示 --- */}
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="rounded-lg bg-gray-200 animate-pulse w-full h-24"></div>
                  ))}
                  {/* --- ここまで変更 --- */}
                </div>
              ) : ads.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {ads.map((ad) => (
                    <a key={ad.id} href={ad.linkUrl} target="_blank" rel="noopener noreferrer" className="block p-2 rounded-lg shadow-md bg-white border border-gray-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                      <div className="w-full h-20 bg-gray-100 flex items-center justify-center rounded">
                        <p className="text-gray-700 font-semibold text-center text-sm px-1">{ad.altText || '広告'}</p>
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg bg-gray-50 border-2 border-dashed border-gray-300 w-full h-24 flex items-center justify-center">
                  <p className="text-gray-400 text-sm">現在、広告はありません</p>
                </div>
              )}
            </section>
          )}
          {/* --- ★★★ ここまで広告カード ★★★ --- */}

          {/* --- 主要機能ボタン (すべてのアプリ) --- */}
          <section className="space-y-3">
            <Link href="/apps" className="block text-center text-white font-bold py-4 px-6 rounded-full shadow-md transition transform hover:scale-105" style={{ background: 'linear-gradient(to right, #22d3ee, #3b82f6)' }}>
              すべてのアプリを見る
            </Link>
          </section>

          {/* --- フッターリンク --- */}
          <footer className="text-center mt-12 pb-4">
            <Link href="/mypage" className="text-sm text-gray-500 hover:underline">
              マイページに戻る
            </Link>
            <p className="text-xs text-gray-400 mt-4">© 2025 株式会社adtown</p>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default HomePage;



