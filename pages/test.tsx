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

// --- ランディングページ コンポーネント ---
const IndexPage: NextPage<IndexPageProps> = ({ data }) => {
  return (
    <>
      <Head>
        <title>{data.mainTitle || 'みんなの那須アプリ'}</title>
        <meta name="description" content={data.heroSubheadline || '那須地域の暮らしをもっと便利に、もっとお得に。'} />
      </Head>

      <div className="bg-[#fefcfb] text-gray-700">
        {/* --- ファーストビュー --- */}
        <header className="bg-white border-b">
          <div className="container mx-auto px-6 pt-16 pb-12 md:pt-24 md:pb-20 text-center">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              {data.mainTitle}
            </h1>
            <p className="mt-2 text-md text-gray-500">
              {data.areaDescription}
            </p>
            <h2 className="mt-4 text-4xl md:text-5xl font-black text-gray-900 leading-tight">
              {data.heroHeadline?.split('\n').map((line, i) => <span key={i} className="block">{line}</span>)}
            </h2>
            <p className="mt-4 text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              {data.heroSubheadline}
            </p>
            {/* ▼▼▼ 修正 ▼▼▼ */}
            <div className="mt-10">
              <Link href="/signup" passHref>
                <a className="bg-orange-500 text-white font-bold text-lg py-4 px-10 rounded-full shadow-lg inline-block transition-all transform hover:scale-105">
                  「地域お守り無料プラン」に登録する
                </a>
              </Link>
              <p className="text-sm text-gray-500 mt-4">登録はメールアドレスだけで簡単1分。費用は一切かかりません。</p>
            </div>
            {/* ▲▲▲ 修正 ▲▲▲ */}
          </div>
        </header>

        <main>
          {/* --- メインビジュアル --- */}
          <section className="bg-white">
            <div className="container mx-auto px-6 -mt-10 md:-mt-16">
              <Image 
                src="/images/illustration-hero.png"
                alt="みんなの那須アプリの便利さを表すイラスト" 
                width={1200} 
                height={600}
                layout="responsive"
                objectFit="contain"
              />
            </div>
          </section>

          {/* --- お悩みセクション --- */}
          <section className="py-20 bg-[#f4f1ed]">
            <div className="container mx-auto px-6">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800">{data.empathyTitle}</h2>
                <p className="mt-4 text-gray-600 max-w-2xl mx-auto">{data.empathyIntro}</p>
              </div>
              <div className="grid md:grid-cols-3 gap-8 text-center">
                <div className="bg-white p-8 rounded-lg shadow-md"><RiHeartPulseFill className="text-4xl text-red-500 mb-4 mx-auto" /><h3 className="font-bold text-lg mb-2">{data.solutionBenefit1_Title}</h3><p className="text-sm text-gray-600">{data.solutionBenefit1_Desc}</p></div>
                <div className="bg-white p-8 rounded-lg shadow-md"><RiShieldCheckFill className="text-4xl text-blue-500 mb-4 mx-auto" /><h3 className="font-bold text-lg mb-2">{data.solutionBenefit2_Title}</h3><p className="text-sm text-gray-600">{data.solutionBenefit2_Desc}</p></div>
                <div className="bg-white p-8 rounded-lg shadow-md"><RiChatHeartFill className="text-4xl text-green-500 mb-4 mx-auto" /><h3 className="font-bold text-lg mb-2">{data.solutionBenefit3_Title}</h3><p className="text-sm text-gray-600">{data.solutionBenefit3_Desc}</p></div>
              </div>
            </div>
          </section>

          {/* --- 無料の理由セクション --- */}
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

          {/* --- 最終CTAセクション --- */}
          <section id="cta" className="bg-gray-800 text-white">
            <div className="container mx-auto px-6 py-20 text-center">
              <div className="max-w-2xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold">{data.finalCtaTitle}</h2>
                <p className="mt-4 text-gray-300">{data.finalCtaSubtext}</p>
                {/* ▼▼▼ 修正 ▼▼▼ */}
                <div className="mt-8">
                  <Link href="/signup" passHref>
                    <a className="bg-orange-500 text-white font-bold text-lg py-4 px-10 rounded-full shadow-lg inline-block transition-transform transform hover:scale-105">
                      今すぐ無料で登録する
                    </a>
                  </Link>
                </div>
                {/* ▲▲▲ 修正 ▲▲▲ */}
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
    
    const dbData = docSnap.exists ? docSnap.data() as LandingData : {};

    return { 
      props: { 
        data: JSON.parse(JSON.stringify(dbData)) 
      } 
    };
  } catch (error) {
    console.error("Landing page data fetch error:", error);
    return { props: { data: {} as LandingData } };
  }
};

export default IndexPage;