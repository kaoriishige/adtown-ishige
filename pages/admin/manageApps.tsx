import { GetServerSideProps, NextPage } from 'next';
import Link from 'next/link';
import { collection, getDocs, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useRouter } from 'next/router';

// アプリ１件のデータの型
interface App {
  id: string;
  name: string;
  genre: string;
}

// ページが受け取るpropsの型
interface ManageAppsProps {
  apps: App[];
}

const ManageAppsPage: NextPage<ManageAppsProps> = ({ apps }) => {
  const router = useRouter();

  const handleDelete = async (appId: string, appName: string) => {
    if (confirm(`本当にアプリ「${appName}」を削除しますか？この操作は元に戻せません。`)) {
      try {
        const appRef = doc(db, 'apps', appId);
        await deleteDoc(appRef);
        alert('アプリを削除しました。');
        router.reload();
      } catch (error) {
        console.error("Error removing document: ", error);
        alert('削除中にエラーが発生しました。');
      }
    }
  };

  return (
    <div className="p-5">
      <Link href="/admin" className="text-blue-500 hover:underline">
        ← 管理メニューに戻る
      </Link>
      <h1 className="text-3xl font-bold my-6 text-center">アプリ管理</h1>
      <div className="text-center mb-6">
          <Link href="/admin/addApp">
            <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
              新規アプリ追加
            </button>
          </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-100">
            <tr>
              {/* --- ★★★ ここを修正 ★★★ --- */}
              <th className="px-6 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-16 text-center">番号</th>
              <th className="px-6 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">アプリ名</th>
              <th className="px-6 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ジャンル</th>
              <th className="px-6 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody>
            {apps.map((app, index) => (
              <tr key={app.id} className="hover:bg-gray-50">
                {/* --- ★★★ ここを修正 ★★★ --- */}
                <td className="px-6 py-4 border-b border-gray-200 text-center">{index + 1}</td>
                <td className="px-6 py-4 border-b border-gray-200">{app.name}</td>
                <td className="px-6 py-4 border-b border-gray-200">{app.genre}</td>
                <td className="px-6 py-4 border-b border-gray-200">
                  <Link href={`/admin/editApp/${app.id}`}>
                    <button className="text-indigo-600 hover:text-indigo-900 mr-4">編集</button>
                  </Link>
                  <button onClick={() => handleDelete(app.id, app.name)} className="text-red-600 hover:text-red-900">削除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// サーバーサイドで全アプリのデータを取得する関数
export const getServerSideProps: GetServerSideProps = async () => {
  try {
    const appsCollectionRef = collection(db, 'apps');
    const q = query(appsCollectionRef, orderBy('name'));
    const querySnapshot = await getDocs(q);

    const apps = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || '',
        genre: data.genre || '',
      };
    });

    return {
      props: {
        apps,
      },
    };
  } catch (error) {
    console.error("Error fetching apps:", error);
    return {
      props: {
        apps: [],
      },
    };
  }
};

export default ManageAppsPage;

