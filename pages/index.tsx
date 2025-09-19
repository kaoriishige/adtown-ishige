import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { getAdminDb } from '../lib/firebase-admin';
import { RiShieldCheckFill, RiHeartPulseFill, RiChatHeartFill, RiCheckboxCircleFill, RiRocketFill } from 'react-icons/ri';

// --- 型定義 ---
interface LandingData {
  mainTitle?: string;
  areaDescription?: string;
  heroHeadline?: string;
  heroSubheadline?: string;
  youtubeVideoId?: string;
  empathyTitle?: string;
  empathyIntro?: string;
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

    	<div className="bg-white text-gray-700">
        
        {/* --- ヒーローセクション --- */}
    	  <header className="bg-gray-50">
          <div className="container mx-auto px-6 py-16 md:py-24 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
              {data.mainTitle}
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              {data.areaDescription}
            </p>
            <h2 className="mt-6 text-4xl md:text-5xl font-black text-gray-900 leading-tight">
              {data.heroHeadline?.split('\n').map((line, i) => <span key={i} className="block">{line}</span>)}
            </h2>
            <p className="mt-4 text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              {data.heroSubheadline}
            </p>
            <div className="mt-8">
              <a href="#cta" className="bg-orange-500 text-white font-bold text-lg py-4 px-10 rounded-full shadow-lg transition-transform transform hover:scale-105 inline-block">
    	          まもなくオープン！LINEで先行情報を受け取る
    	        </a>
            </div>
          </div>
        </header>

    	  <main>
    	    {/* --- お悩みセクション --- */}
    	    <section className="py-20 bg-white">
    	      <div className="container mx-auto px-6 text-center">
    	        <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
              {data.empathyTitle}
            </h2>
              <p className="mt-4 text-gray-600 max-w-3xl mx-auto">{data.empathyIntro}</p>
    	      </div>
    	    </section>

          {/* --- 機能紹介セクション --- */}
          <section className="py-20 bg-gray-50">
            <div className="container mx-auto px-6">
              <div className="grid md:grid-cols-3 gap-8 text-center">
                <div className="bg-white p-8 rounded-lg shadow-md border"><RiHeartPulseFill className="text-4xl text-red-500 mb-4 mx-auto" /><h3 className="font-bold text-lg mb-2">{data.solutionBenefit1_Title}</h3><p className="text-sm text-gray-600">{data.solutionBenefit1_Desc}</p></div>
                <div className="bg-white p-8 rounded-lg shadow-md border"><RiShieldCheckFill className="text-4xl text-blue-500 mb-4 mx-auto" /><h3 className="font-bold text-lg mb-2">{data.solutionBenefit2_Title}</h3><p className="text-sm text-gray-600">{data.solutionBenefit2_Desc}</p></div>
                <div className="bg-white p-8 rounded-lg shadow-md border"><RiChatHeartFill className="text-4xl text-green-500 mb-4 mx-auto" /><h3 className="font-bold text-lg mb-2">{data.solutionBenefit3_Title}</h3><p className="text-sm text-gray-600">{data.solutionBenefit3_Desc}</p></div>
              </div>
            </div>
          </section>

    	    {/* --- なぜ無料なのか --- */}
    	    <section className="py-20 bg-white">
    	      <div className="container mx-auto px-6 text-center">
    	        <h2 className="text-3xl md:text-4xl font-bold text-gray-800">{data.freeReasonTitle}</h2>
    	        <p className="mt-4 text-gray-600 leading-relaxed max-w-3xl mx-auto">{data.freeReasonDesc}</p>
    	      </div>
    	    </section>

          {/* --- プレミアムプラン予告セクション --- */}
          <section className="py-20 bg-yellow-50 border-t border-b border-yellow-200">
            <div className="container mx-auto px-6 text-center">
              <div className="max-w-3xl mx-auto">
                <RiRocketFill className="text-5xl text-yellow-500 mb-4 mx-auto" />
                <h2 className="text-3xl font-bold text-gray-800">{data.premiumTeaserTitle}</h2>
                <p className="mt-4 text-xl md:text-2xl text-gray-700 font-semibold">
                  {data.premiumTeaserText?.split('\n').map((line, i) => <span key={i} className="block">{line}</span>)}
                </p>
                <p className="mt-4 text-sm text-gray-500">{data.premiumTeaserNote}</p>
              </div>
            </div>
          </section>

    	    {/* --- 最後のCTA --- */}
    	    <section id="cta" className="bg-blue-600 text-white">
    	      <div className="container mx-auto px-6 py-20 text-center">
    	        <h2 className="text-3xl md:text-4xl font-bold">{data.finalCtaTitle}</h2>
    	        <p className="mt-4 text-blue-200 max-w-2xl mx-auto">{data.finalCtaSubtext}</p>
    	        <div className="mt-8 space-y-4">
                <a href="https://lin.ee/rFvws11" target="_blank" rel="noopener noreferrer" className="bg-orange-500 text-white font-bold text-lg py-4 px-10 rounded-full shadow-lg transition-transform transform hover:scale-105 inline-block">
    	            まもなくオープン！LINEで先行情報を受け取る
    	          </a>
                <div className="flex flex-col items-center">
                  <p className="mb-2 text-base font-semibold text-blue-100">オープン告知はLINE公式アカウントで！</p>
                  <a href="https://lin.ee/rFvws11">
                    <Image src="https://scdn.line-apps.com/n/line_add_friends/btn/ja.png" alt="友だち追加" width={116} height={36} />
                  </a>
                </div>
    	        </div>
    	      </div>
    	    </section>
    	  </main>

    	  {/* --- フッター --- */}
    	  <footer className="bg-gray-800 text-white">
    	    <div className="container mx-auto py-10 px-6 text-center text-sm">
    	      <div className="mb-4"><Link href="/legal" className="text-gray-400 hover:text-white">特定商取引法に基づく表記</Link></div>
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
      mainTitle: "みんなの那須アプリ「地域お守り無料プラン」",
      areaDescription: "那須塩原市、大田原市、那須町の地域専用アプリ",
      heroHeadline: "那須の暮らしが、もっと便利に、もっとお得に。\n約50個のアプリが永久無料で使い放題！",
      heroSubheadline: "休日当番医からAIお悩み相談まで。あなたのスマホが、那須地域最強の「お守り」に変わります。",
      youtubeVideoId: '',
      empathyTitle: "病院探し、子育ての悩み…\nその都度、スマホで別のアプリやサイトを開いていませんか？",
      empathyIntro: "那須での生活に必要な「あれこれ」を、たった一つに。50個以上の便利が、あなたの毎日を徹底的にサポートします。",
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