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
        <title>{`${data.mainTitle || 'みんなの那Ssuアプリ'} | 公式`}</title>
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
            <p>〒329-2711 栃木県那須塩原市石林698-35 | TEL:0287-39-7577</p>
          </div>
        </footer>
      </div>
    </>
  );
};

// -------------------------
// Server-side data
// -------------------------
export const getServerSideProps: GetServerSideProps = async () => {
  // フォールバックデータ
  const fallbackData: LandingData = {
    //
    // ▼▼▼▼▼ ここからがコンセプト反映箇所です ▼▼▼▼▼
    //
    mainTitle: 'みんなの那須アプリ',
    areaDescription:
      '那須塩原市・大田原市・那須町に住むあなたのための、地域専用アプリです。',

    // 【最強のコンセプト】
    // 1. 顧客のインサイト（探しづらい、面倒、不安）を明記
    // 2. 「無料」をファーストビューで強力に訴求
    // 3. 「変革話法」でベネフィット（探す→届く）を提示
    heroHeadline: '那須地域の「情報が探しづらい」を、\n無料でゼロに。',
    heroSubheadline:
      '「探す」暮らしから「届く」暮らしへ。\nこのアプリひとつで、生活の不安の7割が消える安心を、まずはお届けします。',

    //
    // ▲▲▲▲▲ ここまでがコンセプト反映箇所です ▲▲▲▲▲
    //

    solutionBenefit1_Title: '1. もしもの時の、家族の安心に(命のお守り)',
    solutionBenefit1_Desc: `
      <ul class="list-disc list-inside space-y-1">
        <li>休日夜間診療をワンタップで検索</li>
        <li>水まわり・鍵・生活トラブルの緊急サポート</li>
        <li>災害時の避難アドバイス</li>
        <li>ペット迷子・保護情報</li>
      </ul>
      <p class="mt-3 font-semibold text-gray-700">家族の“命の不安”に備える安心機能です。</p>
    `,

    solutionBenefit2_Title: '2. 忙しい毎日の、時間とお金を節約(暮らしのお守り)',
    solutionBenefit2_Desc: `
      <ul class="list-disc list-inside space-y-1">
        <li>今日の献立をAIが提案</li>
        <li>スーパー価格.com (店ごとの最安値が一目で)</li>
        <li>ドラッグストアの価格比較</li>
        <li>買い忘れ防止AI</li>
        <li>服装コーデAI</li>
        <li>子育て便利AI・引越し手続きAI</li>
      </ul>
      <p class="mt-3 font-semibold text-gray-700">“考える負担”と“探す手間”を丸ごとAIに。</p>
    `,

    solutionBenefit3_Title: '3. 心が少し疲れた時の、寄り添いAI(心のお守り)',
    solutionBenefit3_Desc: `
      <ul class="list-disc list-inside space-y-1">
        <li>愚痴聞き地蔵AI</li>
        <li>共感チャットAI</li>
        <li>深夜でも使える心ケア</li>
        <li>朝の褒め言葉AI</li>
        <li>人間関係・夫婦・育児の悩み相談AI</li>
      </ul>
      <p class="mt-3 font-semibold text-gray-700">あなたの気持ちに寄り添うAIカウンセラー。</p>
    `,

    solutionBenefit4_Title: '4. 地域のお得情報・仕事・つながり(お金のお守り)',
    solutionBenefit4_Desc: `
      <ul class="list-disc list-inside space-y-1">
        <li>求人マッチングAI (無料)</li>
        <li>店舗マッチングAI (無料)</li>
        <li>地域のお店のクーポン(※有料)</li>
        <li>地域フリマ(購入無料、出品は有料)</li>
        <li>ご近所助け合い (閲覧無料、依頼投稿は有料)</li>
        <li>フードロス激安情報</li>
      </ul>
      <p class="mt-3 font-semibold text-gray-700">家計を守り、地域のつながりを増やすサービス。</p>
    `,

    freePlanTitle: '【地域お守り“無料プラン”】',
    freePlanSubTitle: 'ずっと無料。登録だけで使い放題。',
    freePlanFeatures: [
      '休日夜間診療',
      'スーパー・ドラッグストア最安値',
      '献立AI/買い忘れAI',
      '子育て・家事AI',
      '心の相談AI(ライト版)',
      '店舗マッチングAI(無料)',
      '求人マッチングAI(無料)',
    ],
    // 無料プランの結論を、トップのコピー（7割の不安が消える）と重複しないよう変更
    freePlanConclusion:
      '→ まずは無料プランで、那須の暮らしが“ラク”になる体験を。',

    premiumPlanHeadline:
      '年間93,000円+ を、知らないうちに損してませんか?',
    premiumPlanDesc: `
      那須に住む主婦の
      “買い物・外食・日用品・急な出費”による
      年間のムダは93,000円以上と言われています。
      <br class="my-2">
      でも、それはあなたのせいではありません。
      安い店・お得な情報が
      “探しづらい仕組み”だからです。
    `,
    premiumPlanTitle:
      '【月480円プレミアムプラン】女性が本当にラクになる安心パック',
    premiumPlanFeatures: [
      {
        title: '地域クーポン使い放題',
        desc: '外食・美容・整体・買い物で月1,000~5,000円節約。',
      },
      {
        title: 'フリマ出品OK(購入のみ無料)',
        desc: '不要品が月2,000~20,000円の収入に。',
      },
      {
        title: '助け合い(お手伝い)依頼投稿OK',
        desc: '家事の負荷を軽減。時間が増える。心に余裕が生まれる。',
      },
      {
        title: '深い悩み相談AI(カウンセラーAI)',
        desc: '育児・夫婦・精神的にしんどい時に寄り添う。',
      },
      {
        title: 'プレミアム節約AI',
        desc: 'あなた専用の節約シミュレーション。月3,000~7,000円の節約が可能。',
      },
      {
        title: '紹介すると20%が毎月入り続ける',
        desc: '480円紹介→ 毎月96円が継続収入。紹介3人で→480円プラン代が実質無料。',
      },
    ],
    premiumPlanConclusion: `
      月480円は「出費」ではありません。
      <br>
      <strong>“あなたと家族の生活がラクになる投資”です。</strong>
    `,

    freeReasonTitle: '安心の運営体制',
    freeReasonDesc: `
      みんなの那須アプリは
      <br>
      地域の企業様からの広告協賛で運営されています。
      <br class="my-2">
      <strong>だから、
      無料プランはずっと無料。</strong>
      <br>
      必要な人だけ有料プランに進めばOK。
    `,

    // 最後のCTA（行動喚起）もトップのコピーと連動させる
    finalCtaTitle: '那須の「探しづらい」を、\n今すぐ“無料”で解決しませんか？',
    finalCtaSubtext: '● メールアドレスだけで30秒 ● 解約はいつでもワンタップ',
    finalTagline1: '那須の暮らしを、もっと安心で、もっとやさしく。',
    finalTagline2: 'あなたと家族のための「地域お守りアプリ」。',
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