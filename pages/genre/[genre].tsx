import { GetStaticProps, GetStaticPaths, NextPage } from 'next';
import Link from 'next/link';
// ▼▼▼ Firestoreの型をインポートします ▼▼▼
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';

// Appの型定義
type App = {
  id: string;
  name: string;
  description: string;
  // 他に必要なフィールドがあれば追加
};

// ページが受け取るpropsの型
interface GenrePageProps {
  apps: App[];
  genre: string;
}

const GenrePage: NextPage<GenrePageProps> = ({ apps, genre }) => {
  return (
    <div className="container mx-auto p-8">
      <Link href="/home" className="text-blue-500 hover:underline mb-8 inline-block">
        ← ホームに戻る
      </Link>
      <h1 className="text-4xl font-bold mb-2">ジャンル: {genre}</h1>
      <p className="text-gray-600 mb-8">このジャンルのアプリ一覧です。</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {apps.length > 0 ? (
          apps.map(app => (
            <div key={app.id} className="border rounded-lg p-6 shadow hover:shadow-lg transition-shadow">
              <h2 className="text-2xl font-bold">{app.name}</h2>
              <p className="text-gray-700 mt-2">{app.description}</p>
            </div>
          ))
        ) : (
          <p>このジャンルのアプリはまだありません。</p>
        )}
      </div>
    </div>
  );
};

// どのジャンルのページを事前に生成するかを決定する
export const getStaticPaths: GetStaticPaths = async () => {
  const admin = require('../../lib/firebase-admin').default;
  const db = admin.firestore();
  
  const appsSnapshot = await db.collection('apps').get();
  
  // ▼▼▼ docに型を指定します ▼▼▼
  const genres = new Set(appsSnapshot.docs.map((doc: QueryDocumentSnapshot) => doc.data().genre));
  
  const paths = Array.from(genres).map(genre => ({
    params: { genre: genre as string },
  }));

  return { paths, fallback: 'blocking' };
};

// 各ジャンルページのデータを取得する
export const getStaticProps: GetStaticProps = async (context) => {
  const admin = require('../../lib/firebase-admin').default;
  const db = admin.firestore();
  
  const genre = context.params?.genre as string;

  const appsSnapshot = await db.collection('apps').where('genre', '==', genre).get();
  
  // ▼▼▼ こちらのdocにも型を指定しておきます ▼▼▼
  const apps = appsSnapshot.docs.map((doc: QueryDocumentSnapshot) => ({
    id: doc.id,
    ...doc.data(),
  }));

  return {
    props: {
      apps,
      genre,
    },
    revalidate: 3600, // 1時間ごとにデータを更新
  };
};

export default GenrePage;








