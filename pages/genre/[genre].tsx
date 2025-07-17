import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';  // Firebaseの初期化が必要です
import { collection, query, where, getDocs } from 'firebase/firestore';

// App型を定義
type App = {
  name: string;
  url: string;
};

// getStaticPathsを追加：動的なジャンルページのルートを生成
export async function getStaticPaths() {
  // Firestoreからジャンルリストを取得
  const genreSnapshot = await getDocs(collection(db, 'apps'));
  const genres: string[] = [];

  genreSnapshot.docs.forEach(doc => {
    const genre = doc.data().genre;
    if (genre && !genres.includes(genre)) {
      genres.push(genre);
    }
  });

  // 重複のないジャンルのパスを作成
  const paths = genres.map((genre) => ({
    params: { genre },  // { genre: "人間関係" } など
  }));

  return {
    paths,
    fallback: false,  // pathsに指定されたもの以外は404
  };
}

// getStaticPropsを追加：ジャンルごとのアプリデータを取得
export async function getStaticProps({ params }: { params: { genre: string } }) {
  const genre = params.genre;

  // Firestoreから指定されたジャンルのアプリデータを取得
  const q = query(collection(db, 'apps'), where('genre', '==', genre));
  const querySnapshot = await getDocs(q);

  // アプリデータが存在しない場合に対応する
  const appsData = querySnapshot.docs.map((doc) => doc.data());

  if (appsData.length === 0) {
    return {
      notFound: true,  // もしデータがない場合、404ページに遷移
    };
  }

  return {
    props: {
      genre,
      apps: appsData,
    },
  };
}

export default function GenrePage({ genre, apps }: { genre: string; apps: App[] }) {
  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-blue-700 mb-4">{genre} のアプリ</h1>
      <ul className="space-y-3">
        {apps.map((app, index) => (
          <li key={index} className="bg-gray-100 p-4 rounded shadow hover:bg-gray-200">
            <a href={app.url} target="_blank" rel="noopener noreferrer" className="text-blue-700 font-semibold">
              {app.name}
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}




