import { GetServerSideProps, NextPage } from 'next';
import Link from 'next/link'; // <a>の代わりにLinkをインポート
import nookies from 'nookies';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';

// --- 型定義 ---
interface User {
  uid: string;
  email: string;
  role: string;
  createdAt: string;
}

interface UserManagementProps {
  users: User[];
}

// --- ページコンポーネント ---
const UserManagementPage: NextPage<UserManagementProps> = ({ users }) => {
  return (
    <div className="p-5 max-w-4xl mx-auto">
      {/* ▼▼▼ ここを<a>から<Link>に修正しました ▼▼▼ */}
      <Link href="/admin" className="text-blue-500 hover:underline">
        ← 管理メニューに戻る
      </Link>
      <h1 className="text-3xl font-bold my-6 text-center">ユーザー管理</h1>

      <div className="overflow-x-auto bg-white shadow-md rounded-lg">
        <table className="min-w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 border-b-2 text-left text-xs font-semibold uppercase">メールアドレス</th>
              <th className="px-6 py-3 border-b-2 text-left text-xs font-semibold uppercase">役割</th>
              <th className="px-6 py-3 border-b-2 text-left text-xs font-semibold uppercase">登録日</th>
              <th className="px-6 py-3 border-b-2 text-left text-xs font-semibold uppercase">操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.uid} className="hover:bg-gray-50">
                <td className="px-6 py-4 border-b">{user.email}</td>
                <td className="px-6 py-4 border-b">
                  {user.role === 'partner' ? (
                    <span className="bg-green-200 text-green-800 font-semibold py-1 px-3 rounded-full text-xs">パートナー</span>
                  ) : (
                    <span className="bg-blue-200 text-blue-800 font-semibold py-1 px-3 rounded-full text-xs">一般</span>
                  )}
                </td>
                <td className="px-6 py-4 border-b">{user.createdAt}</td>
                <td className="px-6 py-4 border-b">
                  <button className="text-red-600 hover:underline">削除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const cookies = nookies.get(context);
    await getAdminAuth().verifySessionCookie(cookies.token, true);

    const adminDb = getAdminDb();
    const usersSnapshot = await adminDb.collection('users').orderBy('createdAt', 'desc').get();

    const users = usersSnapshot.docs.map(doc => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate()?.toLocaleDateString('ja-JP') || 'N/A';
      return {
        uid: doc.id,
        email: data.email || '',
        role: data.role || 'user',
        createdAt,
      };
    });

    return {
      props: {
        users: JSON.parse(JSON.stringify(users)),
      },
    };
  } catch (err) {
    return {
      redirect: {
        destination: '/admin/login',
        permanent: false,
      },
    };
  }
};

export default UserManagementPage;



