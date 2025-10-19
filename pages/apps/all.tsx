import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import nookies from 'nookies';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { QueryDocumentSnapshot } from 'firebase-admin/firestore';

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

// --- ページコンポーネント ---
const AllAppsPage: NextPage<AllAppsPageProps> = ({ allApps }) => {
  return (
    <>
      <Head>
        <title>{"すべてのアプリ一覧 - みんなの那須アプリ"}</title>
      </Head>
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
              <Link href="/home" className="text-blue-600 hover:underline">
                  ← ホームに戻る
              </Link>
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 text-center mb-10">
            すべてのアプリ一覧
          </h1>
          <section>
              <div className="max-w-2xl mx-auto space-y-4">
                {allApps.map((app) => (
                  <Link key={app.id} href={`/apps/${app.id}`} legacyBehavior>
                    <a className="block w-full bg-white rounded-lg shadow-md p-4 text-center text-blue-700 font-semibold transition-colors hover:bg-gray-100 text-lg">
                      {app.name}
                    </a>
                  </Link>
                ))}
              </div>
          </section>
          <div className="text-center mt-16">
            <Link href="/home" className="text-gray-600 hover:text-blue-600 hover:underline">
              ホームに戻る
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
    // トークンがなければログインページへ
    if (!cookies.token) {
        return { redirect: { destination: '/login', permanent: false } };
    }
    await adminAuth.verifySessionCookie(cookies.token, true);
    
    // ログインさえしていればOK

    const db = adminDb;
    const appsCollectionRef = db.collection('apps').withConverter(appConverter);
    const querySnapshot = await appsCollectionRef.orderBy('name').get();
    const allApps = querySnapshot.docs.map(doc => doc.data());

    return {
      props: {
        allApps: JSON.parse(JSON.stringify(allApps)),
      },
    };
  } catch (error) {
    // 認証に失敗した場合はログインページへリダイレクト
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }
};

export default AllAppsPage;