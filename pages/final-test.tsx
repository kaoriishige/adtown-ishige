import { NextPage } from 'next';
import Head from 'next/head';
import Image from 'next/image';

const FinalTestPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>最終表示テスト</title>
      </Head>
    	<div className="bg-[#001e41] text-gray-300 relative">
        {/* 背景のひし形模様 */}
        <div 
          className="fixed inset-0 z-0 opacity-10"
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
        <div className="relative z-10 p-10">
          <h1 className="text-4xl font-bold text-white mb-6">最終表示テストページ</h1>
          <p className="mb-8">
            以下に、`speelead.com`風の背景の上で、パートナー様の画像4点が表示されていれば、全ての機能は正常です。
          </p>
          <div className="bg-black/20 p-8 rounded-lg">
            <h2 className="text-sm text-gray-400 mb-4">パートナー企業・団体様</h2>
            <div className="flex flex-wrap justify-center items-center gap-10">
                <Image src="/images/partner-ishikawa.png" alt="おまかせオート石川" width={160} height={55} style={{objectFit: "contain"}} />
                <Image src="/images/partner-midcity.png" alt="那須ミッドシティホテル" width={160} height={55} style={{objectFit: "contain"}} />
                <Image src="/images/partner-dairin.png" alt="オートギャラリーダイリン" width={160} height={55} style={{objectFit: "contain"}} />
                <Image src="/images/partner-akimoto.png" alt="株式会社パン・アキモト" width={160} height={55} style={{objectFit: "contain"}} />
            </div>
          </div>
        </div>
    	</div>
    </>
  );
};

export default FinalTestPage;