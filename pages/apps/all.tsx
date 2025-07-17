import { GetServerSideProps, NextPage } from 'next';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../../lib/firebase'; // firebase.tsのパスを調整
import Link from 'next/link';
import Image from 'next/image';

// アプリデータの型を定義
interface AppData {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
}

interface AllAppsPageProps {
  allApps: AppData[];
}

const AllAppsPage: NextPage<AllAppsPageProps> = ({ allApps }) => {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-extrabold text-gray-900 text-center mb-10">
          すべてのアプリ一覧
        </h1>

        {/* アプリ一覧のグリッド表示 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {allApps.map((app) => (
            <Link key={app.id} href={`/app/${app.id}`} legacyBehavior>
              <a className="bg-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-2xl flex flex-col">
                <div className="relative w-full h-40">
                  <Image
                    src={app.iconUrl || '/default-icon.png'} // デフォルト画像を指定
                    alt={`${app.name} icon`}
                    layout="fill"
                    objectFit="cover"
                  />
                </div>
                <div className="p-6 flex-grow">
                  <h2 className="text-xl font-bold text-gray-800 mb-2">{app.name}</h2>
                  <p className="text-gray-600 text-sm line-clamp-3">{app.description}</p>
                </div>
              </a>
            </Link>
          ))}
        </div>

        {/* マイページに戻るボタン */}
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
    // 'apps'コレクションからすべてのドキュメントを取得（名前順で並び替え）
    const appsCollectionRef = collection(db, 'apps');
    const q = query(appsCollectionRef, orderBy('name'));
    const querySnapshot = await getDocs(q);

    const allApps = querySnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name || '名称未設定',
      description: doc.data().description || '説明未設定',
      iconUrl: doc.data().iconUrl || '',
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
