import { NextPage } from 'next';
import Link from 'next/link';

// --- ★★★ サンプル広告データ ★★★ ---
const sampleAds = [
  { id: 1, title: '地元の新鮮野菜フェア開催中！', store: 'サンプルスーパーマーケット', imageUrl: 'https://placehold.co/600x300/A8E6CF/333333?text=新鮮野菜フェア' },
  { id: 2, title: '秋の味覚、さんま祭り！', store: 'サンプル鮮魚店', imageUrl: 'https://placehold.co/600x300/FFD3B6/333333?text=さんま祭り' },
  { id: 3, title: '週末限定！全品10%OFFクーポン', store: 'サンプルドラッグストア', imageUrl: 'https://placehold.co/600x300/DCEDC1/333333?text=週末限定クーポン' },
];

const PartnerAppDemoPage: NextPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-blue-600 text-white p-4 text-center sticky top-0 z-10 shadow-md">
        <h1 className="text-xl font-bold">アプリページ（広告掲載サンプル）</h1>
      </header>

      <main className="p-4">
        <div className="text-center my-4">
          <Link href="/partner/demo" className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">
            ← デモメニューに戻る
          </Link>
        </div>

        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 my-4 rounded-lg">
          <p className="font-bold">これは営業用のサンプルページです。</p>
          <p>ここに、パートナー様の広告やチラシが掲載されるイメージです。</p>
        </div>

        {/* --- サンプル広告の表示 --- */}
        <div className="space-y-6">
          {sampleAds.map((ad) => (
            <div key={ad.id} className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
              <img src={ad.imageUrl} alt={ad.title} className="w-full h-48 object-cover" />
              <div className="p-4">
                <h2 className="text-xl font-bold text-gray-800">{ad.title}</h2>
                <p className="text-gray-600 mt-1">提供: {ad.store}</p>
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="text-center text-xs text-gray-500 py-4 border-t mt-8">
        <p>© 2025 株式会社adtown</p>
      </footer>
    </div>
  );
};

export default PartnerAppDemoPage;