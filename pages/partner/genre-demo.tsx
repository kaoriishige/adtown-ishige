import { NextPage } from 'next';
import Link from 'next/link';

// --- ★★★ サンプルデータ ★★★ ---
const sampleApps = [
  { name: '面倒な手続き、忘れない。引っ越し準備ダンドリAI' },
  { name: '今日の天気で何着る？服装コーデ提案AI' },
  { name: '三日坊主にならない！目標達成ふりかえり日記' },
  { name: '「ごはん、何にしよう…」献立お悩み相談AI' },
  { name: 'もう買い忘れない！お買い物リスト作成アシスタント' },
];

const PartnerGenreDemoPage: NextPage = () => {
  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <header className="bg-white p-4 text-center sticky top-0 z-10 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800">生活情報のアプリ</h1>
      </header>

      <main className="p-4 max-w-2xl mx-auto">
        <div className="text-center my-4">
          <Link href="/partner/app-demo" className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg text-sm">
            ← ジャンル選択に戻る
          </Link>
        </div>
        
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 my-4 rounded-lg">
          <p className="font-bold">これは営業用のサンプルページです。</p>
          <p>このように、アプリのリストの間に広告が表示されます。</p>
        </div>

        <div className="space-y-4">
          {sampleApps.slice(0, 3).map((app) => (
            <div key={app.name} className="bg-white p-5 rounded-lg shadow text-center text-blue-600 font-semibold text-lg border border-gray-200">
              {app.name}
            </div>
          ))}

          {/* --- ★★★ サンプル広告スペース ★★★ --- */}
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
      </main>
    </div>
  );
};

export default PartnerGenreDemoPage;