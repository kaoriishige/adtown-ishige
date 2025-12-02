import React, { useEffect } from 'react';
import {
  ShieldCheck,
  HeartPulse,
  ShoppingCart,
  Briefcase,
  Ticket,
  Lightbulb,
  Users,
  Building2,
  Rocket,
  Star,
  Coins,
  Sparkles,
  Smile,
  Clock,
  Zap,
  Gift,
  Crown,
  Infinity,
  HeartHandshake
} from 'lucide-react';

// -------------------------
// Type definitions
// -------------------------
interface LandingData {
  mainTitle?: string;
  areaDescription?: string;
  heroHeadline?: string;
  heroSubheadline?: string;
  solutionBenefit1_Title?: string;
  solutionBenefit1_Desc?: string;
  solutionBenefit2_Title?: string;
  solutionBenefit2_Desc?: string;
  solutionBenefit3_Title?: string;
  solutionBenefit3_Desc?: string;
  solutionBenefit4_Title?: string;
  solutionBenefit4_Desc?: string;
  freePlanTitle?: string;
  freePlanSubTitle?: string;
  freePlanFeatures?: string[];
  freePlanConclusion?: string;
  premiumPlanHeadline?: string;
  premiumPlanDesc?: string;
  premiumPlanTitle?: string;
  premiumPlanFeatures?: { title: string; desc: string }[];
  premiumPlanConclusion?: string;
  freeReasonTitle?: string;
  freeReasonDesc?: string;
  finalCtaTitle?: string;
  finalCtaSubtext?: string;
  finalTagline1?: string;
  finalTagline2?: string;
}

// -------------------------
// Helper: safeHTML
// -------------------------
const SafeHTML: React.FC<{ html?: string }> = ({ html }) => (
  <div dangerouslySetInnerHTML={{ __html: html || '' }} />
);

// -------------------------
// Page component
// -------------------------
const IndexPage = () => {
  // タイトル設定
  useEffect(() => {
    document.title = "みんなの那須アプリ | 公式";
  }, []);

  // データ定義
  const data: LandingData = {
    mainTitle: 'みんなの那須アプリ',
    areaDescription: '那須塩原・大田原・那須町のママたちへ。地域密着型の暮らし応援アプリ。',

    heroHeadline: '【完全無料】\n毎日がんばるあなたへ。\nその貴重な時間、\n**“探して・比べて・悩むこと”に使いますか？**',
    heroSubheadline: '献立も、お買い得情報も、困った時の相談も。\nこれからは全部、アプリに頼ってください。\n**登録はたったの30秒。ずっと0円で使い放題です。**',

    // ベネフィット
    solutionBenefit1_Title: '1. 「今日の献立、どうしよう...」\nその悩み、0円で解決します。',
    solutionBenefit1_Desc: `
      <ul class="list-disc list-inside space-y-1">
        <li>**冷蔵庫在庫管理**：食材を無駄にしない。これだけで食費が浮きます。</li>
        <li>**AI献立ナビ**：在庫からプロのレシピを自動提案。あなたは選ぶだけ。</li>
        <li>**生活の裏技AI**：頑固な汚れも収納も、AIに聞けば3秒で解決。</li>
      </ul>
      <p class="mt-3 font-semibold text-pink-700">毎日の「名もなき家事」をAIにお任せ。**無料で、あなたの自由時間を取り戻します。**</p>
    `,

    solutionBenefit2_Title: '2. 知っている人だけが得をする。\n地域の「お得」を無料でゲット。',
    solutionBenefit2_Desc: `
      <ul class="list-disc list-inside space-y-1">
        <li>**スーパー・ドラッグストアチラシ**：地域の特売情報をスマホで一括チェック。</li>
        <li>**地域防災情報**：いざという時の避難所・ハザードマップを網羅。</li>
        <li>**子育て支援ナビ**：申請しないともらえない助成金情報もキャッチ。</li>
      </ul>
      <p class="mt-3 font-semibold text-pink-700">情報は「家計の味方」です。**タダで手に入る「安心」と「節約」**を、みすみす逃すのはもったいないですよね。</p>
    `,

    solutionBenefit3_Title: '3. 「私ばっかり大変...」\nそんな時は、AIに吐き出してください。',
    solutionBenefit3_Desc: `
      <ul class="list-disc list-inside space-y-1">
        <li>**朝の褒め言葉AI**：「今日もえらい！」誰よりもあなたを肯定してくれます。</li>
        <li>**AI手相鑑定**：カメラで撮るだけ。「那須の母」が優しく背中を押します。</li>
        <li>**気分ログ・診断**：モヤモヤした気持ちを整理して、心を軽く。</li>
      </ul>
      <p class="mt-3 font-semibold text-pink-700">家族にも友達にも言えない悩み、AIなら24時間いつでも聞いてくれます。**カウンセリング代わりなのに、もちろん無料です。**</p>
    `,

    solutionBenefit4_Title: '4. 那須での暮らしが、\nもっと楽しく、もっと大好きになる。',
    solutionBenefit4_Desc: `
      <ul class="list-disc list-inside space-y-1">
        <li>**引越し手続きAI**：面倒な役所手続きリストを一瞬で作成。</li>
        <li>**AIファッション診断**：手持ちの服で「今日のコーデ」が決まる。</li>
        <li>**ご当地クイズ**：家族みんなで楽しめる、地元の話題作り。</li>
      </ul>
      <p class="mt-3 font-semibold text-pink-700">日常の「ちょっと困った」も「ちょっと楽しい」も。**那須での生活に必要なもの、全部無料で詰め込みました。**</p>
    `,

    // フリープラン
    freePlanTitle: '【信じられないかもしれませんが】\nこれら全部、**一生無料**です。',
    freePlanSubTitle: '「あとで課金されるんじゃ...」そんな心配は無用です。基本機能はずっと0円でお使いいただけます。',
    freePlanFeatures: [
      '📸 AI手相鑑定 (本格プロンプト搭載)',
      '🍳 冷蔵庫管理＆AI献立提案',
      '🛒 地域スーパー・ドラッグストアチラシ',
      '🌞 朝の褒め言葉AI＆性格診断',
      '👶 育児記録＆子育て支援情報',
      '👗 AIファッション診断',
      '🏠 引越し手続きナビ＆防災情報',
    ],
    freePlanConclusion:
      '→ **無料で使い倒すのが、賢い那須ライフの正解です。\n登録しない理由が、見つかりません。**',

    // 有料プラン
    premiumPlanHeadline:
      '**さらに上を目指す方へ**\n月480円で「もっと豊かな時間」を買う。',
    premiumPlanDesc:
      '無料プランでも十分すぎるほど便利ですが、プレミアムプランなら**制限なしで全機能を開放**。アプリを「最強のパートナー」に進化させます。（※現在は準備中）',

    premiumPlanTitle:
      '【月480円プレミアム】那須ライフを極める',
    // 項目定義（紹介システムは保持）
    premiumPlanFeatures: [
      {
        title: '店舗マッチングAI',
        desc: 'あなたの好みを学習し、隠れた名店や穴場スポットを自動提案します。',
      },
      {
        title: '求人マッチングAI',
        desc: '条件に合う「本当に働きたい職場」をAIが探し出し、通知します。',
      },
      {
        title: '地域フリマ出品・購入',
        desc: '地元での手渡し取引なら送料0円。不用品がすぐにお金に変わります。',
      },
      {
        title: 'ご近所助け合い掲示板',
        desc: '「ちょっと手伝って」を投稿したり、誰かを助けて報酬を得たり。',
      },
      {
        title: '限定クーポン使い放題',
        desc: 'プレミアム会員だけの高割引率クーポン。月額以上の元はすぐ取れます。',
      },
      {
        title: 'プレミアムAIカウンセラー',
        desc: 'より深く、専門的な悩み相談が可能に。24時間あなたに寄り添います。',
      },
      {
        title: '高度な家計簿・節約AI',
        desc: 'レシート読み込みから節約プランの提案まで、お金の管理を自動化。',
      },
      {
        title: '優先サポート＆広告非表示',
        desc: 'ストレスフリーな操作感と、困った時の優先対応をお約束します。',
      },
      {
        title: '会員限定イベント参加権',
        desc: '那須地域の限定イベントやセミナーへの招待が届きます。',
      },
      {
        title: '紹介報酬システム', // ★維持
        desc: 'お友達を紹介すると報酬GET。使えば使うほど得する仕組みです。',
      },
      {
        title: '新機能の先行利用権',
        desc: '今後追加される便利な機能を、誰よりも早く体験できます。',
      },
      {
        title: 'データ保存容量アップ',
        desc: '写真や記録の保存容量が無制限に。思い出をずっと残せます。',
      }
    ],
    premiumPlanConclusion:
      'まずは無料で始めて、**必要になったら**検討してください。',

    freeReasonTitle: '**「どうして無料なの？」**\n**怪しくないですか？**',
    freeReasonDesc:
      'ご安心ください。これは地域の企業様が**「那須に住むあなたを応援したい」**という想いでスポンサーになってくれているからです。<br class="my-2">**だから、あなたは遠慮なく、堂々と無料で使い倒してください。**<br>あなたが便利に暮らすことが、地域の元気につながるのです。',

    finalCtaTitle: '**迷う必要はありません。**\nだって、**完全無料**なんですから。',
    finalCtaSubtext: '● 無料で使い放題 ● 解約も自由',
    finalTagline1: 'このボタンを押すだけで、',
    finalTagline2: 'あなたの毎日は、もっとやさしく、もっと楽になります。',
  };

  // アイコン定義
  const freePlanIcons = [
    Sparkles,   // 手相
    ShoppingCart, // チラシ
    HeartPulse,   // 健康・BMI
    Smile, // 褒め言葉・気分
    Lightbulb, // 裏技
    Rocket,   // 引越し・効率化
    Users, // 育児
  ];

  // 有料プラン用アイコン
  const premiumPlanIcons = [
    Building2, // 店舗
    Briefcase, // 求人
    ShoppingCart, // フリマ
    HeartHandshake, // 助け合い
    Ticket,   // クーポン
    HeartPulse,   // カウンセラー
    Coins, // 家計簿
    Zap, // スピード・広告なし
    Gift,   // イベント
    Crown, // 報酬
    Star,   // 先行利用
    Infinity // 容量
  ];

  // パートナー企業ロゴリスト
  const partnerLogos = [
    '/images/partner-adtown.png',
    '/images/partner-aquas.png',
    '/images/partner-celsiall.png',
    '/images/partner-dairin.png',
    '/images/partner-kanon.png',
    '/images/partner-kokoro.png',
    '/images/partner-meithu.png',
    '/images/partner-midcityhotel.png',
    '/images/partner-omakaseauto.png',
    '/images/partner-poppo.png',
    '/images/partner-sekiguchi02.png',
    '/images/partner-training_farm.png',
    '/images/partner-transunet.png',
    '/images/partner-koharu.png',
    '/images/partner-yamakiya.png',
  ];

  return (
    <div className="bg-white text-gray-800 font-sans">
      {/* Hero Section */}
      <header className="relative bg-gradient-to-br from-pink-50 via-white to-pink-100 text-pink-900 overflow-hidden">
        <div className="container mx-auto px-6 py-24 md:py-32 relative z-20 text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-2xl md:text-3xl font-bold text-pink-800 opacity-90">
              {data.mainTitle}
            </h1>
            <p className="mt-2 text-md text-pink-600">
              {data.areaDescription}
            </p>

            <h2
              className="mt-6 text-3xl md:text-5xl font-black leading-tight text-pink-900"
              style={{ textShadow: '0 1px 2px rgba(255,255,255,0.5)' }}
            >
              {data.heroHeadline?.split('\n').map((line, i) => (
                <span key={i} className="block" dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<span>$1</span>') }} />
              ))}
            </h2>

            <div className="mt-6 text-lg md:text-xl text-pink-700 max-w-2xl mx-auto">
              {data.heroSubheadline?.split('\n').map((line, i) => (
                <span key={i} className="block" dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<span class="font-bold text-pink-900">$1</span>') }} />
              ))}
            </div>

            {/* Hero CTA: LINE Only (アカウント作成削除済) */}
            <div className="mt-10 flex flex-col items-center space-y-6">
              <div className="flex flex-col items-center space-y-3">
                {/* テキストから「1.」を削除し、単一選択肢として強調 */}
                <p className="text-xl font-black text-pink-800 bg-yellow-100 px-6 py-2 rounded-full border border-yellow-300 shadow-md">
                  最速3秒！LINEで友だち追加
                </p>
                {/* LINEボタン */}
                <a href="https://lin.ee/N4x90pv" target="_blank" rel="noopener noreferrer" className="inline-block transition-transform transform hover:scale-105">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="https://scdn.line-apps.com/n/line_add_friends/btn/ja.png" alt="LINE 友だち追加" height="42" className="h-14 w-auto shadow-xl" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* Intro */}
        <section className="text-center py-16 bg-white border-b">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl font-bold text-gray-800">
              おかげさまで株式会社adtown20周年、感謝企画
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              みんなの那須アプリを開発しましたので、下記をご覧の上ご利用ください。
            </p>
          </div>
        </section>

        {/* YouTube */}
        <section className="py-16 bg-pink-50">
          <div className="container mx-auto px-6 text-center">
            <div
              className="relative max-w-4xl mx-auto shadow-lg rounded-lg overflow-hidden bg-gray-200"
              style={{ paddingTop: '56.25%' }}
            >
              <iframe
                className="absolute top-0 left-0 w-full h-full"
                src="https://www.youtube.com/embed/JRNx77WfEBU"
                title="YouTube video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </section>

        {/* Partner logos */}
        <section className="py-16 bg-white border-y">
          <div className="container mx-auto px-6 text-center">
            <h3 className="text-sm tracking-widest text-gray-500 mb-8 font-semibold uppercase">
              那須地域のパートナー企業・店舗様
            </h3>
            <div className="mt-8 flex flex-wrap justify-center items-center gap-x-8 gap-y-6 opacity-90">
              {partnerLogos.map((logoPath, index) => (
                <div key={index} className="p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logoPath}
                    alt={`パートナーロゴ ${index + 1}`}
                    width={150}
                    height={50}
                    className="object-contain max-h-12 w-auto"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 bg-pink-50">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl mx-auto mb-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
                アプリの主な機能（すべて無料）
              </h2>
              <p className="mt-2 text-pink-600 font-bold">これら全部、追加料金なしで使い放題です。アプリはどんどん増えていきます!!</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* 1 */}
              <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200 text-left transform hover:-translate-y-1 transition-transform">
                <div className="p-4 bg-pink-100 inline-block rounded-full mb-4">
                  <Clock className="w-8 h-8 text-pink-600" />
                </div>
                <h3 className="font-bold text-xl mb-3 text-gray-900">
                  {data.solutionBenefit1_Title}
                </h3>
                <div className="text-gray-600 space-y-2">
                  <SafeHTML html={data.solutionBenefit1_Desc} />
                </div>
              </div>

              {/* 2 */}
              <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200 text-left transform hover:-translate-y-1 transition-transform">
                <div className="p-4 bg-pink-100 inline-block rounded-full mb-4">
                  <Coins className="w-8 h-8 text-pink-600" />
                </div>
                <h3 className="font-bold text-xl mb-3 text-gray-900">
                  {data.solutionBenefit2_Title}
                </h3>
                <div className="text-gray-600 space-y-2">
                  <SafeHTML html={data.solutionBenefit2_Desc} />
                </div>
              </div>

              {/* 3 */}
              <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200 text-left transform hover:-translate-y-1 transition-transform">
                <div className="p-4 bg-pink-100 inline-block rounded-full mb-4">
                  <HeartPulse className="w-8 h-8 text-pink-600" />
                </div>
                <h3 className="font-bold text-xl mb-3 text-gray-900">
                  {data.solutionBenefit3_Title}
                </h3>
                <div className="text-gray-600 space-y-2">
                  <SafeHTML html={data.solutionBenefit3_Desc} />
                </div>
              </div>

              {/* 4 */}
              <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200 text-left transform hover:-translate-y-1 transition-transform">
                <div className="p-4 bg-pink-100 inline-block rounded-full mb-4">
                  <ShieldCheck className="w-8 h-8 text-pink-600" />
                </div>
                <h3 className="font-bold text-xl mb-3 text-gray-900">
                  {data.solutionBenefit4_Title}
                </h3>
                <div className="text-gray-600 space-y-2">
                  <SafeHTML html={data.solutionBenefit4_Desc} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Free Plan */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-6 max-w-4xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
                {data.freePlanTitle}
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                {data.freePlanSubTitle}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.freePlanFeatures?.map((feature, index) => {
                const Icon = freePlanIcons[index % freePlanIcons.length];
                return (
                  <div
                    key={index}
                    className="flex items-center space-x-3 bg-gray-50 p-4 rounded-lg border border-gray-100"
                  >
                    <span className="text-2xl">
                      <Icon className="text-pink-500 w-6 h-6" />
                    </span>
                    <span className="font-semibold text-gray-700">
                      {feature}
                    </span>
                  </div>
                );
              })}
            </div>

            <p className="mt-10 text-center text-xl font-bold text-pink-700">
              {data.freePlanConclusion}
            </p>
          </div>
        </section>

        {/* Premium Plan (機能充実版) */}
        <section className="py-20 bg-gray-100 text-gray-800">
          <div className="container mx-auto px-6 text-center">
            <div className="max-w-5xl mx-auto">
              <Star className="w-12 h-12 text-yellow-500 mb-6 mx-auto fill-current" />
              <h2 className="text-3xl md:text-4xl font-black text-gray-800">
                {data.premiumPlanHeadline}
              </h2>
              <div className="mt-6 text-lg text-gray-600 leading-relaxed">
                <SafeHTML html={data.premiumPlanDesc} />
              </div>

              <div className="bg-white text-gray-800 rounded-xl shadow-md p-8 md:p-10 my-10 text-left border border-gray-200">
                <h3 className="text-2xl md:text-3xl font-bold text-center text-gray-800 mb-8">
                  {data.premiumPlanTitle}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {data.premiumPlanFeatures?.map((feature, index) => {
                    const Icon =
                      premiumPlanIcons[index % premiumPlanIcons.length];
                    return (
                      <div key={index} className="flex items-start space-x-4 p-2">
                        <span className="text-3xl p-3 bg-yellow-100 text-yellow-600 rounded-full mt-1 inline-flex items-center justify-center flex-shrink-0">
                          <Icon className="w-6 h-6" />
                        </span>
                        <div>
                          <h4 className="font-bold text-lg text-gray-900">
                            {feature.title}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">{feature.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-8 text-center text-gray-600 max-w-xl mx-auto">
                <div className="text-lg font-semibold">
                  <SafeHTML html={data.premiumPlanConclusion} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Reason Free */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-6 text-center max-w-3xl">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
              {data.freeReasonTitle}
            </h2>
            <div className="mt-6 text-gray-600 leading-relaxed text-lg">
              <SafeHTML html={data.freeReasonDesc} />
            </div>
          </div>
        </section>

        {/* CTA (LINEのみ) */}
        <section id="cta" className="bg-pink-900 text-white">
          <div className="container mx-auto px-6 py-20 text-center">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold">
                {data.finalCtaTitle?.split('\n').map((line, i) => (
                  <span key={i} className="block" dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<span>$1</span>') }} />
                ))}
              </h2>
              <p className="mt-4 text-pink-200">{data.finalCtaSubtext}</p>
              
              {/* LINE Button Only */}
              <div className="mt-10 flex flex-col items-center justify-center space-y-6">
                
                <div className="flex flex-col items-center space-y-2">
                  <p className="text-lg font-bold text-pink-100">
                    最速！LINEで友だち追加
                  </p>
                  <a href="https://lin.ee/N4x90pv" target="_blank" rel="noopener noreferrer" className="inline-block transition-transform transform hover:scale-105">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="https://scdn.line-apps.com/n/line_add_friends/btn/ja.png" alt="LINE 友だち追加" height="42" className="h-14 w-auto shadow-xl" />
                  </a>
                </div>

                {/* Deleted "OR" and "Account Create" buttons here */}

              </div>

              {/* Tagline below buttons */}
              <div className="mt-10 text-pink-300 text-sm md:text-base">
                 <p>{data.finalTagline1}</p>
                 <p>{data.finalTagline2}</p>
              </div>

            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 text-sm">
        <div className="container mx-auto py-10 px-6 text-center space-y-3">
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/legal" className="hover:text-white">
            特定商取引法に基づく表記
          </a>
          <p>みんなの那須アプリ運営 | 株式会社adtown</p>
          <p>
            〒329-2711 栃木県那須塩原市石林698-35 | TEL:0287-39-7577
          </p>
        </div>
      </footer>
    </div>
  );
};

export default IndexPage;