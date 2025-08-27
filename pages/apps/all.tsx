import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import nookies from 'nookies';
// 手順1で作成したファイルを正しくインポートします
import { getAdminAuth, getAdminDb } from '../../lib/firebase-admin';
import { QueryDocumentSnapshot } from 'firebase-admin/firestore';

// アイコン用のライブラリ
import { FcGoogle } from 'react-icons/fc';
import { FaYahoo } from 'react-icons/fa';
import { IoSparklesSharp } from 'react-icons/io5';

// --- 型定義 ---
interface AppData {
  id: string;
  name: string;
}

const appConverter = {
  toFirestore: (app: AppData) => ({ name: app.name }),
  fromFirestore: (snapshot: QueryDocumentSnapshot): AppData => {
    const data = snapshot.data();
    return { id: snapshot.id, name: data.name || '名称未設定' };
  }
};

interface AllAppsPageProps {
  allApps: AppData[];
}

// --- 便利な検索ツールのデータ ---
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

// --- ページコンポーネント ---
const AllAppsPage: NextPage<AllAppsPageProps> = ({ allApps }) => {
  return (
    <>
      <Head>
        <title>アプリ・ツール - みんなの那須アプリ</title>
      </Head>
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
              <Link href="/home" className="text-blue-600 hover:underline">
                  ← アプリホームに戻る
              </Link>
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 text-center mb-10">
            アプリ・ツール
          </h1>
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">便利な検索ツール</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchTools.map((tool) => (
                <a key={tool.name} href={tool.href} target="_blank" rel="noopener noreferrer"
                  className={`group flex flex-col justify-between p-6 rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 ${tool.bgColor}`}>
                  <div>
                    <div className="flex items-center space-x-4">
                      <div className="text-4xl"><tool.Icon /></div>
                      <h3 className={`text-xl font-bold ${tool.textColor}`}>{tool.name}</h3>
                    </div>
                    <p className={`mt-3 text-sm ${tool.textColor} opacity-90`}>{tool.description}</p>
                  </div>
                  <div className={`mt-4 text-xs font-semibold ${tool.textColor} opacity-70 group-hover:opacity-100 transition-opacity`}>
                    外部サイトに移動 →
                  </div>
                </a>
              ))}
            </div>
          </section>
          <section>
              <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">すべてのアプリ一覧</h2>
              <div className="max-w-2xl mx-auto space-y-4">
                {allApps.map((app) => (
                  <Link key={app.id} href={`/app/${app.id}`} legacyBehavior>
                    <a className="block w-full bg-white rounded-lg shadow-md p-4 text-center text-blue-700 font-semibold transition-colors hover:bg-gray-100 text-lg">
                      {app.name}
                    </a>
                  </Link>
                ))}
              </div>
          </section>
          <div className="text-center mt-16">
            <Link href="/mypage" className="text-gray-600 hover:text-blue-600 hover:underline">
              マイページに戻る
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

// --- サーバーサイド処理 ---
export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const cookies = nookies.get(context);
    const token = await getAdminAuth().verifySessionCookie(cookies.token, true);
    const userDoc = await getAdminDb().collection('users').doc(token.uid).get();
    const userRole = userDoc.data()?.role;

    if (!userDoc.exists || (userRole !== 'user' && userRole !== 'admin')) {
      return { redirect: { destination: '/login', permanent: false } };
    }
    
    const db = getAdminDb();
    const appsCollectionRef = db.collection('apps').withConverter(appConverter);
    const querySnapshot = await appsCollectionRef.orderBy('name').get();
    const allApps = querySnapshot.docs.map(doc => doc.data());

    return {
      props: {
        allApps: JSON.parse(JSON.stringify(allApps)),
      },
    };
  } catch (error) {
    console.error("Error in getServerSideProps for all.tsx:", error);
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }
};

export default AllAppsPage;