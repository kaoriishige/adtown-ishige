import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { adminDb } from '@/lib/firebase-admin'; // ここは変更なし
import { 
  RiShieldCheckFill, 
  RiHeartPulseFill, 
  RiChatHeartFill, 
  RiRocketFill,
  RiShoppingCartLine,
  RiHandHeartLine,
  RiBriefcase4Line,
  RiCoupon3Line 
} from 'react-icons/ri';

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
  solutionBenefit5_Title?: string;
  solutionBenefit5_Desc?: string;
  solutionBenefit6_Title?: string;
  solutionBenefit6_Desc?: string;
  solutionBenefit7_Title?: string;
  solutionBenefit7_Desc?: string;
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
            src="/images/hero-background.png"
            alt="背景画像"
            fill
            className="absolute inset-0 z-0 object-cover opacity-10"
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
                <Link href="/signup" passHref legacyBehavior>
                  <a className="bg-lime-400 text-black font-bold py-4 px-8 rounded-md shadow-lg transition-all transform hover:scale-105 inline-block max-w-xs w-full">
                    今すぐ無料で登録する
                  </a>
                </Link>
                <p className="text-sm text-blue-200 mt-4">登録はメールアドレスだけで簡単1分。費用は一切かかりません。</p>
              </div>
            </div>
          </div>
        </header>

        <main>
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

          <section className="py-16 bg-white border-y">
              <div className="container mx-auto px-6 text-center">
                  <h3 className="text-sm tracking-widest text-gray-500 mb-8 font-semibold uppercase">那須地域のパートナー企業・店舗様</h3>
                  <div className="mt-8 flex flex-wrap justify-center items-center gap-x-8 gap-y-6 opacity-80">
                      {[
                          '/images/partner-adtown.png',
                          '/images/partner-aquas.png',
                          '/images/partner-aurevoir.png',
                          '/images/partner-celsiall.png',
                          '/images/partner-dairin.png',
                          '/images/partner-kanon.png',
                          '/images/partner-kokoro.png',
                          '/images/partner-meithu.png',
                          '/images/partner-midcityhotel.png',
                          '/images/partner-nikkou.png',
                          '/images/partner-oluolu.png',
                          '/images/partner-omakaseauto.png',
                          '/images/partner-poppo.png',
                          '/images/partner-Quattro.png',
                          '/images/partner-sekiguchi02.png',
                          '/images/partner-tonbo.png',
                          '/images/partner-training_farm.png',
                          '/images/partner-transunet.png',
                          '/images/partner-yamabuki.png',
                          '/images/partner-yamakiya.png',
                      ].map((logoPath, index) => (
                          <Image
                              key={index}
                              src={logoPath}
                              alt={`パートナーロゴ ${index + 1}`}
                              width={150}
                              height={50}
                              className="object-contain"
                          />
                      ))}
                  </div>
              </div>
          </section>

          <section className="py-20 bg-gray-50">
            <div className="container mx-auto px-6 text-center">
              <div className="max-w-3xl mx-auto mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800">アプリの主な機能</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200">
                  <div className="p-4 bg-red-100 inline-block rounded-full mb-4"><RiHeartPulseFill className="text-3xl text-red-600" /></div>
                  <h3 className="font-bold text-xl mb-2 text-gray-900">{data.solutionBenefit1_Title}</h3>
                  <p className="text-gray-600">{data.solutionBenefit1_Desc}</p>
                </div>
                <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200">
                  <div className="p-4 bg-blue-100 inline-block rounded-full mb-4"><RiShieldCheckFill className="text-3xl text-blue-600" /></div>
                  <h3 className="font-bold text-xl mb-2 text-gray-900">{data.solutionBenefit2_Title}</h3>
                  <p className="text-gray-600">{data.solutionBenefit2_Desc}</p>
                </div>
                <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200">
                  <div className="p-4 bg-green-100 inline-block rounded-full mb-4"><RiChatHeartFill className="text-3xl text-green-600" /></div>
                  <h3 className="font-bold text-xl mb-2 text-gray-900">{data.solutionBenefit3_Title}</h3>
                  <p className="text-gray-600">{data.solutionBenefit3_Desc}</p>
                </div>
                <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200">
                  <div className="p-4 bg-orange-100 inline-block rounded-full mb-4"><RiShoppingCartLine className="text-3xl text-orange-600" /></div>
                  <h3 className="font-bold text-xl mb-2 text-gray-900">{data.solutionBenefit4_Title}</h3>
                  <p className="text-gray-600" dangerouslySetInnerHTML={{ __html: data.solutionBenefit4_Desc || '' }}></p>
                </div>
                <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200">
                  <div className="p-4 bg-pink-100 inline-block rounded-full mb-4"><RiHandHeartLine className="text-3xl text-pink-600" /></div>
                  <h3 className="font-bold text-xl mb-2 text-gray-900">{data.solutionBenefit5_Title}</h3>
                  <p className="text-gray-600">{data.solutionBenefit5_Desc}</p>
                </div>
                <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200">
                  <div className="p-4 bg-purple-100 inline-block rounded-full mb-4"><RiBriefcase4Line className="text-3xl text-purple-600" /></div>
                  <h3 className="font-bold text-xl mb-2 text-gray-900">{data.solutionBenefit6_Title}</h3>
                  <p className="text-gray-600">{data.solutionBenefit6_Desc}</p>
                </div>
                <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200">
                  <div className="p-4 bg-yellow-100 inline-block rounded-full mb-4"><RiCoupon3Line className="text-3xl text-yellow-600" /></div>
                  <h3 className="font-bold text-xl mb-2 text-gray-900">{data.solutionBenefit7_Title}</h3>
                  <p className="text-gray-600" dangerouslySetInnerHTML={{ __html: data.solutionBenefit7_Desc || '' }}></p>
                </div>
              </div>
            </div>
          </section>

          <section className="py-20 bg-white">
            <div className="container mx-auto px-6 text-center max-w-3xl">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800">{data.freeReasonTitle}</h2>
              <p className="mt-4 text-gray-600 leading-relaxed">{data.freeReasonDesc}</p>
            </div>
          </section>

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

          <section id="cta" className="bg-gray-800 text-white">
            <div className="container mx-auto px-6 py-20 text-center">
              <div className="max-w-2xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold">{data.finalCtaTitle}</h2>
                <p className="mt-4 text-gray-300">{data.finalCtaSubtext}</p>
                <div className="mt-8">
                  <Link href="/signup" passHref legacyBehavior>
                    <a className="bg-lime-400 text-black font-bold text-lg py-4 px-10 rounded-md shadow-lg transition-transform transform hover:scale-105 inline-block">
                      今すぐ無料で登録する
                    </a>
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </main>

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

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    // ▼▼▼【ここを修正】getAdminDb() → adminDb に変更 ▼▼▼
    const docRef = adminDb.collection('settings').doc('landingV3');
    const docSnap = await docRef.get();
    
    // データがない場合のデフォルト値
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
      solutionBenefit4_Title: "地域のフリマでお得に売買",
      solutionBenefit4_Desc: "不要になったものを地域の人に譲ったり、掘り出し物を見つけたり。安心・安全な地域内取引をサポートします。<br><span class='text-sm text-gray-500'>※無料プランは購入のみ。出品はプレミアムプランで可能になります。</span>",
      solutionBenefit5_Title: "ご近所助け合い（お手伝い）",
      solutionBenefit5_Desc: "電球の交換や買い物代行など、ちょっとした困りごとを気軽に相談・解決。地域のつながりを深めます。",
      solutionBenefit6_Title: "AIが探す、あなたに合う仕事",
      solutionBenefit6_Desc: "履歴書不要。簡単な質問に答えるだけで、AIが那須地域の最適な求人をマッチング。新しいキャリアを応援します。",
      solutionBenefit7_Title: "地域のお店の割引クーポン",
      solutionBenefit7_Desc: "地元の飲食店やお店で使えるお得なクーポンが満載。地域経済を応援しながら、賢くお買い物を楽しめます。<br><span class='text-sm text-gray-500'>※無料プランは情報閲覧のみ。アプリ限定クーポンはプレミアムプランでご利用いただけます。</span>",
      freeReasonTitle: "なぜ、これだけの機能がずっと無料なのですか？",
      freeReasonDesc: "このアプリは、地域の企業様からの広告協賛によって運営されています。私たちは、那須地域に住むすべての方に、安全と便利を提供することが地域貢献だと考えています。だから、あなたに「地域お守り無料プラン」の利用料を請求することは一切ありません。安心して、ずっと使い続けてください。",
      premiumTeaserTitle: "さらに、もっともっとお得に。",
      premiumTeaserText: "年間93,000円＋αの損を「得」に変える\nプレミアムプランも要確認!!",
      premiumTeaserNote: "※プレミアムプランの詳細はアプリ内でご案内します。まずは「地域お守り無料プラン」で、アプリの便利さをご体験ください。",
      finalCtaTitle: "さあ、那須の暮らしをアップデートしよう。",
      finalCtaSubtext: "今すぐ無料登録して、那須での毎日をもっと豊かに。登録はメールアドレスだけで簡単1分！",
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
    // エラー発生時も最低限のデータでページが表示されるようにする
    const fallbackData: LandingData = { mainTitle: "みんなの那須アプリ" };
    return { props: { data: fallbackData } };
  }
};

export default IndexPage;
