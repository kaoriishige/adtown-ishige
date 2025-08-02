import { GetServerSideProps, NextPage } from 'next';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Link from 'next/link';

// アプリデータの型を定義
interface AppData {
  id: string;
  name: string;
}

interface AllAppsPageProps {
  allApps: AppData[];
}

const AllAppsPage: NextPage<AllAppsPageProps> = ({ allApps }) => {
  return (
    <div className="bg-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
            <Link href="/home" className="text-blue-600 hover:underline">
                ← アプリのジャンル選択に戻る
            </Link>
        </div>

        <h1 className="text-4xl font-extrabold text-gray-900 text-center mb-10">
          すべてのアプリ一覧
        </h1>

        {/* ▼▼▼ ここからデザインを修正しました ▼▼▼ */}
        <div className="max-w-2xl mx-auto space-y-4">
          {allApps.map((app) => (
            <Link key={app.id} href={`/app/${app.id}`} legacyBehavior>
              <a className="block w-full bg-white rounded-lg shadow-md p-4 text-center text-blue-700 font-semibold transition-colors hover:bg-gray-100 text-lg">
                {app.name}
              </a>
            </Link>
          ))}
        </div>
        {/* ▲▲▲ ここまで ▲▲▲ */}

        <div className="text-center mt-16">
          <Link href="/mypage" className="text-gray-600 hover:text-blue-600 hover:underline">
            マイページに戻る
          </Link>
        </div>
      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    const appsCollectionRef = collection(db, 'apps');
    const q = query(appsCollectionRef, orderBy('name'));
    const querySnapshot = await getDocs(q);

    const allApps = querySnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name || '名称未設定',
      // descriptionとiconUrlは不要になったので削除
    }));

    return {
      props: {
        allApps,
      },
    };
  } catch (error) {
    console.error("Error fetching all apps:", error);
    return {
      props: {
        allApps: [],
      },
    };
  }
};

export default AllAppsPage;
