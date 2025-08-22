import { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { collection, getDocs, getFirestore, query, where, orderBy, limit } from 'firebase/firestore';
import { app } from '@/lib/firebase';

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
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setIsClient(true);

    const fetchAds = async () => {
      try {
        const db = getFirestore(app);
        const adsCollection = collection(db, 'advertisements');
        const q = query(adsCollection, where('isActive', '==', true), orderBy('order', 'asc'), limit(5));
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

  const emergencyContacts = [
    { name: '消費者ホットライン', number: '188', description: '商品やサービスのトラブル', url: 'https://www.caa.go.jp/policies/policy/local_cooperation/local_consumer_administration/hotline/' },
    { name: '救急安心センター', number: '#7119', description: '急な病気やケガで救急車を呼ぶか迷った時', url: 'https://www.fdma.go.jp/publication/portal/post2.html' },
    { name: '休日夜間急患診療所', number: '0287-64-4110', description: '那須塩原市の休日・夜間の急病', url: 'https://www.city.nasushiobara.tochigi.jp/soshikikarasagasu/kenkozoshinka/yobo/1/3/3055.html' },
    { name: '水道のトラブル', number: '090-2463-6638', description: '（那須塩原市指定業者(有)クリプトン）水漏れ・つまりなど', url: 'https://www.city.nasushiobara.tochigi.jp/soshikikarasagasu/jogesuidobu/gyomuannai/1/5/1749.html' },
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

          {/* --- 緊急連絡先ボタン --- */}
          <section className="mb-4">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="w-full text-center text-gray-800 font-bold py-4 px-6 rounded-full shadow-md transition transform hover:scale-105 bg-yellow-300 hover:bg-yellow-400"
            >
              <span className="mr-2">⚠️</span> お困りのときは (緊急連絡先)
            </button>
          </section>

          {/* --- 主要機能ボタン --- */}
          <section className="mb-8 space-y-3">
            <Link href="/deals" className="block text-center text-white font-bold py-4 px-6 rounded-full shadow-md transition transform hover:scale-105" style={{ background: 'linear-gradient(to right, #ef4444, #f97316)' }}>
              🛍️ 店舗のお得情報はこちら
            </Link>
            
            {/* ▼▼▼ ここに新しいボタンを追加します ▼▼▼ */}
            <Link href="/food-loss" className="block text-center text-white font-bold py-4 px-6 rounded-full shadow-md transition transform hover:scale-105" style={{ background: 'linear-gradient(to right, #22c55e, #10b981)' }}>
              🥗 フードロス情報はこちら
            </Link>
          </section>

          {/* --- 広告カード --- */}
          {isClient && (
            <section className="mb-8">
              <h2 className="text-lg font-bold text-gray-700 text-center mb-4">
                地域を応援する企業
              </h2>
              {/* ... 広告表示ロジック ... */}
            </section>
          )}

          {/* --- 主要機能ボタン (すべてのアプリ) --- */}
          <section className="space-y-3">
            <Link href="/apps/all" className="block text-center text-white font-bold py-4 px-6 rounded-full shadow-md transition transform hover:scale-105" style={{ background: 'linear-gradient(to right, #22d3ee, #3b82f6)' }}>
              📱 すべてのアプリを見る
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

      {/* --- ポップアップ（モーダル） --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-4 border-b">
              <h2 className="text-xl font-bold text-center">緊急連絡先</h2>
            </div>
            <div className="p-4 space-y-4">
              {emergencyContacts.map(contact => (
                <a key={contact.name} href={contact.url} target="_blank" rel="noopener noreferrer" className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <p className="font-bold text-blue-600">{contact.name}</p>
                  <a href={`tel:${contact.number.replace('#', '')}`} className="text-2xl font-bold text-gray-800 hover:underline">{contact.number}</a>
                  <p className="text-sm text-gray-500">{contact.description}</p>
                </a>
              ))}
            </div>
            <div className="p-4 border-t text-center">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-6 rounded-lg"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;



