import { GetServerSideProps, NextPage } from 'next';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import Link from 'next/link';

// ジャンル選択肢
const genres = [
  '生活情報', '健康支援', '節約・特売', '人間関係',
  '教育・学習', '子育て', '防災・安全', '診断・運勢',
  'エンタメ', '趣味・文化', 'その他'
];

// アプリデータの型定義
interface App {
  id: string;
  name: string;
  genre: string;
  url: string;
  appNumber: number;
  createdAt: string; // 日付は文字列として受け取る
}

interface EditAppPageProps {
  app: App;
}

const EditAppPage: NextPage<EditAppPageProps> = ({ app }) => {
  const router = useRouter();
  const [name, setName] = useState(app.name);
  const [genre, setGenre] = useState(app.genre);
  const [url, setUrl] = useState(app.url);
  const [appNumber, setAppNumber] = useState(app.appNumber);
  const [isLoading, setIsLoading] = useState(false);
  const [customGenre, setCustomGenre] = useState('');

  // ジャンルが既存のリストにない場合、「その他」として扱う
  useEffect(() => {
    if (!genres.includes(app.genre)) {
      setGenre('その他');
      setCustomGenre(app.genre);
    }
  }, [app.genre]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let genreToSave = genre;
    if (genre === 'その他') {
      if (!customGenre.trim()) {
        alert('「その他」を選択した場合は、ジャンル名を入力してください。');
        return;
      }
      genreToSave = customGenre.trim();
    }
    setIsLoading(true);
    try {
      const appRef = doc(db, 'apps', app.id);
      await updateDoc(appRef, {
        name: name,
        genre: genreToSave,
        url: url,
        appNumber: Number(appNumber), // 数値型に変換して保存
      });
      alert('アプリ情報を更新しました。');
      router.push('/admin/manageApps');
    } catch (error) {
      console.error("更新エラー:", error);
      alert('更新中にエラーが発生しました。');
      setIsLoading(false);
    }
  };

  return (
    <div className="p-5 max-w-2xl mx-auto">
      <Link href="/admin/manageApps" className="text-blue-500 hover:underline">
        ← アプリ管理に戻る
      </Link>
      <h1 className="text-3xl font-bold my-6 text-center">アプリ編集</h1>
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">番号</label>
          <input type="number" value={appNumber} onChange={(e) => setAppNumber(Number(e.target.value))} required className="shadow appearance-none border rounded w-full py-2 px-3"/>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">アプリ名</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="shadow appearance-none border rounded w-full py-2 px-3"/>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">ジャンル</label>
          <select value={genre} onChange={(e) => setGenre(e.target.value)} required className="shadow appearance-none border rounded w-full py-2 px-3">
            {genres.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        {genre === 'その他' && (
          <div className="mb-4 pl-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">ジャンル名</label>
            <input type="text" value={customGenre} onChange={(e) => setCustomGenre(e.target.value)} placeholder="ジャンル名を入力" className="shadow appearance-none border rounded w-full py-2 px-3"/>
          </div>
        )}
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">URL</label>
          <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com" className="shadow appearance-none border rounded w-full py-2 px-3"/>
        </div>
        <div className="text-center">
          <button type="submit" disabled={isLoading} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            {isLoading ? '更新中...' : '更新する'}
          </button>
        </div>
      </form>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const { appId } = context.params as { appId: string };
    const appRef = doc(db, 'apps', appId);
    const appSnap = await getDoc(appRef);

    if (!appSnap.exists()) {
      return { notFound: true };
    }

    const data = appSnap.data();
    
    // --- ★★★ ここが重要な修正点 ★★★ ---
    // FirestoreのTimestampオブジェクトを、ページで扱える文字列に変換します
    const appData = {
      id: appSnap.id,
      name: data.name || '',
      genre: data.genre || '',
      url: data.url || '',
      appNumber: data.appNumber || 0,
      createdAt: data.createdAt?.toDate().toISOString() || null, // 日付を文字列に変換
    };

    return {
      props: {
        app: appData,
      },
    };
  } catch (error) {
    console.error("Error fetching app for edit:", error);
    return { notFound: true };
  }
};

export default EditAppPage;