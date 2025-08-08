import { GetServerSideProps, NextPage } from 'next';
import Link from 'next/link';
import nookies from 'nookies';
import { getAdminAuth, getAdminDb } from '../lib/firebase-admin';

// --- 型定義 ---
interface HomePageProps {
  content: {
    mainHeading: string;
    subheading: string;
  };
  user: {
    email: string;
  };
}

// --- ページコンポーネント ---
const HomePage: NextPage<HomePageProps> = ({ content, user }) => {
  const genres = [
    '生活情報', '健康支援', '節約・特売', '人間関係', '教育・学習',
    '子育て', '防災・安全', '診断・運勢', 'エンタメ', '趣味・文化'
  ];
  
  const primaryButtonClasses = "inline-block bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold px-8 py-4 rounded-full shadow-xl hover:scale-105 transition-all duration-300 transform text-md md:text-lg";

  return (
    <div className="bg-blue-50 min-h-screen p-5 text-center flex flex-col">
      <main className="flex-grow flex flex-col justify-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">{content.mainHeading}</h1>
          <p className="text-lg text-gray-600 mb-12">{content.subheading}</p>
          <p className="mb-12">ようこそ、{user.email}さん</p>

          <div className="flex flex-wrap justify-center gap-4">
            {genres.map(genre => (
              <Link
                key={genre}
                href={`/genre/${encodeURIComponent(genre)}`}
                className="px-5 py-2 bg-white border border-blue-300 text-blue-700 font-semibold rounded-full cursor-pointer shadow-md transition-all duration-300 hover:bg-blue-100 hover:shadow-lg hover:scale-110"
              >
                {genre}
              </Link>
            ))}
          </div>

          {/* ▼▼▼ このブロックを修正しました ▼▼▼ */}
          <div className="mt-12 flex flex-wrap justify-center gap-4">
            <Link href="/stores" className={primaryButtonClasses}>
              店舗のお得情報はこちら
            </Link>
            <Link href="/hair-salons" className={primaryButtonClasses}>
              那須の美容室・美容師を探す
            </Link>
            <Link href="/jobs" className={primaryButtonClasses}>
              那須エリアの求人情報
            </Link>
          </div>
          {/* ▲▲▲ ここまで ▲▲▲ */}

          <div className="mt-8">
            <Link
              href="/apps/all"
              className="inline-block bg-gradient-to-r from-blue-500 to-teal-400 text-white font-bold px-10 py-4 rounded-full shadow-xl hover:scale-105 transition-all duration-300 transform"
            >
              すべてのアプリを見る
            </Link>
          </div>
          
          <div className="mt-20">
            <Link href="/mypage" className="text-gray-600 hover:text-blue-600 hover:underline">
              マイページに戻る
            </Link>
          </div>
        </div>
      </main>
      <footer className="text-center text-xs text-gray-500 py-4">
        <Link href="/legal" className="hover:underline">特定商取引法に基づく表記</Link>
        <p className="mt-1">© 2025 株式会社adtown</p>
      </footer>
    </div>
  );
};

// --- サーバーサイドでのデータ取得と認証 ---
export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const cookies = nookies.get(context);
    const token = await getAdminAuth().verifySessionCookie(cookies.token, true);
    const { email } = token;

    const adminDb = getAdminDb();
    const docRef = adminDb.collection('siteContent').doc('landing');
    const docSnap = await docRef.get();
    
    const content = docSnap.exists
      ? docSnap.data()
      // Firestoreにデータがない場合のデフォルト値
      : { mainHeading: 'みんなの那須アプリ', subheading: '下記のジャンルからお選びください。' };

    return {
      props: {
        user: { email: email || '' },
        content: JSON.parse(JSON.stringify(content)),
      },
    };
  } catch (error) {
    // 認証に失敗した場合はログインページにリダイレクト
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }
};

export default HomePage;





