import { GetStaticProps, GetStaticPaths, NextPage } from 'next';
import Link from 'next/link';
import { admin } from '../../lib/firebase-admin'; // サーバー用のAdmin SDKをインポート

// Appの型定義
type App = {
  name: string;
  url: string;
  genre: string;
};

interface GenrePageProps {
  genre: string;
  apps: App[];
}

// getStaticPaths: 動的なルートを生成
export const getStaticPaths: GetStaticPaths = async () => {
  const db = admin.firestore();
  const appsSnapshot = await db.collection('apps').get();
  
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
    fallback: 'blocking',
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
  // createdAtが存在しない場合も安全に処理する
  const apps = querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      name: data.name || '',
      url: data.url || '',
      genre: data.genre || '',
      // createdAtが存在する場合のみ日付に変換し、なければnullにする
      createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
    };
  });

  return {
    props: {
      genre,
      // appsをJSONとして安全な形式に変換
      apps: JSON.parse(JSON.stringify(apps)),
    },
    revalidate: 60,
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







