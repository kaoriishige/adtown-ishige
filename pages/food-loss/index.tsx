import { NextPage, GetServerSideProps } from 'next'; // GetServerSideProps をインポート
import Link from 'next/link';
import Head from 'next/head';
import nookies from 'nookies'; // nookies をインポート
import { adminAuth, adminDb } from '../../lib/firebase-admin'; // firebase-admin をインポート

const FoodLossTopPage: NextPage = () => {
  const areas = [
    { name: '那須塩原市', path: 'nasushiobara' },
    { name: '大田原市', path: 'otawara' },
    { name: '那須町', path: 'nasu' },
  ];

  const buttonStyle = "block w-full max-w-lg text-center text-white font-bold py-5 px-6 my-4 rounded-lg shadow-md transition transform hover:scale-105 text-xl";

  return (
    <>
      <Head>
        <title>フードロス情報 - エリア選択</title>
      </Head>
      <div className="flex flex-col items-center justify-center min-h-screen bg-green-50 p-4">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-bold text-green-800">フードロス情報</h1>
          <p className="text-lg text-gray-600 mt-2">情報を確認したいエリアを選択してください</p>
        </header>

        <main className="w-full flex flex-col items-center">
          {areas.map((area) => (
            <Link 
              key={area.path} 
              href={`/food-loss/${area.path}`} 
              className={`${buttonStyle} bg-gradient-to-r from-green-500 to-teal-500`}
            >
              {area.name}
            </Link>
          ))}
        </main>

        <footer className="mt-12">
          <Link href="/home" className="text-blue-600 hover:underline">
            &larr; ホームに戻る
          </Link>
        </footer>
      </div>
    </>
  );
};

// ▼▼▼ ここから追加 ▼▼▼
export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const cookies = nookies.get(context);
    if (!cookies.token) {
      return { redirect: { destination: '/login', permanent: false } };
    }

    const token = await adminAuth.verifySessionCookie(cookies.token, true);
    const userDoc = await adminDb.collection('users').doc(token.uid).get();

    if (!userDoc.exists) {
      return { redirect: { destination: '/login', permanent: false } };
    }

    const userData = userDoc.data() || {};
    const userPlan = userData.plan || 'free';

    // 無料会員 (free) がこのページにアクセスしたら、無料トップページにリダイレクト
    if (userPlan === 'free') {
      return { redirect: { destination: '/home', permanent: false } };
    }

    // 有料会員はページを表示するためのpropsを返す（今回は空でOK）
    return {
      props: {},
    };

  } catch (error) {
    // エラーが発生した場合はログインページにリダイレクト
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }
};
// ▲▲▲ ここまで追加 ▲▲▲

export default FoodLossTopPage;