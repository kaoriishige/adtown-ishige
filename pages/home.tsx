// pages/home.tsx
import { useState } from 'react';
import { NextPage, GetServerSideProps } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import nookies from 'nookies';
import { adminAuth, adminDb } from '../lib/firebase-admin';
import Head from 'next/head';
import Image from 'next/image';
import { RiLayoutGridFill, RiAlarmWarningLine, RiUserStarLine, RiCoupon3Line } from 'react-icons/ri';
import { FcGoogle } from 'react-icons/fc';
import { FaYahoo } from 'react-icons/fa';
import { IoSparklesSharp } from 'react-icons/io5';

interface HomePageProps {
  user: {
    uid: string;
    email: string | null;
  };
}

interface EmergencyContact {
  name: string;
  number?: string;
  description: string;
  url: string;
}

const HomePage: NextPage<HomePageProps> = ({ user }) => {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const genres = [
    '生活情報', '健康支援', '節約・特売', '人間関係', '教育・学習',
    '子育て', '防災・安全', '診断・運勢', 'エンタメ', '趣味・文化',
  ];

  const emergencyContacts: EmergencyContact[] = [
    { name: '消費者ホットライン', number: '188', description: '商品やサービスのトラブル', url: 'https://www.caa.go.jp/policies/policy/local_cooperation/local_consumer_administration/hotline/', },
    { name: '救急安心センター', number: '#7119', description: '急な病気やケガで救急車を呼ぶか迷った時', url: 'https://www.fdma.go.jp/publication/portal/post2.html', },
    { name: '休日夜間急患診療所', description: '那須塩原市の休日・夜間の急病', url: 'https://www.city.nasushiobara.tochigi.jp/soshikikarasagasu/kenkozoshinka/kyukyu_kyumei/1/3340.html', },
    { name: '休日夜間急患診療所', description: '大田原市の休日・夜間の急病', url: 'https://www.city.ohtawara.tochigi.jp/docs/2013082771612/', },
    { name: '休日夜間急患診療所', description: '那須町の休日・夜間の急病', url: 'https://www.town.nasu.lg.jp/0130/info-0000003505-1.html', },
    { name: '水道のトラブル', number: '090-2463-6638', description: '(有)クリプトン（那須塩原市指定業者）水漏れ・つまりなど', url: 'https://xn--bbkyao7065bpyck41as89d.com/emergency/', },
  ];

  const searchTools = [
    {
      name: 'Google 検索',
      href: 'https://www.google.co.jp',
      Icon: FcGoogle,
      bgColor: 'bg-white',
      textColor: 'text-gray-800',
      description: '世界最大の検索エンジンで、必要な情報を素早く見つけます。'
    },
    {
      name: 'Yahoo! JAPAN',
      href: 'https://www.yahoo.co.jp',
      Icon: FaYahoo,
      bgColor: 'bg-red-600',
      textColor: 'text-white',
      description: 'ニュースや天気、ショッピングなど、多様なサービスを提供します。'
    },
    {
      name: 'AI検索 (Perplexity)',
      href: 'https://www.perplexity.ai',
      Icon: IoSparklesSharp,
      bgColor: 'bg-black',
      textColor: 'text-white',
      description: '質問を入力すると、AIが対話形式で答えを要約してくれます。'
    },
  ];

  return (
    <>
      <Head>
        <title>ホーム - みんなの那須アプリ</title>
      </Head>
      <div className="bg-gray-100 min-h-screen">
        <div className="max-w-md mx-auto bg-white">
          <header className="text-center p-6 bg-white shadow-sm sticky top-0 z-10">
            <h1 className="text-3xl font-bold text-gray-800">みんなの那須アプリ</h1>
            <p className="text-gray-600 mt-2">ようこそ、{user.email}さん</p>
          </header>

          <main className="p-4 space-y-6">
            <section className="bg-white p-6 rounded-xl shadow-md">
              <button onClick={() => setIsModalOpen(true)} className="w-full flex items-center justify-center text-center text-red-800 font-bold py-3 px-6 rounded-lg shadow-md transition transform hover:scale-105 bg-red-100 hover:bg-red-200">
                <RiAlarmWarningLine className="mr-2 text-red-500" /> お困りのときは (緊急連絡先)
              </button>
              <p className="text-xs text-center text-gray-500 mt-2">商品やサービスのトラブル、休日・夜間の急病、水道のトラブルなどはこちら</p>
            </section>

            {/* ★★★ ここが修正箇所です ★★★ */}
            <section>
              <Link href="/users/dashboard" className="block p-5 rounded-xl shadow-md transition transform hover:-translate-y-1 bg-gradient-to-r from-green-400 to-blue-500 text-white">
                <div className="flex items-center">
                  <RiUserStarLine className="text-4xl mr-4 flex-shrink-0" />
                  <div>
                    <h2 className="font-bold text-lg">求人マッチングAI無料登録</h2>
                    <p className="text-sm mt-1 opacity-90">仕事をお探しの方は、無料で登録すると、あなたが希望する企業とAIがマッチングします。</p>
                  </div>
                </div>
              </Link>
            </section>
            {/* ★★★ ここまでが修正箇所です ★★★ */}

            <section>
              <Link href="/deals" className="block p-5 rounded-xl shadow-md transition transform hover:-translate-y-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                <div className="flex items-center">
                  <RiCoupon3Line className="text-4xl mr-4 flex-shrink-0" />
                  <div>
                    <h2 className="font-bold text-lg">お得＆クーポン情報</h2>
                    <p className="text-sm mt-1 opacity-90">那須地域のお店の最新情報やクーポンをチェックしよう！</p>
                  </div>
                </div>
              </Link>
            </section>

            <section className="bg-white p-6 rounded-xl shadow-md">
              <h2 className="text-xl font-bold text-gray-800 text-center mb-4">
                アプリをジャンルで探す
              </h2>
              <div className="flex flex-wrap justify-center gap-2">
                {genres.map((genre) => (
                  <Link key={genre} href={`/genre/${genre}`} className="bg-blue-100 text-blue-800 text-sm font-semibold py-2 px-4 rounded-full hover:bg-blue-200 transition-colors">
                    {genre}
                  </Link>
                ))}
              </div>
            </section>

            <section className="bg-white p-6 rounded-xl shadow-md border-2 border-yellow-400">
              <h2 className="text-xl font-bold text-gray-800 text-center mb-2">
                限定機能で、年間<span className="text-red-600">9.3万円</span>以上お得に！
              </h2>
              <p className="text-center text-gray-600 mb-4">
                プレミアムプランにアップグレードして、全ての節約機能を利用しましょう。
              </p>
              <button
                onClick={() => router.push('/subscribe')}
                className="w-full text-center p-4 rounded-xl shadow-md transition transform hover:-translate-y-1 bg-gradient-to-r from-red-500 to-orange-500 text-white"
              >
                <span className="font-bold text-lg">月額480円で全ての機能を見る</span>
              </button>
            </section>

            <section className="bg-white p-6 rounded-xl shadow-md">
              <h2 className="text-xl font-bold text-gray-800 text-center mb-6">便利なツール</h2>
              <div className="grid grid-cols-1 gap-4">
                {searchTools.map((tool) => (
                  <a
                    key={tool.name}
                    href={tool.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`group flex items-center p-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 ${tool.bgColor}`}
                  >
                    <div className={`text-4xl ${tool.textColor} mr-4`}>
                      <tool.Icon />
                    </div>
                    <div>
                      <h3 className={`font-bold ${tool.textColor}`}>{tool.name}</h3>
                      <p className={`text-sm ${tool.textColor} opacity-90`}>{tool.description}</p>
                    </div>
                  </a>
                ))}
              </div>
            </section>

            <section>
              <Link href="/apps/all" className="block text-center p-6 rounded-xl shadow-md transition transform hover:-translate-y-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white">
                <RiLayoutGridFill className="mx-auto text-4xl mb-2" />
                <span className="font-bold text-lg">すべてのアプリを見る</span>
              </Link>
            </section>

            <footer className="text-center mt-8 pb-4 space-y-8">
              <section>
                <Link href="/contact" className="inline-block bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-8 rounded-lg shadow-sm transition-colors">
                  お問い合わせ
                </Link>
              </section>

              <section>
                <h3 className="text-sm font-semibold text-gray-600 mb-2">アプリ協賛企業様</h3>
                <a href="https://www.adtown2006.com/" target="_blank" rel="noopener noreferrer" className="inline-block hover:opacity-80 transition-opacity">
                  <Image src="/images/partner-adtown.png" alt="株式会社adtown" width={200} height={50} className="object-contain" />
                </a>
              </section>

              <p className="text-xs text-gray-400 pt-4">© 2025 株式会社adtown</p>
            </footer>
          </main>
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="p-4 border-b">
                <h2 className="text-xl font-bold text-center">緊急連絡先</h2>
              </div>
              <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
                {emergencyContacts.map((contact, index) => (
                  <div key={`${contact.name}-${index}`} className="block p-3 bg-gray-50 rounded-lg">
                    <p className="font-bold text-blue-600">{contact.name}</p>
                    {contact.number && (
                      <a href={`tel:${contact.number.replace('#', '')}`} className="text-2xl font-bold text-gray-800 hover:underline">
                        {contact.number}
                      </a>
                    )}
                    <p className="text-sm text-gray-500">{contact.description}</p>
                    <a href={contact.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline mt-1 inline-block">
                      公式サイトを見る
                    </a>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t text-center">
                <button onClick={() => setIsModalOpen(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-6 rounded-lg">
                  閉じる
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const cookies = nookies.get(context);
    const sessionCookie = cookies.session || '';

    if (!sessionCookie) {
      return { redirect: { destination: '/users/login', permanent: false } };
    }

    const token = await adminAuth.verifySessionCookie(sessionCookie, true);
    if (!token || !token.uid) {
      return { redirect: { destination: '/users/login', permanent: false } };
    }

    const userDoc = await adminDb.collection('users').doc(token.uid).get();
    if (!userDoc.exists) {
      return { redirect: { destination: '/users/login', permanent: false } };
    }

    const userData = userDoc.data() || {};
    const userPlan = userData.plan || 'free';

    if (userPlan === 'paid_480') {
      return { redirect: { destination: '/mypage', permanent: false } };
    }

    return {
      props: {
        user: {
          uid: token.uid,
          email: token.email || null,
        },
      },
    };
  } catch (err) {
    console.error('home getServerSideProps error:', err);
    return { redirect: { destination: '/users/login', permanent: false } };
  }
};

export default HomePage;


