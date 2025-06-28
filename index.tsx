// pages/landing-v2.tsx
'use client';


import { Sparkles, CheckCircle, Gift, LineChart } from 'lucide-react';


export default function LandingV2() {
  return (
    <div className="bg-white text-gray-800">
      <section className="bg-white py-12 px-6 text-center">
        <h1 className="text-4xl font-bold mb-4 text-blue-700">みんなの那須アプリ</h1>
        <h1 className="text-3xl font-bold mb-4">毎日の悩みが、1日たった30円で全部解決。</h1>
        <p className="text-lg mb-4">特売・運勢・診断・節約・人間関係・健康・地域情報…全部入り</p>
        <p className="text-xl text-red-600 font-semibold mb-4">初回7日間無料＋初月480円キャンペーン中！</p>
        <a
          href="#register"
          className="inline-block bg-blue-600 text-white font-bold py-3 px-8 rounded-full shadow hover:bg-blue-700 transition text-lg"
        >
          今すぐ無料で始める
        </a>
      </section>


      <section className="py-14 px-6 text-center bg-white">
        <h2 className="text-2xl font-bold mb-6 flex items-center justify-center gap-2">
          <Sparkles className="w-6 h-6 text-purple-600" /> こんなお悩み、ありませんか？
        </h2>
        <ul className="max-w-xl mx-auto text-left space-y-3 text-lg">
          <li>💬 毎日がマンネリで、ちょっと刺激や癒しがほしい</li>
          <li>📱 スマホばかり見て時間を無駄にしている気がする</li>
          <li>👛 節約や特売情報を見逃したくない</li>
          <li>🧑‍⚕️ 健康や人間関係に小さな悩みがある</li>
          <li>🎯 自分に合った情報が毎日ほしい</li>
        </ul>
      </section>


      <section className="bg-gray-50 py-16 px-6">
        <h2 className="text-2xl font-bold text-center mb-8">これだけの価値が、月額980円。</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto text-lg text-gray-800">
          <div className="flex items-start gap-3">
            <CheckCircle className="text-green-500 w-6 h-6" /> 初回7日間は完全無料
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="text-green-500 w-6 h-6" /> 初月は480円でキャンペーン中
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="text-green-500 w-6 h-6" /> 月額980円で55個のアプリが使い放題
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="text-green-500 w-6 h-6" /> フードロス・運勢・健康・子育て・地域まで網羅
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="text-green-500 w-6 h-6" /> 家族で使える全年齢対応
          </div>
        </div>
        <p className="text-center text-sm mt-8 text-gray-500">
          ※いつでもキャンセル可能。継続の義務なし。
        </p>
      </section>


      <section className="bg-green-50 py-16 px-6 text-center" id="register">
        <h2 className="text-2xl font-bold mb-6 flex items-center justify-center gap-2">
          <LineChart className="w-6 h-6 text-green-700" /> 紹介制度で“実質無料”どころか、副収入に！
        </h2>
        <div className="text-lg space-y-2 text-gray-800 max-w-2xl mx-auto">
          <p>🎉 <strong>8月末</strong>までに紹介した方には → <span className="text-red-600 font-bold">紹介報酬【30％】ずっと継続!!</span></p>
          <p>🗓 <strong>9月から初めて紹介</strong>した方は → <span className="text-blue-600 font-bold">紹介報酬【20％】</span></p>
        </div>
        <ul className="text-lg space-y-2 text-gray-800 mt-6 mb-6">
          <li>🎯 1人紹介 → 月294円</li>
          <li>💸 4人紹介 → 実質無料（980円カバー）</li>
          <li>💼 10人紹介 → 約月30,000円の副収入</li>
        </ul>
        <p className="text-sm text-gray-600">※ 紹介報酬は、紹介された方が980円で継続課金した場合の計算です。</p>
      </section>


      <section className="bg-blue-100 py-16 px-6 text-center">
        <h2 className="text-xl font-bold mb-4 flex justify-center items-center gap-2">
          <Gift className="w-5 h-5 text-blue-500" /> 先行登録キャンペーン 実施中！
        </h2>
        <a href="https://lin.ee/7GKI01W" target="_blank" rel="noopener noreferrer">
          <img
            src="https://scdn.line-apps.com/n/line_add_friends/btn/ja.png"
            alt="友だち追加"
            height="36"
            style={{ border: 0 }}
            className="mx-auto"
          />
        </a>
        <p className="text-sm text-gray-500 mt-4">※ボタンをタップしてLINE登録！</p>
      </section>


      <footer className="bg-gray-100 text-center py-6 text-sm text-gray-600 leading-relaxed">
        みんなの那須アプリ<br />
        株式会社adtown<br />
        〒329-2711 栃木県那須塩原市石林698-35<br />
        TEL:0287-39-7577
      </footer>
    </div>
  );
}
