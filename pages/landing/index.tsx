// pages/landing.tsx
import Head from 'next/head';


export default function LandingPage() {
  return (
    <>
      <Head>
        <title>みんなの那須アプリ｜予告ランディング</title>
      </Head>
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 min-h-screen text-white text-center px-6 py-12">
        {/* ファーストビュー */}
        <p className="text-xl text-yellow-300 font-bold">緊急予告!!</p>
        <h1 className="text-5xl font-extrabold my-4 text-white drop-shadow">みんなの那須アプリ</h1>
        <p className="text-xl font-semibold mb-2 text-pink-200">まもなくスタート予定</p>
        <p className="text-xl font-bold text-white">🎉 まずは7日間無料でお試し使い放題！</p>
        <p className="text-base mt-4 max-w-xl mx-auto text-white/90">
          特売情報・今日の運勢・相性診断・地域情報アプリ、あなたに役立つ55選、ぜんぶ入り使い放題！
        </p>


        {/* サブコピー */}
        <div className="mt-10 space-y-3 text-base max-w-lg mx-auto bg-white text-gray-800 p-6 rounded-xl shadow-md">
          <p className="font-bold text-lg text-blue-800">このアプリ55個があれば、毎日が便利に！</p>
          <p className="text-sm">使用料もお得満載で、無料と一緒、いや儲かる!!</p>
          <ul className="text-left text-sm space-y-1 list-disc list-inside">
            <li>初回7日間は完全無料使い放題！</li>
            <li>初月はたったの480円キャンペーン中!!</li>
            <li>2ヶ月目からは月額980円（自動更新）</li>
            <li>1日たったの約30円で全55アプリ使い放題！</li>
            <li>フードロス激安・スーパー特売もスマホで簡単チェック</li>
            <li>全年齢対応・家族みんなで使える</li>
          </ul>
        </div>


        {/* 紹介制度 */}
        <div className="mt-12 text-base max-w-lg mx-auto bg-pink-100 text-pink-800 p-6 rounded-xl shadow-md">
          <h2 className="font-bold text-lg mb-2">🎁 紹介制度</h2>
          <p>8月末まで紹介手数料【30%】が永続！</p>
          <p>SNSやLINEで紹介 → 相手が継続すれば毎月あなたに報酬</p>
          <p>例：100人紹介で約月30,000円の手数料が自動で入金</p>
          <p className="text-sm text-red-700 mt-2">※9月以降は20%に変更予定！今だけ特別!!</p>
        </div>


        {/* 使用手順 */}
        <div className="mt-12 text-base max-w-lg mx-auto bg-yellow-100 text-yellow-900 p-6 rounded-xl shadow-md">
          <h2 className="font-bold text-lg mb-2">📝 使用手順</h2>
          <ol className="text-left list-decimal list-inside space-y-1 text-sm">
            <li>「無料で始める」ボタンをタップ</li>
            <li>メール登録・決済 → アカウント作成</li>
            <li>7日間の無料期間スタート</li>
            <li>その後480円 → 2ヶ月目以降は980円（自動）</li>
            <li>いつでもキャンセルOK！リスクなし！</li>
          </ol>
        </div>


        {/* ピックアップアプリ */}
        <div className="mt-12 text-base max-w-lg mx-auto bg-green-100 text-green-900 p-6 rounded-xl shadow-md">
          <h2 className="font-bold text-lg mb-2">🌟 ピックアップアプリ例</h2>
          <ul className="text-left text-sm space-y-1 list-disc list-inside">
            <li>今日の運勢アプリ</li>
            <li>個性心理学診断</li>
            <li>相性診断ツール</li>
            <li>スーパー特売情報</li>
            <li>フードロス激安情報</li>
            <li>地域フリマ・健康チェック・ペット情報</li>
          </ul>
          <p className="text-sm mt-2">...他にも55個のアプリが使い放題！</p>
        </div>


        {/* 一言PR */}
        <div className="mt-12 text-base max-w-lg mx-auto bg-blue-100 text-blue-900 p-6 rounded-xl shadow-md">
          <h2 className="font-bold text-lg mb-2">📣 一言PR</h2>
          <p>誰でも・どの年代でも「使える」「役立つ」</p>
          <p>地域・節約・診断・AIなどすべて入りの神アプリ。</p>
        </div>


        {/* LINE登録 */}
        <div className="mt-12 text-base max-w-lg mx-auto bg-white p-6 rounded-xl shadow-md text-gray-800">
          <h2 className="font-bold text-lg mb-2 text-center">📲 LINE登録でお知らせをGET！</h2>
          <p className="text-sm text-center">・スタート通知 / 紹介リンク / 最新情報 すべて届く！</p>
          <div className="mt-4 text-center">
            <a href="https://lin.ee/xFbam0U" target="_blank" rel="noopener noreferrer">
              <img
                src="https://scdn.line-apps.com/n/line_add_friends/btn/ja.png"
                alt="友だち追加"
                height="36"
                className="mx-auto border-0"
              />
            </a>
            <p className="text-xs mt-2 text-center text-gray-500">※LINEボタンを押して友達追加</p>
          </div>
        </div>


        {/* フッター */}
        <footer className="mt-16 text-sm text-white/80 leading-relaxed">
          <p>みんなの那須アプリ運営｜株式会社adtown</p>
          <p>〒329-2711 栃木県那須塩原市石林698-35</p>
          <p>TEL: 0287-39-7577</p>
        </footer>
      </div>
    </>
  );
}



