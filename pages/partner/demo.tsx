import { NextPage } from 'next';
import Link from 'next/link';

// --- ★★★ サンプルデータ ★★★ ---
const sampleUser = {
  email: 'sample-user@example.com',
};

const sampleRewards = {
  total: 12345,
  pending: 3456,
};

// ナビゲーションリンクの配列（デモ用）
const navigationLinks = [
  { href: '/partner/app-demo', text: 'アプリページはこちら' },
  { href: '#', text: '報酬受取口座を登録・編集する' },
  { href: '#', text: '紹介用URLとQRコード' },
  { href: '#', text: 'お問い合わせ' },
];

// ページコンポーネント
const PartnerDemoPage: NextPage = () => {

  const activeButtonStyle = "w-full max-w-lg p-4 mb-4 text-lg font-bold text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 transition-colors";
  const inactiveButtonStyle = "w-full max-w-lg p-4 mb-4 text-lg font-bold text-white bg-gray-400 rounded-lg shadow-md cursor-not-allowed";

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-grow">
        <div className="p-5 text-center my-10 relative">
          <div className="absolute top-0 right-4 bg-yellow-300 text-yellow-800 font-bold px-4 py-2 rounded-full shadow-lg">
            これはデモページです
          </div>
          <h1 className="text-3xl font-bold mb-4 mt-12">マイページ（サンプル）</h1>
          <p className="mb-8">ようこそ、{sampleUser.email}さん</p>

          <div className="max-w-2xl mx-auto bg-green-100 border border-green-300 text-green-800 p-6 my-8 rounded-lg text-left shadow">
            <h2 className="text-2xl font-bold mb-4 text-green-900">あなたの紹介報酬 💰</h2>
            <div className="space-y-2 text-lg">
              <div className="flex justify-between">
                <span className="font-semibold">累計報酬額:</span>
                <span className="font-bold">{sampleRewards.total.toLocaleString()} 円</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">未払い報酬額:</span>
                <span className="font-bold text-red-600">{sampleRewards.pending.toLocaleString()} 円</span>
              </div>
            </div>
            <p className="text-xs mt-4 text-gray-600">※未払い報酬額が3,000円以上になると、翌月15日にご登録の口座へ自動で振り込まれます。</p>
          </div>
          
          <div className="flex flex-col items-center">
            {navigationLinks.map((link) => (
              link.href !== '#' ? (
                <Link key={link.text} href={link.href} className={activeButtonStyle}>
                  {link.text}
                </Link>
              ) : (
                <div key={link.text} className={inactiveButtonStyle}>
                  {link.text}
                </div>
              )
            ))}
            
            <div className="max-w-2xl bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-6 my-8 rounded-lg text-left">
              <h2 className="text-2xl font-bold mb-4 text-yellow-800">紹介制度で“実質無料”どころか、副収入に！</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>8月末までに紹介した方には → 紹介報酬[30%]ずっと継続!!</li>
                <li>9月より初めて紹介された方は→紹介報酬[20%]</li>
              </ul>
            </div>

            <div className="mt-8 text-center">
              <p className="text-gray-600 mb-4">このページは営業用のサンプルです。</p>
              <Link href="/partner/signup" className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg">
                パートナー登録はこちら
              </Link>
            </div>
          </div>
        </div>
      </main>
      <footer className="text-center text-xs text-gray-500 py-4 border-t">
        <Link href="/legal" className="hover:underline">特定商取引法に基づく表記</Link>
        <p className="mt-1">© 2025 株式会社adtown</p>
      </footer>
    </div>
  );
};

export default PartnerDemoPage;