import { useState, useEffect } from 'react';
import { NextPage, GetServerSideProps } from 'next';
import Link from 'next/link';
import { collection, getDocs, getFirestore, query, where, orderBy, limit } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import nookies from 'nookies';
import { getAdminAuth, getAdminDb } from '../lib/firebase-admin';

// アイコン
import { FcGoogle } from 'react-icons/fc';
import { FaYahoo } from 'react-icons/fa';
import { IoSparklesSharp } from 'react-icons/io5';
import { RiStore2Line, RiRecycleLine, RiLayoutGridFill, RiAlarmWarningLine } from 'react-icons/ri';

// --- 型定義 ---
interface Ad {
  id: string;
  imageUrl: string;
  linkUrl: string;
  altText: string;
}

interface HomePageProps {
  user: {
    uid: string;
    email: string | null;
  };
}

// --- 検索ツールのデータ ---
const searchTools = [
  {
    name: 'Google 検索',
    href: 'https://www.google.co.jp',
    Icon: FcGoogle,
    bgColor: 'bg-white',
    textColor: 'text-gray-800',
  },
  {
    name: 'Yahoo! JAPAN',
    href: 'https://www.yahoo.co.jp',
    Icon: FaYahoo,
    bgColor: 'bg-red-600',
    textColor: 'text-white',
  },
  {
    name: 'AI検索',
    href: 'https://www.perplexity.ai',
    Icon: IoSparklesSharp,
    bgColor: 'bg-black',
    textColor: 'text-white',
  },
];

const HomePage: NextPage<HomePageProps> = ({ user }) => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loadingAds, setLoadingAds] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const fetchAds = async () => {
      try {
        const db = getFirestore(app);
        const adsCollection = collection(db, 'advertisements');
        const q = query(
          adsCollection,
          where('isActive', '==', true),
          orderBy('order', 'asc'),
          limit(5)
        );
        const adSnapshot = await getDocs(q);
        const adsData = adSnapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Ad)
        );
        setAds(adsData);
      } catch (error) {
        console.error('広告データの取得に失敗しました:', error);
      } finally {
        setLoadingAds(false);
      }
    };
    fetchAds();
  }, []);

  // ジャンル
  const genres = [
    '生活情報',
    '健康支援',
    '節約・特売',
    '人間関係',
    '教育・学習',
    '子育て',
    '防災・安全',
    '診断・運勢',
    'エンタメ',
    '趣味・文化',
  ];

  // 緊急連絡先
  const emergencyContacts = [
    {
      name: '消費者ホットライン',
      number: '188',
      description: '商品やサービスのトラブル',
      url: 'https://www.caa.go.jp/policies/policy/local_cooperation/local_consumer_administration/hotline/',
    },
    {
      name: '救急安心センター',
      number: '#7119',
      description: '急な病気やケガで救急車を呼ぶか迷った時',
      url: 'https://www.fdma.go.jp/publication/portal/post2.html',
    },
    {
      name: '休日夜間急患診療所',
      number: '0287-64-4110',
      description: '那須塩原市の休日・夜間の急病',
      url: 'https://www.city.nasushiobara.tochigi.jp/soshikikarasagasu/kenkozoshinka/yobo/1/3/3055.html',
    },
    {
      name: '水道のトラブル',
      number: '090-2463-6638',
      description: '（那須塩原市指定業者）水漏れ・つまりなど',
      url: 'https://www.city.nasushiobara.tochigi.jp/soshikikarasagasu/jogesuidobu/gyomuannai/1/5/1749.html',
    },
  ];

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="max-w-md mx-auto">
        {/* --- ヘッダー --- */}
        <header className="text-center p-6 bg-white shadow-sm">
          <h1 className="text-3xl font-bold text-gray-800">みんなの那須アプリ</h1>
          <p className="text-gray-600 mt-2">ようこそ、{user.email}さん</p>
        </header>

        <main className="p-4 space-y-6">
          {/* --- ジャンル選択 --- */}
          <section className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-bold text-gray-800 text-center mb-4">
              アプリをジャンルで探す
            </h2>
            <div className="flex flex-wrap justify-center gap-2">
              {genres.map((genre) => (
                <Link
                  key={genre}
                  href={`/genre/${genre}`}
                  className="bg-blue-100 text-blue-800 text-sm font-semibold py-2 px-4 rounded-full hover:bg-blue-200 transition-colors"
                >
                  {genre}
                </Link>
              ))}
            </div>
          </section>

          {/* --- 緊急連絡先 --- */}
          <section className="bg-white p-6 rounded-xl shadow-md">
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full flex items-center justify-center text-center text-red-800 font-bold py-3 px-6 rounded-lg shadow-md transition transform hover:scale-105 bg-red-200 hover:bg-red-300"
            >
              <RiAlarmWarningLine className="mr-2" /> お困りのときは (緊急連絡先)
            </button>
          </section>

          {/* --- 検索ツール --- */}
          <section className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-bold text-gray-800 text-center mb-4">
              便利なツール
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {searchTools.map((tool) => (
                <a
                  key={tool.name}
                  href={tool.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex flex-col items-center justify-center p-3 rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 ${tool.bgColor}`}
                >
                  <div className={`text-3xl ${tool.textColor}`}>
                    <tool.Icon />
                  </div>
                  <span
                    className={`mt-2 text-xs font-bold text-center ${tool.textColor}`}
                  >
                    {tool.name}
                  </span>
                </a>
              ))}
            </div>
          </section>

          {/* --- 店舗情報 & フードロス --- */}
          <section className="grid grid-cols-2 gap-4">
            <Link
              href="/deals"
              className="block text-center p-6 rounded-xl shadow-md transition transform hover:-translate-y-1 bg-gradient-to-r from-red-500 to-orange-500 text-white"
            >
              <RiStore2Line className="mx-auto text-4xl mb-2" />
              <span className="font-bold text-lg">店舗のお得情報</span>
            </Link>
            <Link
              href="/food-loss"
              className="block text-center p-6 rounded-xl shadow-md transition transform hover:-translate-y-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white"
            >
              <RiRecycleLine className="mx-auto text-4xl mb-2" />
              <span className="font-bold text-lg">フードロス情報</span>
            </Link>
          </section>

          {/* --- 広告 --- */}
          {isClient && (
            <section>
              <h2 className="text-lg font-bold text-gray-700 text-center mb-4">
                地域を応援する企業
              </h2>
              {/* ... 広告表示ロジック ... */}
            </section>
          )}

          {/* --- すべてのアプリ --- */}
          <section>
            <Link
              href="/apps/all"
              className="block text-center p-6 rounded-xl shadow-md transition transform hover:-translate-y-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white"
            >
              <RiLayoutGridFill className="mx-auto text-4xl mb-2" />
              <span className="font-bold text-lg">すべてのアプリを見る</span>
            </Link>
          </section>

          {/* --- フッター --- */}
          <footer className="text-center mt-8 pb-4">
            <Link
              href="/mypage"
              className="text-sm text-gray-600 hover:text-blue-600 hover:underline"
            >
              マイページに戻る
            </Link>
            <p className="text-xs text-gray-400 mt-4">© 2025 株式会社adtown</p>
          </footer>
        </main>
      </div>

      {/* --- 緊急連絡先モーダル --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-4 border-b">
              <h2 className="text-xl font-bold text-center">緊急連絡先</h2>
            </div>
            <div className="p-4 space-y-4">
              {emergencyContacts.map((contact) => (
                <a
                  key={contact.name}
                  href={contact.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <p className="font-bold text-blue-600">{contact.name}</p>
                  <a
                    href={`tel:${contact.number.replace('#', '')}`}
                    className="text-2xl font-bold text-gray-800 hover:underline"
                  >
                    {contact.number}
                  </a>
                  <p className="text-sm text-gray-500">{contact.description}</p>
                </a>
              ))}
            </div>
            <div className="p-4 border-t text-center">
              <button
                onClick={() => setIsModalOpen(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-6 rounded-lg"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- SSR認証処理 ---
export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const cookies = nookies.get(context);
    const token = await getAdminAuth().verifySessionCookie(cookies.token, false);
    const userDoc = await getAdminDb().collection('users').doc(token.uid).get();

    const userData = userDoc.data() || {};
    const userRole = userData.role;
    const subscriptionStatus = userData.subscriptionStatus;

    if (!userDoc.exists || (userRole !== 'user' && userRole !== 'admin')) {
      return { redirect: { destination: '/login', permanent: false } };
    }

    if (
      userRole === 'user' &&
      subscriptionStatus !== 'active' &&
      subscriptionStatus !== 'trialing'
    ) {
      return { redirect: { destination: '/subscribe', permanent: false } };
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
    return { redirect: { destination: '/login', permanent: false } };
  }
};

export default HomePage;

