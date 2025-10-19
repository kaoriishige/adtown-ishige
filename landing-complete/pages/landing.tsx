import Head from 'next/head';

export default function LandingPage() {
  return (
    <>
      <Head>
        <title>{"みんなの那須アプリ｜予告ランディング"}</title>
      </Head>
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 min-h-screen text-white text-center px-6 py-12">
        <p className="text-xl text-red-300 font-bold">緊急予告!!</p>
        <h1 className="text-5xl font-bold my-4">みんなの那須アプリ</h1>
        <p className="text-xl font-bold mb-2">まもなくスタート予定</p>
        <p className="text-xl font-bold text-white">🎉 まずは7日間無料でお試し使い放題！</p>
        <p className="text-base mt-4 max-w-xl mx-auto">
          特売情報・今日の運勢・相性診断・地域情報アプリ、あなたに役立つ55選、ぜんぶ入り使い放題！
        </p>

        <div className="mt-10 space-y-2 text-base max-w-lg mx-auto bg-white/10 p-6 rounded-lg">
          <p>このアプリ55個があれば、毎日が便利に！</p>
          <p>使用料もお得満載で、無料と一緒、いや儲かる!!</p>
          <ul className="text-left space-y-1">
            <li>● 初回7日間は完全無料使い放題！</li>
            <li>● 初月はたったの480円キャンペーン中!!</li>
            <li>● 2ヶ月目からは月額980円（自動更新）</li>
            <li>● 一日たったの30円でお得満載！</li>
            <li>● フードロス激安情報やスーパー特売情報もスマホで簡単チェック</li>
            <li>● 家族みんなで使える、全年齢対応アプリ</li>
          </ul>
        </div>

        <div className="mt-12 text-base max-w-lg mx-auto bg-white/10 p-6 rounded-lg space-y-1">
          <h2 className="font-bold text-lg">【紹介制度】</h2>
          <p>8月末までアプリ紹介で紹介手数料30%の継続をゲット！</p>
          <p>あなたがSNS、LINE、直接紹介等で登録・継続した方がいれば、毎月紹介手数料が振り込まれます。</p>
          <p>なんと、3人以上紹介すれば、あなたのアプリ利用料はずっと無料に！</p>
          <p>例：100人紹介で毎月約30,000円の紹介手数料</p>
          <p>※9月から初めて紹介した方は紹介手数料20%</p>
        </div>

        <div className="mt-12 text-base max-w-lg mx-auto bg-white/10 p-6 rounded-lg space-y-1">
          <h2 className="font-bold text-lg">【使用手順】</h2>
          <ol className="text-left space-y-1 list-decimal list-inside">
            <li>「無料で始める」ボタンをタップ</li>
            <li>メール登録、決済でアカウント作成</li>
            <li>第1段階（無料期間7日）が開始</li>
            <li>7日後に自動的に480円の月額に</li>
            <li>その後は月980円で継続 → いつでもキャンセル可能！継続の義務なし！</li>
          </ol>
        </div>

        <div className="mt-12 text-base max-w-lg mx-auto bg-white/10 p-6 rounded-lg space-y-1">
          <h2 className="font-bold text-lg">【ピックアップアプリ一覧】</h2>
          <ul className="text-left space-y-1">
            <li>● 今日の運勢アプリ</li>
            <li>● 個性心理学診断</li>
            <li>● 相性診断ツール</li>
            <li>● スーパー特売情報アプリ</li>
            <li>● フードロス激安現品情報</li>
            <li>● 地域フリマアプリ</li>
            <li>● 健康チェックアプリ</li>
            <li>● ペット情報アプリ</li>
            <li>...etc (55個ピックアップ)</li>
          </ul>
        </div>

        <div className="mt-12 text-base max-w-lg mx-auto bg-white/10 p-6 rounded-lg space-y-1">
          <h2 className="font-bold text-lg">【一言PR】</h2>
          <p>年代を問わず、誰にでも「使える」、「役立つ」アプリを組み合わせた月額プラン。</p>
          <p>「お得情報」も「地域情報」も「エンタメ情報」もまとめて使い放題。</p>
        </div>

        <div className="mt-12 text-base max-w-lg mx-auto bg-white/10 p-6 rounded-lg">
          <h2 className="font-bold text-lg mb-2">LINE登録で、みんなの那須アプリのスタートをご連絡します。</h2>
          <p>・誰よりも早くチャレンジできる!!</p>
          <p>・紹介手数料30%GET!!</p>
          <p>・お得や最新情報の配信!!</p>
          <div className="mt-4">
            <a href="https://lin.ee/xFbam0U" target="_blank" rel="noopener noreferrer">
              <img src="https://scdn.line-apps.com/n/line_add_friends/btn/ja.png" alt="友だち追加" height="36" className="mx-auto border-0" />
            </a>
            <p className="text-sm text-gray-200 mt-2">※ボタンをタップしてLINE登録</p>
          </div>
        </div>

        <footer className="mt-12 text-sm text-gray-300 leading-relaxed">
          <p>みんなの那須アプリ運営</p>
          <p>株式会社adtown</p>
          <p>〒329-2711 栃木県那須塩原市石林698-35</p>
          <p>TEL:0287-39-7577</p>
        </footer>
      </div>
    </>
  );
}
