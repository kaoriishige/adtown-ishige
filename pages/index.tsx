import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { getAdminDb } from '../lib/firebase-admin';
import { RiShieldCheckFill, RiHeartPulseFill, RiChatHeartFill, RiRocketFill } from 'react-icons/ri';

// --- 型定義 ---
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
  freeReasonTitle?: string;
  freeReasonDesc?: string;
  premiumTeaserTitle?: string;
  premiumTeaserText?: string;
  premiumTeaserNote?: string;
  finalCtaTitle?: string;
  finalCtaSubtext?: string;
}

interface IndexPageProps {
  data: LandingData;
}

const IndexPage: NextPage<IndexPageProps> = ({ data }) => {
  return (
    <>
      <Head>
        <title>{data.mainTitle || 'みんなの那須アプリ'}</title>
      	<meta name="description" content={data.heroSubheadline} />
    	</Head>

    	<div className="bg-white text-gray-800">
        
        {/* ▼▼▼ このヒーローセクションのデザインのみ、ご指示通りに再修正しました ▼▼▼ */}
    	 <header className="relative bg-blue-800 text-white overflow-hidden">
  <div 
    className="absolute inset-0 z-0 opacity-20"
    style={{
      backgroundColor: '#0052cc',
      backgroundImage: `
        linear-gradient(135deg, rgba(255, 255, 255, 0.1) 25%, transparent 25%),
        linear-gradient(225deg, rgba(255, 255, 255, 0.1) 25%, transparent 25%),
        linear-gradient(45deg, rgba(255, 255, 255, 0.1) 25%, transparent 25%),
        linear-gradient(315deg, rgba(255, 255, 255, 0.1) 25%, transparent 25%)
      `,
      backgroundPosition: '10px 0, 10px 0, 0 0, 0 0',
      backgroundSize: '20px 20px',
    }}
  />
  <Image 
    src="/images/hero-background.jpg"
    alt="背景画像"
    layout="fill"
    objectFit="cover"
    className="absolute inset-0 z-0 opacity-10"
    priority
  />
  <div className="container mx-auto px-6 py-24 md:py-32 relative z-20 text-center">
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold text-white opacity-90">
        {data.mainTitle}
      </h1>
      <p className="mt-2 text-md text-blue-200">
        {data.areaDescription}
      </p>
      <h2 className="mt-6 text-3xl md:text-5xl font-black leading-tight text-white" style={{textShadow: '0 2px 10px rgba(0,0,0,0.3)'}}>
        {data.heroHeadline?.split('\n').map((line, i) => (
          <span key={i} className="block">{line}</span>
        ))}
      </h2>
      <p className="mt-6 text-lg md:text-xl text-blue-200 max-w-2xl mx-auto">
        {data.heroSubheadline}
      </p>
      <div className="mt-10">
        <a 
          href="#cta" 
          className="bg-lime-400 text-black font-bold py-4 px-8 rounded-md shadow-lg transition-all transform hover:scale-105 inline-block max-w-xs w-full"
        >
          LINEでオープン通知を受け取る
        </a>
      </div>
    </div>
  </div>
</header>
  {/* --- YouTube 動画セクション --- */}
<section className="py-16 bg-white">
  <div className="container mx-auto px-6 text-center">
    <div className="relative max-w-4xl mx-auto shadow-lg rounded-lg overflow-hidden" style={{ paddingTop: "56.25%" }}>
      <iframe
        className="absolute top-0 left-0 w-full h-full"
        src="https://www.youtube.com/embed/5gQoF7wODUI"
        title="YouTube video"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
    </div>
  </div>
</section>
        {/* ▲▲▲ 変更はここまでです ▲▲▲ */}

    	  <main>
          {/* --- パートナーセクション --- */}
          <section className="py-16 bg-white border-y">
            <div className="container mx-auto px-6 text-center">
              <h3 className="text-sm tracking-widest text-gray-500 mb-8 font-semibold uppercase">那須地域のパートナー企業・団体様</h3>
              <div className="flex flex-wrap justify-center items-center gap-x-10 md:gap-x-16 gap-y-6">
                  <Image src="/images/partner-ishikawa.png" alt="おまかせオート石川" width={160} height={55} style={{objectFit: "contain"}} />
                  <Image src="/images/partner-midcity.png" alt="那須ミッドシティホテル" width={160} height={55} style={{objectFit: "contain"}} />
                  <Image src="/images/partner-dairin.png" alt="オートギャラリーダイリン" width={160} height={55} style={{objectFit: "contain"}} />
                  <Image src="/images/partner-akimoto.png" alt="株式会社パン・アキモト" width={160} height={55} style={{objectFit: "contain"}} />
              {/* ▼ ここから追加分 ▼ */}
      <Image src="/images/partner-sakakibara.png" alt="榊原会館" width={160} height={55} style={{objectFit: "contain"}} />
      <Image src="/images/partner-serusio-ru.png" alt="株式会社セルシオール" width={160} height={55} style={{objectFit: "contain"}} />
      {/* ▲ 追加ここまで ▲ */}
              </div>
            </div>
          </section>

          {/* --- 機能紹介セクション --- */}
          <section className="py-20 bg-gray-50">
            <div className="container mx-auto px-6 text-center">
              <div className="max-w-3xl mx-auto mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800">アプリの主な機能</h2>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200">
                  <div className="p-4 bg-red-100 inline-block rounded-full mb-4">
                    <RiHeartPulseFill className="text-3xl text-red-600" />
                  </div>
                  <h3 className="font-bold text-xl mb-2 text-gray-900">{data.solutionBenefit1_Title}</h3>
                  <p className="text-gray-600">{data.solutionBenefit1_Desc}</p>
                </div>
                <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200">
                  <div className="p-4 bg-blue-100 inline-block rounded-full mb-4">
                    <RiShieldCheckFill className="text-3xl text-blue-600" />
                  </div>
                  <h3 className="font-bold text-xl mb-2 text-gray-900">{data.solutionBenefit2_Title}</h3>
                  <p className="text-gray-600">{data.solutionBenefit2_Desc}</p>
                </div>
                <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200">
                  <div className="p-4 bg-green-100 inline-block rounded-full mb-4">
                    <RiChatHeartFill className="text-3xl text-green-600" />
                  </div>
                  <h3 className="font-bold text-xl mb-2 text-gray-900">{data.solutionBenefit3_Title}</h3>
                  <p className="text-gray-600">{data.solutionBenefit3_Desc}</p>
                </div>
              </div>
            </div>
          </section>

    	    {/* --- なぜ無料なのか --- */}
    	    <section className="py-20 bg-white">
    	      <div className="container mx-auto px-6 text-center max-w-3xl">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800">{data.freeReasonTitle}</h2>
              <p className="mt-4 text-gray-600 leading-relaxed">{data.freeReasonDesc}</p>
    	      </div>
    	    </section>

          {/* --- プレミアムプラン予告セクション --- */}
          <section className="py-20 bg-blue-600 text-white">
            <div className="container mx-auto px-6 text-center">
              <div className="max-w-3xl mx-auto">
                <RiRocketFill className="text-5xl text-white mb-4 mx-auto" />
                <h2 className="text-3xl font-bold">{data.premiumTeaserTitle}</h2>
                <p className="mt-4 text-xl md:text-2xl font-semibold">
                  {data.premiumTeaserText?.split('\n').map((line, i) => <span key={i} className="block">{line}</span>)}
                </p>
                 <p className="mt-4 text-sm text-blue-200">{data.premiumTeaserNote}</p>
              </div>
            </div>
          </section>

    	    {/* --- 最後のCTA --- */}
    	    <section id="cta" className="bg-gray-800 text-white">
    	      <div className="container mx-auto px-6 py-20 text-center">
    	        <div className="max-w-2xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold">{data.finalCtaTitle}</h2>
    	          <p className="mt-4 text-gray-300">{data.finalCtaSubtext}</p>
    	          <div className="mt-8">
                  <a href="https://lin.ee/rFvws11" target="_blank" rel="noopener noreferrer" className="bg-blue-600 text-white font-bold text-lg py-4 px-10 rounded-full shadow-lg transition-transform transform hover:scale-105 inline-block">
    	              LINEでオープン通知を受け取る
    	            </a>
                </div>
              </div>
    	      </div>
    	    </section>
    	  </main>

    	  {/* --- フッター --- */}
    	  <footer className="bg-gray-900 text-gray-400 text-sm">
    	    <div className="container mx-auto py-10 px-6 text-center space-y-3">
    	      <Link href="/legal" className="hover:text-white">特定商取引法に基づく表記</Link>
    	      <p>みんなの那須アプリ運営 | 株式会社adtown</p>
    	      <p>〒329-2711 栃木県那須塩原市石林698-35 | TEL:0287-39-7577</p>
    	    </div>
    	  </footer>
    	</div>
    </>
  );
};

// --- サーバーサイドでのデータ取得 ---
export const getServerSideProps: GetServerSideProps = async () => {
  try {
    const adminDb = getAdminDb();
    const docRef = adminDb.collection('settings').doc('landingV3');
    const docSnap = await docRef.get();
    
    const fallbackData: LandingData = {
      mainTitle: "みんなの那須アプリ「地域お守り無料プラン」",
      areaDescription: "那須塩原市、大田原市、那須町の地域専用アプリ",
      heroHeadline: "那須の暮らしが、もっと便利に、もっとお得に。\n約50個のアプリが永久無料で使い放題！",
      heroSubheadline: "休日当番医からAIお悩み相談まで。あなたのスマホが、那須地域最強の「お守り」に変わります。",
      solutionBenefit1_Title: "もしもの時の、家族の安心に",
      solutionBenefit1_Desc: "休日夜間診療所を瞬時に検索。災害時の避難行動をAIがシミュレーション。暮らしの緊急事態に、もう焦りません。",
      solutionBenefit2_Title: "忙しい毎日の、時間とお金を節約",
      solutionBenefit2_Desc: "AIが献立を提案し、買い忘れも防止。ペットの迷子や里親募集情報も充実しています。",
      solutionBenefit3_Title: "ちょっと疲れた、あなたの心に",
      solutionBenefit3_Desc: "愚痴聞き地蔵AIや共感チャットAIが、24時間あなたの心に寄り添います。毎朝届く「褒め言葉シャワー」で一日を元気に。",
      freeReasonTitle: "なぜ、これだけの機能がずっと無料なのですか？",
      freeReasonDesc: "このアプリは、地域の企業様からの広告協賛によって運営されています。私たちは、那須地域に住むすべての方に、安全と便利を提供することが地域貢献だと考えています。だから、あなたに「地域お守り無料プラン」の利用料を請求することは一切ありません。安心して、ずっと使い続けてください。",
      premiumTeaserTitle: "さらに、もっとお得に。",
      premiumTeaserText: "年間93,000円＋αの損を「得」に変える\nプレミアムプランも要確認!!",
      premiumTeaserNote: "※プレミアムプランの詳細はアプリ内でご案内します。まずは「地域お守り無料プラン」で、アプリの便利さをご体験ください。",
      finalCtaTitle: "さあ、那須の暮らしをアップデートしよう。",
      finalCtaSubtext: "オープン告知はLINE公式アカウントでお知らせします。今すぐ登録して、最新情報や限定特典を手に入れよう！",
    };
    
    const dbData = docSnap.exists ? docSnap.data() as LandingData : {};
  	const finalData = { ...fallbackData, ...dbData };

  	return {
  	  props: {
  	    data: JSON.parse(JSON.stringify(finalData))
  	  }
  	};
  } catch (error) {
  	console.error("Landing page data fetch error:", error);
  	return { props: { data: {} as LandingData } };
  }
};

export default IndexPage;