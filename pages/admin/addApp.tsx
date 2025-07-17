import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Link from 'next/link';

// Firestoreから取得するジャンルの型を定義
interface Genre {
  id: string;
  name: string;
}

const AddAppPage = () => {
  const router = useRouter();
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // ▼▼▼ 変更点 ▼▼▼
  // ジャンルリストをFirestoreから取得して格納するstate
  const [genres, setGenres] = useState<Genre[]>([]); 
  // 選択されたジャンルを格納するstate
  const [selectedGenre, setSelectedGenre] = useState(''); 

  // ページ読み込み時にFirestoreからジャンルを取得
  useEffect(() => {
    const fetchGenres = async () => {
      const q = query(collection(db, 'genres'), orderBy('name'));
      const querySnapshot = await getDocs(q);
      const genresData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
      }));
      setGenres(genresData);
    };
    fetchGenres();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('アプリ名を入力してください。');
      return;
    }
    // ▼▼▼ 変更点 ▼▼▼
    if (!selectedGenre) {
      alert('ジャンルを選択してください。');
      return;
    }
    
    setIsLoading(true);

    try {
      await addDoc(collection(db, 'apps'), {
        name: name.trim(),
        genre: selectedGenre, // ← 選択されたジャンルを保存
        url: url.trim(),
        createdAt: new Date(), // 登録日を追加
      });
      alert('新しいアプリを登録しました。');
      router.push('/admin/app-management'); // アプリ管理一覧ページへ
    } catch (error) {
      console.error("Error adding document: ", error);
      alert('登録中にエラーが発生しました。');
      setIsLoading(false);
    }
  };

  return (
    <div className="p-5 max-w-2xl mx-auto">
      <Link href="/admin/app-management" className="text-blue-500 hover:underline">
        ← アプリ管理に戻る
      </Link>
      <h1 className="text-3xl font-bold my-6 text-center">新規アプリ追加</h1>
      
      {/* ▼▼▼ UIをTailwind CSSで刷新 ▼▼▼ */}
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <div className="mb-4">
          <label htmlFor="appName" className="block text-gray-700 text-sm font-bold mb-2">
            アプリ名
          </label>
          <input
            id="appName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="appGenre" className="block text-gray-700 text-sm font-bold mb-2">
            ジャンル
          </label>
          <select
            id="appGenre"
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            required
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="" disabled>ジャンルを選択してください</option>
            {genres.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
          </select>
        </div>

        <div className="mb-6">
          <label htmlFor="appUrl" className="block text-gray-700 text-sm font-bold mb-2">
            URL
          </label>
          <input
            id="appUrl"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/app/your-app"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        
        <div className="text-center">
          <button type="submit" disabled={isLoading} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-gray-400">
            {isLoading ? '登録中...' : '登録する'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddAppPage;

