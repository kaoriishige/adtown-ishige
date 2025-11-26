import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import React from 'react';
import { adminDb } from '../lib/firebase-admin';

import {
  RiShieldCheckFill,
  RiHeartPulseFill,
  RiChatHeartFill,
  RiShoppingCartLine,
  RiHandHeartLine,
  RiBriefcase4Line,
  RiCoupon3Line,
  RiLightbulbFlashLine,
  RiParentLine,
  RiBuilding4Line,
  RiShareFill,
  RiRocketFill,
  RiStarSmileFill,
  RiMoneyCnyCircleFill,
} from 'react-icons/ri';

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

interface IndexPageProps {
  data: LandingData;
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
const IndexPage: NextPage<IndexPageProps> = ({ data }) => {
  // アイコンは要素ではなくコンポーネントで定義して map で使う
  const freePlanIcons = [
    RiHeartPulseFill,
    RiShoppingCartLine,
    RiLightbulbFlashLine,
    RiParentLine,
    RiChatHeartFill,
    RiBuilding4Line,
    RiBriefcase4Line,
  ];

  const premiumPlanIcons = [
    RiCoupon3Line,
    RiShoppingCartLine,
    RiHandHeartLine,
    RiChatHeartFill,
    RiRocketFill,
    RiShareFill,
  ];

  return (
    <>
      <Head>
        <title>{`${data.mainTitle || 'みんなの那須アプリ'} | 公式`}</title>
        <meta
          name="description"
          content={
            data.heroSubheadline?.replace('\n', ' ') ||
            '那須地域の暮らしを、もっと便利に、もっとお得に。'
          }
        />
      </Head>

      <div className="bg-white text-gray-800">
        {/* Hero */}
        <header className="relative bg-pink-50 text-pink-900 overflow-hidden">
          <div className="absolute inset-0 z-0 opacity-10 -z-10">
            {/* next/image with fill requires a parent with position relative; here we use a decorative background */}
            <Image
              src="/images/hero-background.png"
              alt="背景画像"
              fill
              className="object-cover"
            />
          </div>

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
                  <span key={i} className="block">
                    {line}
                  </span>
                ))}
              </h2>

              {/* サブヘッドラインも改行に対応 */}
              <div className="mt-6 text-lg md:text-xl text-pink-700 max-w-2xl mx-auto">
                {data.heroSubheadline?.split('\n').map((line, i) => (
                  <span key={i} className="block">
                    {line}
                  </span>
                ))}
              </div>

              <div className="mt-10">
                <Link href="/users/signup" passHref legacyBehavior>
                  <a className="bg-pink-500 text-white font-bold py-4 px-8 rounded-md shadow-lg transition-all transform hover:scale-105 hover:bg-pink-600 inline-block max-w-xs w-full">
                    {/* ★ 修正 ★ */}
                    無料で登録する
                  </a>
                </Link>
                <p className="text-sm text-pink-600 mt-4">
                  {data.finalCtaSubtext}
                </p>
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
                className="relative max-w-4xl mx-auto shadow-lg rounded-lg overflow-hidden"
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
              <div className="mt-8 flex flex-wrap justify-center items-center gap-x-8 gap-y-6 opacity-80">
                {[
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
                ].map((logoPath, index) => (
                  <div key={index} className="p-2">
                    <Image
                      src={logoPath}
                      alt={`パートナーロゴ ${index + 1}`}
                      width={150}
                      height={50}
                      className="object-contain"
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
                  アプリの主な機能
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {/* 1 */}
                <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200 text-left">
                  <div className="p-4 bg-pink-100 inline-block rounded-full mb-4">
                    <RiHeartPulseFill className="text-3xl text-pink-600" />
                  </div>
                  <h3 className="font-bold text-xl mb-3 text-gray-900">
                    {data.solutionBenefit1_Title}
                  </h3>
                  <div className="text-gray-600 space-y-2">
                    <SafeHTML html={data.solutionBenefit1_Desc} />
                  </div>
                </div>

                {/* 2 */}
                <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200 text-left">
                  <div className="p-4 bg-pink-100 inline-block rounded-full mb-4">
                    <RiShieldCheckFill className="text-3xl text-pink-600" />
                  </div>
                  <h3 className="font-bold text-xl mb-3 text-gray-900">
                    {data.solutionBenefit2_Title}
                  </h3>
                  <div className="text-gray-600 space-y-2">
                    <SafeHTML html={data.solutionBenefit2_Desc} />
                  </div>
                </div>

                {/* 3 */}
                <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200 text-left">
                  <div className="p-4 bg-pink-100 inline-block rounded-full mb-4">
                    <RiChatHeartFill className="text-3xl text-pink-600" />
                  </div>
                  <h3 className="font-bold text-xl mb-3 text-gray-900">
                    {data.solutionBenefit3_Title}
                  </h3>
                  <div className="text-gray-600 space-y-2">
                    <SafeHTML html={data.solutionBenefit3_Desc} />
                  </div>
                </div>

                {/* 4 */}
                <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200 text-left">
                  <div className="p-4 bg-pink-100 inline-block rounded-full mb-4">
                    <RiMoneyCnyCircleFill className="text-3xl text-pink-600" />
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
                      className="flex items-center space-x-3 bg-gray-50 p-4 rounded-lg"
                    >
                      <span className="text-2xl">
                        <Icon className="text-pink-500" />
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

          {/* Premium Plan */}
          <section className="py-20 bg-pink-700 text-white">
            <div className="container mx-auto px-6 text-center">
              <div className="max-w-3xl mx-auto">
                <RiStarSmileFill className="text-5xl text-yellow-300 mb-6 mx-auto" />
                <h2
                  className="text-3xl md:text-5xl font-black text-yellow-300"
                  style={{ textShadow: '0 2px 5px rgba(0,0,0,0.3)' }}
                >
                  {data.premiumPlanHeadline}
                </h2>
                <div className="mt-6 text-lg text-pink-100 leading-relaxed">
                  <SafeHTML html={data.premiumPlanDesc} />
                </div>

                <div className="bg-white text-gray-800 rounded-xl shadow-2xl p-8 md:p-10 my-10 text-left">
                  <h3 className="text-2xl md:text-3xl font-bold text-center text-pink-800 mb-8">
                    {data.premiumPlanTitle}
                  </h3>

                  <div className="space-y-6">
                    {data.premiumPlanFeatures?.map((feature, index) => {
                      const Icon =
                        premiumPlanIcons[index % premiumPlanIcons.length];
                      return (
                        <div key={index} className="flex items-start space-x-4">
                          <span className="text-3xl p-3 bg-pink-700 text-white rounded-full mt-1 inline-flex items-center justify-center">
                            <Icon />
                          </span>
                          <div>
                            <h4 className="font-bold text-lg text-gray-900">
                              {feature.title}
                            </h4>
                            <p className="text-gray-600">{feature.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-8 text-center text-pink-100 max-w-xl mx-auto">
                  <div className="text-xl font-semibold">
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

          {/* CTA */}
          <section id="cta" className="bg-pink-900 text-white">
            <div className="container mx-auto px-6 py-20 text-center">
              <div className="max-w-2xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold">
                  {data.finalCtaTitle?.split('\n').map((line, i) => (
                    <span key={i} className="block">
                      {line}
                    </span>
                  ))}
                </h2>
                <p className="mt-4 text-pink-200">{data.finalCtaSubtext}</p>
                <div className="mt-8">
                  <Link href="/users/signup" passHref legacyBehavior>
                    <a className="bg-white text-pink-700 font-bold text-lg py-4 px-10 rounded-md shadow-lg transition-transform transform hover:scale-105 hover:bg-pink-50 inline-block">
                      {/* ★ 修正 ★ */}
                      無料で登録する
                    </a>
                  </Link>
                  <p className="mt-4 text-sm text-pink-300">
                    {data.finalTagline1}
                    <br />
                    {data.finalTagline2}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="bg-gray-900 text-gray-400 text-sm">
          <div className="container mx-auto py-10 px-6 text-center space-y-3">
            <Link href="/legal" legacyBehavior>
              <a className="hover:text-white">特定商取引法に基づく表記</a>
            </Link>
            <p>みんなの那須アプリ運営 | 株式会社adtown</p>
            <p>
              〒329-2711 栃木県那須塩原市石林698-35 | TEL:0287-39-7577
            </p>
          </div>
        </footer>
      </div>
    </>
  );
};

// -------------------------
// Server-side data (エラー回避のためHTML文字列を調整)
// -------------------------
export const getServerSideProps: GetServerSideProps = async () => {
  // フォールバックデータ
  const fallbackData: LandingData = {
    //
    // ▼▼▼▼▼ ここからが「伝え方が9割」反映箇所です ▼▼▼▼▼
    //
    mainTitle: 'みんなの那須アプリ',
    areaDescription:
      '那須塩原市・大田原市・那須町在住の、忙しい「あなた」のための地域密着アプリです。',

    // 【最強のコンセプト：サプライズ法とギャップ法】
    heroHeadline: '那須の「探しもの」に費やす\n\n**年間50時間**を、無料でもらっていいんです。', // 強烈なメリット（時間）を提示
    heroSubheadline:
      '「探す」負担から「届く」安心へ。\nもう、大事な家族の健康や地域の情報で悩まなくて大丈夫。\n**無料登録で、不安の7割を解消**します。', // 不安解消を強調

    // 【相手のメリット：不安、時間、共感、お金】を主婦目線で表現
    solutionBenefit1_Title: '1. 家族の「もしも」の時、パニックにならない安心（命のお守り）',
    solutionBenefit1_Desc: `
      <ul class="list-disc list-inside space-y-1">
        <li>夜間/休日診療、すぐに見つかる**ワンタップ検索**</li>
        <li>水・鍵・生活トラブルの緊急業者へ即連絡</li>
        <li>災害時にあなたと家族を守る**避難アドバイス**</li>
        <li>迷子ペットの地域保護情報</li>
      </ul>
      <p class="mt-3 font-semibold text-pink-700">「どうしよう！」を「大丈夫！」に変える**時間と心の余裕**をお届けします。</p>
    `,

    solutionBenefit2_Title: '2. 毎日の献立・家事の「考える負担」をAIに丸投げ（時間のお守り）',
    solutionBenefit2_Desc: `
      <ul class="list-disc list-inside space-y-1">
        <li>**今日の献立**をAIが提案、栄養バランスも自動計算</li>
        <li>スーパー**最安値**を店ごとに一目で比較（時間の節約）</li>
        <li>ドラッグストアの価格比較で**ムダ遣いをSTOP**</li>
        <li>子育て・家事・引越し手続きなど「面倒な調べもの」はAIに聞くだけ</li>
      </ul>
      <p class="mt-3 font-semibold text-pink-700">「やらなきゃ」のプレッシャーから解放され、**あなたの自由な時間**が増えます。</p>
    `,

    solutionBenefit3_Title: '3. 誰にも言えない悩みを「ただ聞いてくれる」AI（共感のお守り）',
    solutionBenefit3_Desc: `
      <ul class="list-disc list-inside space-y-1">
        <li>深夜でも使える**「愚痴聞き地蔵」**：ただ、あなたの話を聞きます</li>
        <li>「そうそう、わかるよ」と**共感してくれる**チャットAI</li>
        <li>人間関係・夫婦・育児の悩み相談：**誰も傷つかない**秘密の相談相手</li>
        <li>朝、あなたを**褒めてくれる**言葉をくれるAI</li>
      </ul>
      <p class="mt-3 font-semibold text-pink-700">あなたの気持ちに寄り添い、**「私だけ」の心ケア**を。</p>
    `,

    solutionBenefit4_Title: '4. 知らないと損をする、地域のお得とつながり（お金/承認のお守り）',
    solutionBenefit4_Desc: `
      <ul class="list-disc list-inside space-y-1">
        <li>地域の**求人マッチングAI** (無料)：子育ての合間に働きたいを叶える</li>
        <li>フードロス激安情報：**家計にやさしい**お宝情報が届く</li>
        <li>店舗マッチングAI (無料)：今すぐ行けるお店の**穴場情報**</li>
        <li>地域フリマ・助け合い(※有料)：**誰かの役に立つ喜び**と**ちょっとした収入**</li>
      </ul>
      <p class="mt-3 font-semibold text-pink-700">家計の不安を減らし、地域の**「ありがとう」**で心が満たされます。</p>
    `,

    freePlanTitle: '【地域の不安ゼロへ：永遠に無料プラン】',
    freePlanSubTitle: '登録料、年会費、一切不要。メールアドレスだけで今すぐスタート。',
    freePlanFeatures: [
      '緊急時の病院・生活トラブル情報',
      'スーパー・ドラッグストア最安値比較',
      '献立AI/買い物リストAI',
      '子育て・家事・引越し AI相談',
      '心の相談AI(ライト版)・愚痴聞き地蔵',
      '地域の求人マッチング (無料)',
      '地域の店舗情報 (無料)',
    ],
    // クライマックス法：「あなたにとって最も大切」を強調
    freePlanConclusion:
      '→ 那須での生活の「困った」はもう終わり。\n**まずは無料で、今日の不安を解消**しましょう。',

    // 【ギャップ法・お金のメリット】
    premiumPlanHeadline:
      '**年間93,000円のムダ**を、**月480円の投資**で防ぎませんか？',
    premiumPlanDesc:
      '那須で暮らす主婦の方々が、「知らなかった」せいで失っている**年間93,000円以上の節約チャンス**があります。<br class="my-2">それは、情報が散らばっていて「調べるのが面倒」な仕組みのせい。**ムダな出費を減らす**のは、あなたの努力ではなく、アプリの役割です。',

    premiumPlanTitle:
      '【月480円プレミアプラン】「時間とお金と心」を守る**最強のお守りパック**',
    premiumPlanFeatures: [
      {
        title: '**地域の人気クーポン**使い放題',
        desc: '外食・美容・日用品が大幅割引。月々数千円の節約は確実です。',
      },
      {
        title: '地域フリマで「出品」OK（副収入）',
        desc: '家にある不要品が、**そのまま数万円の臨時収入**に変わります。',
      },
      {
        title: 'ご近所助け合い「依頼投稿」OK',
        desc: '「ちょっとした手伝い」をお願いして、**家事の負荷を減らし**、心にゆとりを。',
      },
      {
        title: '深い悩み専門の**カウンセラーAI**',
        desc: '育児・夫婦関係など、**誰にも言えない深い悩み**に寄り添います。',
      },
      {
        title: 'あなた専用の**プレミアム節約AI**',
        desc: '家計簿からあなただけの節約プランを作成。**年間節約額を最大化**。',
      },
      {
        title: '紹介報酬システム (継続収入)',
        desc: 'お友達を紹介すると**毎月20%が継続収入**に。3人紹介で実質無料に。',
      },
    ],
    premiumPlanConclusion:
      '月480円は**「出費」**ではなく、<br><strong>「那須での生活を格段にラクにする</strong>ための**賢い投資」</strong>です。',

    // 【感謝、チームワーク化】
    freeReasonTitle: 'なぜ、これだけの機能を「無料」で提供できるのですか？',
    freeReasonDesc:
      'みんなの那須アプリは、地域の企業様が「那須に住むあなた」を想い、広告協賛という形で**応援してくださっている**からです。<br class="my-2">**だから、無料プランはこれからもずっと無料。**<br>地域全体で、あなたとご家族の暮らしを支えたいという**「感謝」の気持ち**で運営しています。',

    // 最後のCTA（行動喚起）もトップのコピーと連動させる（反復法）
    finalCtaTitle: '**今日の不安**を、\n**無料**で**安心**に変えませんか？',
    finalCtaSubtext: '● メールアドレスだけで30秒 ● 解約はいつでもワンタップ',
    finalTagline1: 'もう、情報探しで時間をムダにしないでください。',
    finalTagline2: '那須の暮らしを、もっとやさしく、もっと豊かに。',
  };

  try {
    if (typeof adminDb !== 'object' || adminDb === null) {
      throw new Error(
        "adminDb is not properly initialized (it's null or not an object)"
      );
    }

    const docRef = adminDb.collection('settings').doc('landingV3');
    const docSnap = await docRef.get();

    const dbData = docSnap.exists
      ? (docSnap.data() as LandingData)
      : ({} as LandingData);

    const finalData = { ...fallbackData, ...dbData } as LandingData;

    return {
      props: {
        data: JSON.parse(JSON.stringify(finalData)),
      },
    };
  } catch (error) {
    console.error('🔴 Landing page data fetch error:', error);
    return {
      props: {
        data: JSON.parse(JSON.stringify(fallbackData)),
      },
    };
  }
};

export default IndexPage;