
import { Sparkles, CheckCircle, Gift, LineChart } from 'lucide-react';

export default function LandingV2() {
  return (
    <div className="bg-white text-gray-800">
      <section className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white py-20 px-6 text-center">
        <h1 className="text-4xl font-bold mb-4">みんなの那須アプリ</h1>
        <h1 className="text-3xl font-bold mb-4">毎日の悩みが、1日たった30円で全部解決。</h1>
        <p className="text-lg mb-4">特売・運勢・診断・節約・人間関係・健康・地域情報…全部入り</p>
        <p className="text-xl text-yellow-300 font-semibold mb-4">初回7日間無料＋初月480円キャンペーン中！</p>
        <a
          href="https://lin.ee/FmAmixwS"
          className="inline-block bg-yellow-400 text-black font-bold py-3 px-8 rounded-full shadow hover:bg-yellow-300 transition text-lg"
        >
          今すぐ無料で始める
        </a>
      </section>
      <section className="bg-white py-12 text-center">
        <p className="text-sm text-gray-500">みんなの那須アプリ運営｜株式会社adtown</p>
        <p className="text-sm text-gray-500">〒329-2711 栃木県那須塩原市石林698-35｜TEL:0287-39-7577</p>
        <div className="mt-4">
          <a href="https://lin.ee/xFbam0U" target="_blank" rel="noopener noreferrer">
            <img
              src="https://scdn.line-apps.com/n/line_add_friends/btn/ja.png"
              alt="友だち追加"
              height="36"
              style={{ border: 0 }}
            />
          </a>
        </div>
      </section>
    </div>
  );
}
