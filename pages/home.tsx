import { NextPage, GetServerSideProps } from 'next';
import Head from 'next/head';
import nookies from 'nookies';
import { getAdminAuth } from '../lib/firebase-admin';

// --- 型定義 ---
interface TestPageProps {
  user: {
    email: string | null;
  };
  buildTimestamp: string; // ビルドされた日時
}

// --- テスト用のページコンポーネント ---
const HomeTestPage: NextPage<TestPageProps> = ({ user, buildTimestamp }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-yellow-100 p-4">
      <Head>
        <title>デプロイテストページ</title>
      </Head>
      <div className="bg-white p-10 rounded-lg shadow-2xl text-center">
        <h1 className="text-4xl font-black text-red-600 mb-4">
          これはテストページです
        </h1>
        <p className="text-lg text-gray-700">
          この画面が表示されていれば、最新のコードが正しくデプロイされています。
        </p>
        <div className="mt-6 border-t pt-6">
          <p className="text-sm text-gray-500">ログイン中のユーザー:</p>
          <p className="text-xl font-bold text-gray-900">{user.email}</p>
          <p className="text-sm text-gray-500 mt-4">最終ビルド日時:</p>
          <p className="text-xl font-bold text-blue-600">{buildTimestamp}</p>
        </div>
      </div>
    </div>
  );
};


// --- サーバーサイド処理 ---
export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const cookies = nookies.get(context);
    if (!cookies.token) {
      return { redirect: { destination: '/login', permanent: false } };
    }
    const token = await getAdminAuth().verifySessionCookie(cookies.token, true);

    // ビルドされた瞬間の日時を日本時間で生成
    const buildTimestamp = new Date().toLocaleString('ja-JP', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    return {
      props: {
        user: {
          email: token.email || null,
        },
        buildTimestamp, // ビルド日時をページに渡す
      },
    };
  } catch (err) {
    return { redirect: { destination: '/login', permanent: false } };
  }
};

export default HomeTestPage;

