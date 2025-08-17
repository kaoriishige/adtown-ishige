import { NextPage } from 'next';
import Link from 'next/link';

// --- ★★★ サンプルデータ ★★★ ---
const genres = [
  '生活情報', '健康支援', '節約・特売', '人間関係',
  '教育・学習', '子育て', '防災・安全', '診断・運勢',
  'エンタメ', '趣味・文化',
];

const PartnerAppDemoPage: NextPage = () => {
  return (
    <div className="min-h-screen bg-white font-sans">
      <header className="bg-white p-4 text-center sticky top-0 z-10 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800">みんなの那須アプリ</h1>
        <p className="text-gray-600 mt-1">下記のジャンルからお選びください。</p>
      </header>

      <main className="p-4 max-w-3xl mx-auto">
        <div className="text-center my-4">
          <Link href="/partner/demo" className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg text-sm">
            ← デモ用マイページに戻る
          </Link>
        </div>

        {/* --- ジャンル選択セクション --- */}
        <div className="flex flex-wrap justify-center gap-3 my-8">
          {genres.map((genre) => (
            // 「生活情報」のみクリック可能にし、他はダミーにします
            genre === '生活情報' ? (
              <Link key={genre} href="/partner/genre-demo" className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 px-5 rounded-full shadow-sm cursor-pointer transition-colors">
                {genre}
              </Link>
            ) : (
              <div key={genre} className="bg-gray-100 text-gray-800 font-semibold py-2 px-5 rounded-full shadow-sm cursor-not-allowed opacity-50">
                {genre}
              </div>
            )
          ))}
        </div>

        {/* --- 広告見本 (1) --- */}
        <div className="text-center my-8">
          <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold py-4 px-6 rounded-lg shadow-lg text-xl">
            店舗のお得情報はこちら
          </div>
        </div>

        <div className="text-center my-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">地域を応援する企業</h2>
          <div className="border-2 border-dashed border-gray-400 rounded-lg p-8 bg-gray-50">
            <p className="text-gray-600 font-bold">現在、広告はありません</p>
            <p className="text-sm text-gray-500">（ここに広告が掲載されます）</p>
          </div>
        </div>

        <div className="text-center my-8">
          <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold py-4 px-6 rounded-lg shadow-lg text-xl">
            すべてのアプリを見る
          </div>
        </div>
      </main>
    </div>
  );
};

export default PartnerAppDemoPage;