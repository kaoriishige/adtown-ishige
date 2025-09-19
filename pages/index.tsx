import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { getAdminDb } from '../lib/firebase-admin';
import { RiShieldCheckFill, RiHeartPulseFill, RiChatHeartFill, RiCheckboxCircleFill } from 'react-icons/ri';

// --- 型定義 ---
interface LandingData {
  heroHeadline?: string;
  heroSubheadline?: string;
  problemTitle?: string;
  problemPoints?: string[];
  solutionBenefit1_Category?: string;
  solutionBenefit1_Title?: string;
  solutionBenefit1_Desc?: string;
  solutionBenefit2_Category?: string;
  solutionBenefit2_Title?: string;
  solutionBenefit2_Desc?: string;
  freeReasonTitle?: string;
  freeReasonDesc?: string;
  finalCtaTitle?: string;
  finalCtaSubtext?: string;
  // 使わなくなったものも、後方互換性のために残しておきます
  mainTitle?: string;
  areaDescription?: string;
}

interface IndexPageProps {
  data: LandingData;
}

const IndexPage: NextPage<IndexPageProps> = ({ data }) => {
  return (
    <>
      <Head>
        <title>みんなの那須アプリ｜那須の暮らしを、もっと便利に、もっとお得に。</title>
      	<meta name="description" content="休日当番医からお得なクーポン、AI相談まで。那須塩原市、大田原市、那須町の地域専用アプリ「みんなの那須アプリ」まもなく登場！" />
    	</Head>

    	<div className="bg-white text-gray-700">
    	  
    	  {/* --- ヒーローセクション --- */}
    	  <header className="bg-gray-50">
          <div className="container mx-auto px-6 py-16 md:py-24 text-center">
            <h1 className="text-4xl md:text-5xl font-black text-gray-800 leading-tight">
              {data.heroHeadline?.split('\n').map((line, i) => <span key={i} className="block">{line}</span>)}
            </h1>
            <p className="mt-4 text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              {data.heroSubheadline}
            </p>
            <div className="mt-8">
              <a href="#cta" className="bg-orange-500 text-white font-bold text-lg py-4 px-10 rounded-full shadow-lg transition-transform transform hover:scale-105 inline-block">
    	          まもなくオープン！LINEで先行情報を受け取る
    	        </a>
            </div>
            <div className="mt-12 px-4">
              <div className="bg-white rounded-lg shadow-2xl p-4 inline-block">
                <Image 
                  src="/images/app-hero-mockup.png"
                  alt="みんなの那須アプリの画面イメージ" 
                  width={1000} 
                  height={750}
                  objectFit="contain"
                  className="rounded-md"
                  priority
                />
              </div>
            </div>
          </div>
        </header>

    	  <main>
    	    {/* --- お悩みセクション --- */}
    	    <section className="py-20 bg-white">
    	      <div className="container mx-auto px-6 text-center">
    	        <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
                {data.problemTitle}
            </h2>
    	        <div className="mt-8 max-w-2xl mx-auto text-left space-y-4">
              {data.problemPoints?.map((point, index) => (
                <div key={index} className="flex items-start">
                  <RiCheckboxCircleFill className="text-green-500 text-2xl mr-3 mt-1 flex-shrink-0" />
                  <span>{point}</span>
                </div>
              ))}
            </div>
    	      </div>
    	    </section>

          {/* --- 機能紹介セクション --- */}
          <section className="py-20 bg-gray-50">
            <div className="container mx-auto px-6">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800">那須の毎日が、もっと安心・便利になる機能</h2>
              </div>
              {/* 機能1 */}
              <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 mb-16">
                <div className="w-full md:w-1/2">
                  <div className="bg-white rounded-lg shadow-xl p-3">
                    <Image src="/images/feature-1.png" alt="機能1" width={800} height={600} className="rounded-md" />
                  </div>
                </div>
                <div className="w-full md:w-1/2">
                  <span className="font-bold text-blue-600">{data.solutionBenefit1_Category}</span>
                  <h3 className="text-2xl font-bold text-gray-800 mt-2 mb-4">{data.solutionBenefit1_Title}</h3>
                  <p className="text-gray-600">{data.solutionBenefit1_Desc}</p>
                </div>
              </div>
              {/* 機能2 */}
              <div className="flex flex-col md:flex-row-reverse items-center gap-8 md:gap-12">
                <div className="w-full md:w-1/2">
                  <div className="bg-white rounded-lg shadow-xl p-3">
                    <Image src="/images/feature-2.png" alt="機能2" width={800} height={600} className="rounded-md" />
                  </div>
                </div>
                <div className="w-full md:w-1/2">
                  <span className="font-bold text-blue-600">{data.solutionBenefit2_Category}</span>
                  <h3 className="text-2xl font-bold text-gray-800 mt-2 mb-4">{data.solutionBenefit2_Title}</h3>
                  <p className="text-gray-600">{data.solutionBenefit2_Desc}</p>
                </div>
              </div>
            </div>
          </section>

    	    {/* --- なぜ無料なのか --- */}
    	    <section className="py-20 bg-white">
    	      <div className="container mx-auto px-6 text-center">
    	        <h2 className="text-3xl md:text-4xl font-bold text-gray-800">{data.freeReasonTitle}</h2>
    	        <div className="mt-4 text-gray-600 leading-relaxed max-w-3xl mx-auto space-y-4"
                  dangerouslySetInnerHTML={{ __html: data.freeReasonDesc?.replace(/\n/g, '<br />') ?? '' }}
                />
    	      </div>
    	    </section>

    	    {/* --- 最後のCTA --- */}
    	    <section id="cta" className="bg-blue-700 text-white">
    	      <div className="container mx-auto px-6 py-20 text-center">
    	        <h2 className="text-3xl md:text-4xl font-bold">{data.finalCtaTitle}</h2>
    	        <p className="mt-4 text-blue-200 max-w-2xl mx-auto">{data.finalCtaSubtext}</p>
    	        <div className="mt-8 space-y-4">
              <a href="https://lin.ee/rFvws11" target="_blank" rel="noopener noreferrer" className="bg-orange-500 text-white font-bold text-lg py-4 px-10 rounded-full shadow-lg transition-transform transform hover:scale-105 inline-block">
    	            LINEでオープン通知を受け取る
    	          </a>
    	        </div>
    	      </div>
    	    </section>
    	  </main>

    	  {/* --- フッター --- */}
    	  <footer className="bg-gray-800 text-white">
    	    <div className="container mx-auto py-10 px-6 text-center text-sm">
    	      <div className="mb-4">
                <Link href="/legal" className="text-gray-400 hover:text-white">特定商取引法に基づく表記</Link>
              </div>
    	      <div>
                <p className="text-gray-400">みんなの那須アプリ運営 | 株式会社adtown</p>
                <p className="text-gray-400">〒329-2711 栃木県那須塩原市石林698-35 | TEL:0287-39-7577</p>
              </div>
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
      heroHeadline: "那須の暮らしが、もっと便利に、もっとお得に。\n50以上の機能が、このアプリひとつに。",
      heroSubheadline: "休日当番医、ゴミの日通知、お得なクーポンまで。那須地域に特化した、みんなの「お守りアプリ」が、まもなく登場！",
      problemTitle: "那須の暮らし、こんな「ちょっと不便」を解決します",
      problemPoints: [
        "「今日の当番医はどこ？」急な体調不良のたびに検索するのが大変…",
        "「あれ、今日のゴミの日なんだっけ？」うっかり出しそびれてしまう…",
        "地域のイベントやお店のお得な情報、もっと手軽に知りたい…",
        "いざという時の避難場所や防災情報、すぐに確認できるようにしたい…"
      ],
      solutionBenefit1_Category: "もしもの時の、お守りとして",
      solutionBenefit1_Title: "休日当番医から防災情報まで",
      solutionBenefit1_Desc: "急な病気や災害時も、アプリを開けばすぐに情報が見つかります。あなたの家族と暮らしを、24時間見守ります。",
      solutionBenefit2_Category: "毎日の暮らしの、パートナーとして",
      solutionBenefit2_Title: "お得なクーポンと地域の話題",
      solutionBenefit2_Desc: "地元のお店で使える限定クーポンや、知らなかった地域のイベント情報をお届け。毎日がもっと楽しく、もっとお得になります。",
      freeReasonTitle: "なぜ、これだけの機能がずっと無料なのですか？",
      freeReasonDesc: "このアプリは、那須地域を愛する企業様からの広告協賛によって運営されています。\n那須に住むすべての方に、安全と便利を提供することが私たちの地域貢献です。利用料を請求することは一切ありませんので、安心してご利用ください。",
      finalCtaTitle: "準備はいいですか？",
      finalCtaSubtext: "まもなく、新しい那須の暮らしが始まります。LINE公式アカウントに登録して、誰よりも早くオープン情報や限定特典を手に入れましょう。",
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
  	return { 
        props: { 
            data: {} as LandingData 
        } 
    };
  }
};

export default IndexPage;