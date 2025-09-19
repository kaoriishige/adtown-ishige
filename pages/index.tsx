import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { RiShieldCheckFill, RiHeartPulseFill, RiChatHeartFill, RiRocketFill } from 'react-icons/ri';

// --- 型定義 ---
interface LandingData {}

interface IndexPageProps {
  data: LandingData;
}

// --- ランディングページ コンポーネント ---
const IndexPage: NextPage<IndexPageProps> = ({ data }) => {
  return (
    <>
      <Head>
        <title>みんなの那須アプリ - 地域お守り無料プラン</title>
        <meta name="description" content="那須塩原市、大田原市、那須町専用！休日当番医、AI相談など、約50個のアプリが永久無料で使える「地域お守り無料プラン」が登場。" />
      </Head>

      <div className="bg-white text-gray-800">
        {/* --- ファーストビュー --- */}
        <header
          className="relative text-white text-center py-20 px-4 flex flex-col items-center justify-center min-h-[60vh]"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('/images/nasu-landscape.jpg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="max-w-3xl">
            <h1 className="text-3xl md:text-4xl font-bold mb-3" style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.8)' }}>
              みんなの那須アプリ
            </h1>
            <p className="text-lg md:text-xl mb-4 font-semibold" style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.8)' }}>
              那須塩原市、大田原市、那須町の地域専用アプリ
            </p>
            <h2 className="text-4xl md:text-5xl font-black leading-tight mb-8" style={{ textShadow: '2px 2px 6px rgba(0,0,0,0.8)' }}>
              那須の暮らしが、もっと便利に、もっとお得に。
              <span className="block mt-2 text-yellow-300">約50個のアプリが永久無料で使い放題！</span>
            </h2>
            <div className="space-y-4 bg-black bg-opacity-40 p-6 rounded-lg inline-block">
              <button 
                className="bg-gray-400 text-white font-bold text-lg py-4 px-8 rounded-full shadow-lg cursor-not-allowed" 
                disabled
              >
                まもなくオープン
              </button>
              <div className="mt-4 flex flex-col items-center">
                <p className="mb-2 text-lg font-semibold text-white">
                  オープン告知はLINE公式アカウントでお知らせします！
                </p>
                <a href="https://lin.ee/rFvws11">
                    <Image src="https://scdn.line-apps.com/n/line_add_friends/btn/ja.png" alt="友だち追加" width={116} height={36} />
                </a>
              </div>
            </div>
          </div>
        </header>

        <main>
          {/* --- 共感セクション --- */}
          <section className="py-16 bg-gray-50">
            <div className="max-w-4xl mx-auto px-6 text-center">
              <h2 className="text-3xl font-bold mb-4">病院探し、子育ての悩み…<br />その都度、別のアプリやサイトを開いていませんか？</h2>
              <p className="text-gray-600 mb-10">
                那須での生活に必要な「あれこれ」を、たった一つに。50個以上の便利が、あなたの毎日を徹底的にサポートします。
              </p>
              <div className="grid md:grid-cols-3 gap-8 text-left">
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <RiHeartPulseFill className="text-4xl text-red-500 mb-3" />
                  <h3 className="font-bold text-lg mb-2">もしもの時の、家族の安心に</h3>
                  <p className="text-sm text-gray-600">
                    休日夜間診療所を瞬時に検索。災害時の避難行動をAIがシミュレーション。暮らしの緊急事態に、もう焦りません。
                  </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <RiShieldCheckFill className="text-4xl text-blue-500 mb-3" />
                  <h3 className="font-bold text-lg mb-2">忙しい毎日の、時間とお金を節約</h3>
                  <p className="text-sm text-gray-600">
                    AIが献立を提案し、買い忘れも防止。ペットの迷子や里親募集情報も充実しています。
                  </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <RiChatHeartFill className="text-4xl text-green-500 mb-3" />
                  <h3 className="font-bold text-lg mb-2">ちょっと疲れた、あなたの心に</h3>
                  <p className="text-sm text-gray-600">
                    愚痴聞き地蔵AIや共感チャットAIが、24時間あなたの心に寄り添います。毎朝届く「褒め言葉シャワー」で一日を元気に。
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* --- なぜ無料なのか --- */}
          <section className="py-16 bg-white">
            <div className="max-w-3xl mx-auto px-6 text-center">
                <h2 className="text-3xl font-bold mb-4">なぜ、これだけの機能がずっと無料なのですか？</h2>
                <p className="text-gray-600">
                    このアプリは、地域の企業様からの広告協賛によって運営されています。私たちは、那須地域に住むすべての方に、安全と便利を提供することが地域貢献だと考えています。だから、あなたに**「地域お守り無料プラン」**の利用料を請求することは一切ありません。安心して、ずっと使い続けてください。
                </p>
            </div>
          </section>

          {/* --- プレミアムプラン予告セクション --- */}
          <section className="py-16 bg-blue-50">
            <div className="max-w-3xl mx-auto px-6 text-center">
                <div className="bg-white p-8 rounded-xl shadow-lg border-t-4 border-blue-500">
                    <RiRocketFill className="text-5xl text-blue-500 mb-4 mx-auto" />
                    <h2 className="text-2xl font-bold mb-2 text-blue-800">さらに、もっとお得に。</h2>
                    <p className="text-gray-700 text-lg font-semibold">
                      年間93,000円＋αの損を「得」に変える<br/>
                      <span className="text-blue-600">プレミアムプラン</span>も要確認!!
                    </p>
                    <p className="text-sm text-gray-500 mt-4">
                      ※プレミアムプランの詳細はアプリ内でご案内します。まずは「地域お守り無料プラン」で、アプリの便利さをご体験ください。
                    </p>
                </div>
            </div>
          </section>


          {/* --- 最後のCTA --- */}
          <section className="py-20 bg-gray-800 text-white">
            <div className="max-w-4xl mx-auto px-6 text-center">
              <h2 className="text-3xl font-bold mb-4">那須の暮らしを、アップデートしよう。</h2>
              <p className="text-lg mb-8">約50個の無料アプリが、あなたのスマホに。オープンをお楽しみに！</p>
              
              <div className="space-y-4 bg-black bg-opacity-40 p-6 rounded-lg inline-block">
                <button 
                  className="bg-gray-400 text-white font-bold text-lg py-4 px-8 rounded-full shadow-lg cursor-not-allowed" 
                  disabled
                >
                  まもなくオープン
                </button>
                <div className="mt-4 flex flex-col items-center">
                  <p className="mb-2 text-lg font-semibold text-white">
                    オープン告知はLINE公式アカウントでお知らせします！
                  </p>
                  <a href="https://lin.ee/rFvws11">
                      <Image src="https://scdn.line-apps.com/n/line_add_friends/btn/ja.png" alt="友だち追加" width={116} height={36} />
                  </a>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* --- フッター --- */}
        <footer className="bg-gray-200 text-center text-sm text-gray-600 py-8 px-4">
            <div className="space-y-2">
                <div className="flex justify-center space-x-6 mb-4">
                    <Link href="/legal" className="hover:underline">特定商取引法に基づく表記</Link>
                </div>
                <div>
                    <p>みんなの那須アプリ運営</p><p>株式会社adtown</p><p>〒329-2711 栃木県那須塩原市石林698-35</p><p>TEL:0287-39-7577</p>
                </div>
            </div>
        </footer>
      </div>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async () => {
  const data: LandingData = {};

  return { 
    props: { 
      data: {} 
    } 
  };
};

export default IndexPage;
