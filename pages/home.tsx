import Link from 'next/link';
import { GetServerSideProps, NextPage } from 'next';
import { collection, doc, getDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

// Firestoreから取得するデータの型を定義
interface Genre {
  id: string;
  name: string;
}
interface HomePageProps {
  content: {
    mainHeading: string;
    subheading: string;
  };
  genres: Genre[]; // ジャンルリストの型を追加
}

const HomePage: NextPage<HomePageProps> = ({ content, genres }) => {
  return (
    <div className="bg-blue-50 min-h-screen p-5 text-center flex flex-col justify-center">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">{content.mainHeading}</h1>
        <p className="text-lg text-gray-600 mb-12">{content.subheading}</p>

        <div className="flex flex-wrap justify-center gap-4">
          {/* ▼▼▼ データベースから取得したジャンルを表示 ▼▼▼ */}
          {genres.map(genre => (
            <Link
              key={genre.id} // keyをidに変更
              href={`/genre/${encodeURIComponent(genre.name)}`}
              className="px-5 py-2 bg-white border border-blue-300 text-blue-700 font-semibold rounded-full cursor-pointer shadow-md transition-all duration-300 hover:bg-blue-100 hover:shadow-lg hover:scale-110"
            >
              {genre.name}
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

        <div className="mt-20">
          <Link href="/mypage" className="text-gray-600 hover:text-blue-600 hover:underline">
            マイページに戻る
          </Link>
        </div>
      </div>
    </div>
  );
};

// ▼▼▼ サーバーサイドの処理を修正 ▼▼▼
export const getServerSideProps: GetServerSideProps = async () => {
  try {
    // 見出しコンテンツの取得（既存の処理）
    const contentRef = doc(db, 'siteContent', 'landing');
    const contentSnap = await getDoc(contentRef);
    const content = contentSnap.exists()
      ? contentSnap.data()
      : { mainHeading: '（見出し未設定）', subheading: '（サブ見出し未設定）' };

    // ジャンルリストの取得（新しい処理）
    const genresQuery = query(collection(db, 'genres'), orderBy('name'));
    const genresSnapshot = await getDocs(genresQuery);
    const genres = genresSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
    }));

    // 取得した両方のデータをpropsとしてページに渡す
    return {
      props: {
        content: JSON.parse(JSON.stringify(content)),
        genres: JSON.parse(JSON.stringify(genres)),
      },
    };
  } catch (error) {
    console.error("Error fetching home page data:", error);
    // エラーが発生した場合もページが表示されるように、空のデータを渡す
    return { 
      props: { 
        content: { mainHeading: 'エラー', subheading: 'コンテンツの読み込みに失敗しました' },
        genres: [] 
      } 
    };
  }
};

export default HomePage;










