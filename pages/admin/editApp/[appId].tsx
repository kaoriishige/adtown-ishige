import { useState, useEffect } from 'react';
import { GetServerSideProps, NextPage } from 'next';
import { useRouter } from 'next/router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import Link from 'next/link';

// ジャンルの選択肢
const genres = [
  '生活情報', '健康支援', '節約・特売', '人間関係',
  '教育・学習', '子育て', '防災・安全', '診断・運勢',
  'エンタメ', '趣味・文化', 'その他'
];

// Propsの型を定義
interface AppData {
  id: string;
  name: string;
  genre: string;
  url: string;
}
interface EditAppPageProps {
  app: AppData | null;
}

const EditAppPage: NextPage<EditAppPageProps> = ({ app }) => {
  const router = useRouter();
  const [name, setName] = useState('');
  const [genre, setGenre] = useState('');
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [customGenre, setCustomGenre] = useState('');

  useEffect(() => {
    if (app) {
      setName(app.name);
      setUrl(app.url);
      if (genres.includes(app.genre)) {
        setGenre(app.genre);
      } else {
        setGenre('その他');
        setCustomGenre(app.genre);
      }
    }
  }, [app]);

  if (!app) {
    return <div>指定されたアプリが見つかりません。</div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let genreToSave = genre;
    if (genre === 'その他') {
      if (!customGenre.trim()) {
        alert('「その他」を選択した場合は、新しいジャンル名を入力してください。');
        return;
      }
      genreToSave = customGenre.trim();
    }
    if (!name.trim()) {
      alert('アプリ名を入力してください。');
      return;
    }
    setIsLoading(true);

    const appRef = doc(db, 'apps', app.id);
    try {
      await updateDoc(appRef, { name, genre: genreToSave, url });
      alert('アプリ情報を更新しました。');
      router.push('/admin/manageApps');
    } catch (error) {
      console.error("Error updating document: ", error);
      alert('更新中にエラーが発生しました。');
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <Link href="/admin/manageApps">← アプリ管理に戻る</Link>
      <h1>アプリ編集: {app.name}</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label>
            アプリ名:
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required style={{ width: '100%', padding: '8px' }}/>
          </label>
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label>
            ジャンル:
            <select value={genre} onChange={(e) => setGenre(e.target.value)} style={{ width: '100%', padding: '8px' }}>
              {genres.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </label>
        </div>
        {genre === 'その他' && (
          <div style={{ marginBottom: '15px', paddingLeft: '20px' }}>
            <label>
              新しいジャンル名:
              <input type="text" value={customGenre} onChange={(e) => setCustomGenre(e.target.value)} placeholder="新しいジャンル名を入力" style={{ width: '100%', padding: '8px' }}/>
            </label>
          </div>
        )}
        <div style={{ marginBottom: '15px' }}>
          <label>
            URL:
            <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/app/your-app" style={{ width: '100%', padding: '8px' }}/>
          </label>
        </div>
        <button type="submit" disabled={isLoading}>
          {isLoading ? '更新中...' : '更新する'}
        </button>
      </form>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { appId } = context.params!;
  try {
    const docRef = doc(db, 'apps', appId as string);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        props: {
          app: {
            id: docSnap.id,
            ...docSnap.data(),
          } as AppData,
        },
      };
    } else {
      return { notFound: true };
    }
  } catch (error) {
    console.error("Error fetching document:", error);
    return { notFound: true };
  }
};

export default EditAppPage;