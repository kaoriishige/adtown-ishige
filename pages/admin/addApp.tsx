import { useState } from 'react';
import { useRouter } from 'next/router';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Link from 'next/link';

// 元の正常に動作していたジャンル選択肢です
const genres = [
  '生活情報', '健康支援', '節約・特売', '人間関係',
  '教育・学習', '子育て', '防災・安全', '診断・運勢',
  'エンタメ', '趣味・文化', 'その他'
];

// 「新規アプリ追加」ページの、完成していたときの、正常なコードです。
const AddAppPage = () => {
  const router = useRouter();
  const [name, setName] = useState('');
  const [genre, setGenre] = useState(genres[0]);
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [customGenre, setCustomGenre] = useState('');

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
    setIsLoading(true);
    try {
      await addDoc(collection(db, 'apps'), {
        name: name,
        genre: genreToSave,
        url: url,
        createdAt: new Date(),
      });
      alert('新しいアプリを登録しました。');
      // 登録後、元の「アプリ管理」ページに戻るように修正しました
      router.push('/admin/manageApps'); 
    } catch (error) {
      alert('登録中にエラーが発生しました。');
      setIsLoading(false);
    }
  };

  return (
    <div className="p-5 max-w-2xl mx-auto">
      {/* リンク先も元のファイル名に戻しました */}
      <Link href="/admin/manageApps" className="text-blue-500 hover:underline">
        ← アプリ管理に戻る
      </Link>
      <h1 className="text-3xl font-bold my-6 text-center">新規アプリ追加</h1>
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <div className="mb-4">
          <label htmlFor="appName" className="block text-gray-700 text-sm font-bold mb-2">アプリ名</label>
          <input id="appName" type="text" value={name} onChange={(e) => setName(e.target.value)} required className="shadow appearance-none border rounded w-full py-2 px-3"/>
        </div>
        <div className="mb-4">
          <label htmlFor="appGenre" className="block text-gray-700 text-sm font-bold mb-2">ジャンル</label>
          <select id="appGenre" value={genre} onChange={(e) => setGenre(e.target.value)} required className="shadow appearance-none border rounded w-full py-2 px-3">
            {genres.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        {genre === 'その他' && (
          <div className="mb-4 pl-4">
            <label htmlFor="customGenre" className="block text-gray-700 text-sm font-bold mb-2">新しいジャンル名</label>
            <input id="customGenre" type="text" value={customGenre} onChange={(e) => setCustomGenre(e.target.value)} placeholder="新しいジャンル名を入力" className="shadow appearance-none border rounded w-full py-2 px-3"/>
          </div>
        )}
        <div className="mb-6">
          <label htmlFor="appUrl" className="block text-gray-700 text-sm font-bold mb-2">URL</label>
          <input id="appUrl" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com" className="shadow appearance-none border rounded w-full py-2 px-3"/>
        </div>
        <div className="text-center">
          <button type="submit" disabled={isLoading} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400">
            {isLoading ? '登録中...' : '登録する'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddAppPage;
