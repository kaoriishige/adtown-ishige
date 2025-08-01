import { GetServerSideProps, NextPage } from 'next';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../../lib/firebase'; // firebase.tsのパスを調整
import Link from 'next/link';
import Image from 'next/image'; // Imageコンポーネントは使いませんが、念のため残しておきます

// アプリデータの型を定義
interface AppData {
  id: string;
  name: string;
  description: string; // descriptionは使いませんが、型定義は残します
  iconUrl: string; // iconUrlは使いませんが、型定義は残します
}

interface AllAppsPageProps {
  allApps: AppData[];
}

const AllAppsPage: NextPage<AllAppsPageProps> = ({ allApps }) => {
  return (
    // ★変更点1: 背景を他のページと統一
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 to-blue-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* ★変更点2: 見出しのスタイルを統一 */}
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 text-center mb-12">
          すべてのアプリ一覧
        </h1>

        {/* ★変更点3: グリッド表示からリスト表示に変更 */}
        <div className="space-y-4">
          {allApps.map((app) => (
            <Link key={app.id} href={`/app/${app.id}`} legacyBehavior>
              <a className="block w-full bg-white p-5 rounded-lg shadow-md transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
                <h2 className="text-xl font-semibold text-slate-700">{app.name}</h2>
              </a>
            </Link>
          ))}
        </div>

        {/* マイページに戻るボタン */}
        <div className="text-center mt-16">
          <Link href="/mypage" className="font-semibold text-slate-700 hover:text-blue-700 hover:underline">
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
