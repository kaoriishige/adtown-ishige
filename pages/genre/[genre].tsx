import { GetStaticProps, GetStaticPaths, NextPage } from 'next';
import Link from 'next/link';
import { admin } from '../../lib/firebase-admin'; // サーバー用のAdmin SDKをインポート

// Appの型定義にcreatedAtを追加
type App = {
  name: string;
  url: string;
  genre: string;
  createdAt: string; // 日付は文字列として扱う
};

interface GenrePageProps {
  genre: string;
  apps: App[];
}

// getStaticPaths: 動的なルートを生成
export const getStaticPaths: GetStaticPaths = async () => {
  const db = admin.firestore();
  const appsSnapshot = await db.collection('apps').get();
  
  // Setを使ってジャンルの重複をなくす
  const genres = new Set<string>();
  appsSnapshot.forEach(doc => {
    const genre = doc.data().genre;
    if (genre) {
      genres.add(genre);
    }
  });

  const paths = Array.from(genres).map((genre) => ({
    params: { genre },
  }));

  return {
    paths,
    fallback: 'blocking', // 'blocking'にすることで、新しいジャンルが追加されても対応可能
  };
};

// getStaticProps: ジャンルごとのアプリデータを取得
export const getStaticProps: GetStaticProps = async (context) => {
  const genre = context.params?.genre as string;
  if (!genre) {
    return { notFound: true };
  }

  const db = admin.firestore();
  const appsQuery = db.collection('apps').where('genre', '==', genre);
  const querySnapshot = await appsQuery.get();

  if (querySnapshot.empty) {
    return { notFound: true };
  }

  // ▼▼▼ ここがエラー解決の最重要ポイント ▼▼▼
  // データをページに渡す前に、日付(Timestamp)を安全な文字列に変換する
  const apps = querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      name: data.name || '',
      url: data.url || '',
      genre: data.genre || '',
      // TimestampをISO文字列に変換
      createdAt: data.createdAt.toDate().toISOString(),
    };
  });

  return {
    props: {
      genre,
      apps,
    },
    revalidate: 60, // 60秒ごとにデータを再生成
  };
};

const GenrePage: NextPage<GenrePageProps> = ({ genre, apps }) => {
  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-blue-700 mb-6">{genre} のアプリ</h1>
      <ul className="space-y-3">
        {apps.map((app, index) => (
          <li key={index} className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <a 
              href={app.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-blue-700 font-semibold hover:underline"
            >
              {app.name}
            </a>
          </li>
        ))}
      </ul>
      <div className="mt-8 text-center">
        <Link href="/home" className="text-gray-600 hover:text-blue-600 hover:underline">
          ジャンル選択に戻る
        </Link>
      </div>
    </main>
  );
};

export default GenrePage;






