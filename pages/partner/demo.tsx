import { NextPage } from 'next';
import Link from 'next/link';

// --- ★★★ サンプルデータ ★★★ ---
const genres = [
  '生活情報', '健康支援', '節約・特売', '人間関係',
  '教育・学習', '子育て', '防災・安全', '診断・運勢',
  'エンタメ', '趣味・文化',
];

const sampleApps = [
  { name: '面倒な手続き、忘れない。引っ越し準備ダンドリAI' },
  { name: '今日の天気で何着る？服装コーデ提案AI' },
  { name: '三日坊主にならない！目標達成ふりかえり日記' },
  { name: '「ごはん、何にしよう…」献立お悩み相談AI' },
  { name: 'もう買い忘れない！お買い物リスト作成アシスタント' },
];

const PartnerDemoPage: NextPage = () => {
  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <header className="bg-white p-4 text-center sticky top-0 z-10 shadow-md">
        <div className="absolute top-4 right-4 bg-yellow-300 text-yellow-800 font-bold px-4 py-2 rounded-full shadow-lg text-sm">
          これはデモページです
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mt-8">みんなの那須アプリ</h1>
        <p className="text-gray-600">下記のジャンルからお選びください。</p>
      </header>

      <main className="p-4 max-w-3xl mx-auto">
        
        {/* --- ジャンル選択セクション --- */}
        <div className="flex flex-wrap justify-center gap-3 my-8">
          {genres.map((genre) => (
            <div key={genre} className="bg-white text-gray-800 font-semibold py-2 px-5 rounded-full shadow-sm border border-gray-200 cursor-pointer hover:bg-gray-50">
              {genre}
            </div>
          ))}
        </div>

        {/* --- 広告見本 (1) --- */}
        <div className="text-center my-12">
          <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold py-4 px-6 rounded-lg shadow-lg text-xl">
            店舗のお得情報はこちら
          </div>
        </div>

        <div className="text-center my-12">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">地域を応援する企業</h2>
          <div className="border-2 border-dashed border-gray-400 rounded-lg p-8 bg-gray-50">
            <p className="text-gray-600 font-bold">現在、広告はありません</p>
            <p className="text-sm text-gray-500">（ここに広告が掲載されます）</p>
          </div>
        </div>

        <div className="text-center my-12">
          <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold py-4 px-6 rounded-lg shadow-lg text-xl">
            すべてのアプリを見る
          </div>
        </div>

        {/* --- 区切り線 --- */}
        <hr className="my-16 border-t-2 border-gray-200" />

        {/* --- アプリ一覧と広告見本 (2) --- */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-8">生活情報のアプリ</h1>
          <div className="space-y-4 max-w-2xl mx-auto">
            {sampleApps.slice(0, 3).map((app) => (
              <div key={app.name} className="bg-white p-5 rounded-lg shadow text-center text-blue-600 font-semibold text-lg border border-gray-200">
                {app.name}
              </div>
            ))}

            {/* --- サンプル広告スペース --- */}
            <div className="border-2 border-dashed border-gray-400 rounded-lg p-8 text-center bg-gray-50">
              <p className="text-gray-600 font-bold">広告スペース</p>
              <p className="text-sm text-gray-500">（ここに広告が掲載されます）</p>
            </div>

            {sampleApps.slice(3).map((app) => (
              <div key={app.name} className="bg-white p-5 rounded-lg shadow text-center text-blue-600 font-semibold text-lg border border-gray-200">
                {app.name}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 text-center">
            <Link href="/partner/signup" className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg text-lg">
              パートナー登録はこちら
            </Link>
        </div>
      </main>

      <footer className="text-center text-xs text-gray-500 py-4 border-t mt-8">
        <p>© 2025 株式会社adtown</p>
      </footer>
    </div>
  );
};

export default PartnerDemoPage;