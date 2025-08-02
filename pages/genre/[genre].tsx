import { GetStaticPaths, GetStaticProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { getAdminDb } from '../../lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// --- 型定義 ---
interface AppData {
  id: string;
  name: string;
}
interface GenrePageProps {
  apps: AppData[];
  genre: string;
}

// --- ページコンポーネント ---
const GenrePage: NextPage<GenrePageProps> = ({ apps, genre }) => {
  const pageTitle = `${genre}のアプリ一覧 | みんなの那須アプリ`;
  return (
    <div className="bg-blue-50 min-h-screen">
      <Head>
        <title>{pageTitle}</title>
      </Head>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-8">
            <Link href="/home" className="text-blue-600 hover:underline">
                ← アプリのジャンル選択に戻る
            </Link>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-blue-900 text-center mb-12">
          {genre}のアプリ
        </h1>
        {apps.length > 0 ? (
          // ▼▼▼ ここからデザインを修正しました ▼▼▼
          <div className="max-w-2xl mx-auto space-y-4">
            {apps.map((app) => (
              <Link key={app.id} href={`/app/${app.id}`} legacyBehavior>
                <a className="block w-full bg-white rounded-lg shadow-md p-4 text-center text-blue-700 font-semibold transition-colors hover:bg-gray-100 text-lg">
                  {app.name}
                </a>
              </Link>
            ))}
          </div>
          // ▲▲▲ ここまで ▲▲▲
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

// --- ビルド時に有効なジャンルのパスを生成 ---
export const getStaticPaths: GetStaticPaths = async () => {
  const adminDb = getAdminDb();
  if (!adminDb) {
    return { paths: [], fallback: 'blocking' };
  }
  try {
    const appsSnapshot = await adminDb.collection('apps').select('genre').get();
    const genres = new Set<string>();
    appsSnapshot.forEach(doc => {
      const genre = doc.data().genre;
      if (typeof genre === 'string' && genre) {
        genres.add(genre);
      }
    });
    const paths = Array.from(genres).map(genre => ({
      params: { genre },
    }));
    return { paths, fallback: 'blocking' };
  } catch (error) {
    console.error("Error in getStaticPaths for [genre]:", error);
    return { paths: [], fallback: false };
  }
};

// --- ビルド時に各ジャンルのページデータを取得 ---
export const getStaticProps: GetStaticProps = async (context) => {
  const adminDb = getAdminDb();
  if (!adminDb) {
    return { notFound: true };
  }
  try {
    const genre = context.params?.genre as string;
    if (!genre) {
      return { notFound: true };
    }
    const appsSnapshot = await adminDb.collection('apps').where('genre', '==', genre).get();
    const apps = appsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || '名称未設定',
      };
    });
    return {
      props: {
        apps: JSON.parse(JSON.stringify(apps)),
        genre,
      },
      revalidate: 60,
    };
  } catch (error) {
    console.error(`Error in getStaticProps for genre "${context.params?.genre}":`, error);
    return { notFound: true };
  }
};

export default GenrePage;







