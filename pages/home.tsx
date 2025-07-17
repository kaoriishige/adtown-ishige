import Link from 'next/link';
import { GetServerSideProps, NextPage } from 'next';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

// ジャンルのリスト
const genres = [
  '生活情報', '健康支援', '節約・特売', '人間関係', '教育・学習',
  '子育て', '防災・安全', '診断・運勢', 'エンタメ', '趣味・文化'
];

// ページが受け取るデータの型を定義
interface HomePageProps {
  content: {
    mainHeading: string;
    subheading: string;
  }
}

const HomePage: NextPage<HomePageProps> = ({ content }) => {
  return (
    <div className="bg-blue-50 min-h-screen p-5 text-center flex flex-col justify-center">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">{content.mainHeading}</h1>
        <p className="text-lg text-gray-600 mb-12">{content.subheading}</p>

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

        <div className="mt-16">
          <Link
            href="/apps/all"
            className="inline-block bg-gradient-to-r from-blue-500 to-teal-400 text-white font-bold px-10 py-4 rounded-full shadow-xl hover:scale-105 transition-all duration-300 transform"
          >
            すべてのアプリを見る
          </Link>
        </div>

        {/* ▼▼ ここから「マイページに戻る」ボタンを追加 ▼▼ */}
        <div className="mt-20">
          <Link href="/mypage" className="text-gray-600 hover:text-blue-600 hover:underline">
            マイページに戻る
          </Link>
        </div>
        {/* ▲▲ ここまで追加 ▲▲ */}

      </div>
    </div>
  );
};

// サーバーサイドでFirestoreからランディングページのデータを取得
export const getServerSideProps: GetServerSideProps = async () => {
  try {
    const docRef = doc(db, 'siteContent', 'landing');
    const docSnap = await getDoc(docRef);
    const content = docSnap.exists()
      ? docSnap.data()
      : { mainHeading: '（見出し未設定）', subheading: '（サブ見出し未設定）' };

    return {
      props: {
        content: JSON.parse(JSON.stringify(content)),
      },
    };
  } catch (error) {
    console.error("Error fetching landing page content:", error);
    const content = { mainHeading: 'エラー', subheading: 'コンテンツの読み込みに失敗しました' };
    return { props: { content } };
  }
};

export default HomePage;










