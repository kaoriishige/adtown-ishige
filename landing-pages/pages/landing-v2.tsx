import { Sparkles, CheckCircle, Gift, LineChart } from 'lucide-react';

export default function LandingV2() {
  return (
    <div className="bg-gradient-to-r from-blue-100 via-white to-purple-100 text-gray-800">
      <section className="py-14 px-6 text-center">
        <h1 className="text-4xl font-bold mb-4 text-blue-700">みんなの那須アプリ</h1>
        <h1 className="text-3xl font-bold mb-4">毎日の悩みが、1日たった30円で全部解決。</h1>
        <p className="text-lg mb-4">特売・運勢・診断・節約・人間関係・健康・地域情報…全部入り</p>
        <p className="text-xl text-red-600 font-semibold mb-4">初回7日間無料＋初月480円キャンペーン中！</p>
        <a
          href="https://lin.ee/xFbam0U"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-blue-600 text-white font-bold py-3 px-8 rounded-full shadow hover:bg-blue-700 transition text-lg"
        >
          今すぐ無料で始める
        </a>
      </section>
    </div>
  );
}