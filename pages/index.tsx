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
  premiumTeaserTitle?: string;
  premiumTeaserText?: string;
  finalCtaTitle?: string;
  finalCtaSubtext?: string;
}

interface IndexPageProps {
  data: LandingData;
}

// --- コンポーネント ---
const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title?: string, description?: string }) => (
  <div className="bg-[#161b22] p-8 rounded-xl border border-gray-700/50">
    <div className="text-4xl text-cyan-400 mb-4">{icon}</div>
    <h3 className="font-bold text-lg mb-2 text-white">{title}</h3>
    <p className="text-sm text-gray-400">{description}</p>
  </div>
);

const IndexPage: NextPage<IndexPageProps> = ({ data }) => {
  return (
    <>
      <Head>
        <title>{data.mainTitle || 'みんなの那須アプリ'}</title>
      	<meta name="description" content={data.heroSubheadline} />
    	</Head>

    	<div className="bg-[#0d1117] text-gray-300">
        
        {/* --- ヒーローセクション --- */}
    	  <header className="relative py-24 md:py-32 text-center overflow-hidden">
          {/* 背景の光エフェクト */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-[150%] bg-gradient-radial from-blue-900/40 via-transparent to-transparent -z-0 blur-3xl"></div>

          <div className="container mx-auto px-6 relative z-10">
            <h1 className="text-4xl md:text-6xl font-black text-white leading-tight">
              {data.heroHeadline?.split('\n').map((line, i) => <span key={i} className="block">{line}</span>)}
            </h1>
            <p className="mt-6 text-lg md:text-xl text-gray-400 max-w-2xl mx-auto">
              {data.heroSubheadline}
            </p>
            <div className="mt-10">
              <a href="#cta" className="bg-cyan-400 text-black font-bold text-lg py-4 px-10 rounded-full shadow-lg transition-transform transform hover:scale-105 inline-block">
    	          まもなくオープン！LINEで通知を受け取る
    	        </a>
            </div>
          <div className="mt-16">
            <p className="text-sm text-gray-500 mb-4">那須地域のパートナー企業・団体様（一部）</p>
            <div className="flex justify-center items-center gap-x-8 md:gap-x-12 grayscale opacity-60">
              <Image src="/images/logo-placeholder-1.svg" alt="パートナーロゴ1" width={100} height={40} />
              <Image src="/images/logo-placeholder-2.svg" alt="パートナーロゴ2" width={100} height={40} />
              <Image src="/images/logo-placeholder-3.svg" alt="パートナーロゴ3" width={100} height={40} />
              <Image src="/images/logo-placeholder-4.svg" alt="パートナーロゴ4" width={100} height={40} />
            </div>
          </div>
          </div>
        </header>

    	  <main>
          {/* --- 機能紹介セクション --- */}
          <section className="py-20">
            <div className="container mx-auto px-6">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-white">那須の毎日を、一つのアプリで</h2>
                <p className="mt-4 text-gray-400 max-w-2xl mx-auto">
                  地域の「あったらいいな」を詰め込んだ、約50の便利機能
                </p>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                <FeatureCard icon={<RiHeartPulseFill />} title={data.solutionBenefit1_Title} description={data.solutionBenefit1_Desc} />
                <FeatureCard icon={<RiShieldCheckFill />} title={data.solutionBenefit2_Title} description={data.solutionBenefit2_Desc} />
                <FeatureCard icon={<RiChatHeartFill />} title={data.solutionBenefit3_Title} description={data.solutionBenefit3_Desc} />
              </div>
            </div>
          </section>

          {/* --- プレミアムプラン予告セクション --- */}
          <section className="py-20">
            <div className="container mx-auto px-6 text-center">
              <div className="max-w-3xl mx-auto bg-gradient-to-br from-blue-900/50 to-cyan-900/20 p-8 md:p-12 rounded-2xl border border-cyan-400/20 shadow-xl">
                <RiRocketFill className="text-5xl text-cyan-400 mb-4 mx-auto" />
                <h2 className="text-3xl font-bold text-white">{data.premiumTeaserTitle}</h2>
                <p className="mt-4 text-xl md:text-2xl text-white font-semibold">
                  {data.premiumTeaserText?.split('\n').map((line, i) => <span key={i} className="block">{line}</span>)}
                </p>
              </div>
            </div>
          </section>

    	    {/* --- 最後のCTA --- */}
    	    <section id="cta" className="py-20">
    	      <div className="container mx-auto px-6 text-center">
    	        <div className="max-w-2xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold text-white">{data.finalCtaTitle}</h2>
    	          <p className="mt-4 text-gray-400">{data.finalCtaSubtext}</p>
    	          <div className="mt-8">
                  <a href="https://lin.ee/rFvws11" target="_blank" rel="noopener noreferrer" className="bg-cyan-400 text-black font-bold text-lg py-4 px-10 rounded-full shadow-lg transition-transform transform hover:scale-105 inline-block">
    	              LINEでオープン通知を受け取る
    	            </a>
                </div>
              </div>
    	      </div>
    	    </section>
    	  </main>

    	  {/* --- フッター --- */}
    	  <footer className="border-t border-gray-800">
    	    <div className="container mx-auto py-8 px-6 text-center text-xs text-gray-500">
    	      <div className="mb-4">
                <Link href="/legal" className="hover:text-white">特定商取引法に基づく表記</Link>
              </div>
    	      <div>
                <p>みんなの那須アプリ運営 | 株式会社adtown</p>
                <p>〒329-2711 栃木県那須塩原市石林698-35 | TEL:0287-39-7577</p>
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
      heroHeadline: "那須の暮らしが、もっと便利に、もっとお得に。",
      heroSubheadline: "休日当番医からお得なクーポン、AI相談まで。あなたのスマホが、那須地域最強の「お守り」に変わります。",
      solutionBenefit1_Title: "もしもの時の、家族の安心に",
      solutionBenefit1_Desc: "休日夜間診療所を瞬時に検索。災害時の避難行動をAIがシミュレーション。暮らしの緊急事態に、もう焦りません。",
      solutionBenefit2_Title: "忙しい毎日の、時間とお金を節約",
      solutionBenefit2_Desc: "AIが献立を提案し、買い忘れも防止。ペットの迷子や里親募集情報も充実しています。",
      solutionBenefit3_Title: "ちょっと疲れた、あなたの心に",
      solutionBenefit3_Desc: "愚痴聞き地蔵AIや共感チャットAIが、24時間あなたの心に寄り添います。",
      premiumTeaserTitle: "さらに、もっとお得に。",
      premiumTeaserText: "年間93,000円＋αの損を「得」に変える\nプレミアムプランも要確認!!",
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