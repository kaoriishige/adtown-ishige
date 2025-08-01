import { GetStaticPaths, GetStaticProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { adminDb } from '../../lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import AppCard from '../../components/AppCard'; // あなたのAppCardコンポーネントのパス

// --- 型定義 ---
// ページに渡される、安全に変換済みのアプリデータの型
interface AppData {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  // 他のフィールドがあればここに追加（日付はstring型に）
}
// ページコンポーネントが受け取るPropsの型
interface GenrePageProps {
  apps: AppData[];
  genre: string;
}

// --- ページコンポーネント ---
const GenrePage: NextPage<GenrePageProps> = ({ apps, genre }) => {
  const pageTitle = `${genre}のアプリ一覧 | みんなの那須アプリ`;
  return (
    <div className="bg-gray-50 min-h-screen">
      <Head>
        <title>{pageTitle}</title>
      </Head>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 text-center mb-12">
          {genre}のアプリ
        </h1>
        {apps.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {apps.map((app) => (
              <AppCard
                key={app.id}
                id={app.id}
                name={app.name}
                description={app.description}
                iconUrl={app.iconUrl}
              />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500">このジャンルのアプリはまだありません。</p>
        )}
        <div className="text-center mt-16">
          <Link href="/apps/all" className="text-sm sm:text-base text-gray-600 hover:text-blue-600 hover:underline">
            すべてのアプリ一覧へ
          </Link>
        </div>
      </main>
    </div>
  );
};

// --- データ取得 (ビルド時) ---
export const getStaticPaths: GetStaticPaths = async () => {
  try {
    const appsSnapshot = await adminDb.collection('apps').select('genre').get();
    
    // Firestoreから取得したデータから、有効なジャンル名の文字列だけを安全に抽出
    const genres: string[] = [];
    appsSnapshot.forEach(doc => {
      const genre = doc.data().genre;
      if (typeof genre === 'string' && genre) {
        genres.push(genre);
      }
    });

    const uniqueGenres = [...new Set(genres)];

    const paths = uniqueGenres.map(genre => ({
      params: { genre },
    }));

    return { paths, fallback: 'blocking' }; // fallbackを'blocking'にすると、新しいジャンルが追加されても表示できる
  } catch (error) {
    console.error("Error in getStaticPaths for [genre]:", error);
    return { paths: [], fallback: false };
  }
};

export const getStaticProps: GetStaticProps = async (context) => {
  try {
    const genre = context.params?.genre as string;

    if (!genre) {
      return { notFound: true };
    }

    const appsSnapshot = await adminDb.collection('apps').where('genre', '==', genre).get();

    // FirestoreのデータをJSONに変換可能な形式にシリアライズ（変換）する
    const apps = appsSnapshot.docs.map(doc => {
      const data = doc.data();
      const appData: { [key: string]: any } = { id: doc.id };
      for (const key in data) {
        const value = data[key];
        // TimestampオブジェクトはISO文字列に変換、それ以外はそのまま
        if (value instanceof Timestamp) {
          appData[key] = value.toDate().toISOString();
        } else {
          appData[key] = value;
        }
      }
      return appData;
    });

    return {
      props: {
        apps: apps as AppData[],
        genre,
      },
      revalidate: 60, // 60秒ごとにデータを再検証
    };
  } catch (error) {
    console.error(`Error in getStaticProps for genre "${context.params?.genre}":`, error);
    return { notFound: true };
  }
};

export default GenrePage;







