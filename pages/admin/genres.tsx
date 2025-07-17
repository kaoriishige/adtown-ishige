import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import Link from 'next/link';

interface Genre {
  id: string;
  name: string;
}

const GenresPage = () => {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [newGenreName, setNewGenreName] = useState('');
  const [editingGenre, setEditingGenre] = useState<Genre | null>(null);
  const [loading, setLoading] = useState(true);

  // Firestoreからジャンルのリストをリアルタイムで取得
  useEffect(() => {
    const q = query(collection(db, 'genres'), orderBy('name'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const genresData = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
      }));
      setGenres(genresData);
      setLoading(false);
    });

    return () => unsubscribe(); // クリーンアップ
  }, []);

  // 新しいジャンルを追加
  const handleAddGenre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newGenreName.trim() === '') return;
    await addDoc(collection(db, 'genres'), { name: newGenreName.trim() });
    setNewGenreName('');
  };

  // ジャンル名を更新
  const handleUpdateGenre = async () => {
    if (!editingGenre || editingGenre.name.trim() === '') return;
    const genreDoc = doc(db, 'genres', editingGenre.id);
    await updateDoc(genreDoc, { name: editingGenre.name.trim() });
    setEditingGenre(null);
  };

  // ジャンルを削除
  const handleDeleteGenre = async (id: string) => {
    if (window.confirm('このジャンルを本当に削除しますか？')) {
      await deleteDoc(doc(db, 'genres', id));
    }
  };

  if (loading) {
    return <p className="p-5 text-center">ジャンルを読み込んでいます...</p>;
  }

  return (
    <div className="p-5 max-w-2xl mx-auto">
      <Link href="/admin" className="text-blue-500 hover:underline">
        ← 管理メニューに戻る
      </Link>
      <h1 className="text-3xl font-bold my-6 text-center">ジャンル管理</h1>

      {/* 新規追加フォーム */}
      <form onSubmit={handleAddGenre} className="mb-8 bg-white shadow-md rounded p-6">
        <h2 className="text-xl font-semibold mb-4">新しいジャンルを追加</h2>
        <div className="flex gap-4">
          <input
            type="text"
            value={newGenreName}
            onChange={(e) => setNewGenreName(e.target.value)}
            placeholder="ジャンル名"
            className="flex-grow shadow appearance-none border rounded w-full py-2 px-3"
          />
          <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            追加
          </button>
        </div>
      </form>

      {/* ジャンル一覧 */}
      <div className="bg-white shadow-md rounded p-6">
        <h2 className="text-xl font-semibold mb-4">登録済みジャンル一覧</h2>
        <ul className="space-y-3">
          {genres.map((genre) => (
            <li key={genre.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              {editingGenre?.id === genre.id ? (
                <input
                  type="text"
                  value={editingGenre.name}
                  onChange={(e) => setEditingGenre({ ...editingGenre, name: e.target.value })}
                  className="flex-grow shadow appearance-none border rounded py-1 px-2"
                />
              ) : (
                <span className="text-gray-800">{genre.name}</span>
              )}

              <div className="flex gap-2">
                {editingGenre?.id === genre.id ? (
                  <>
                    <button onClick={handleUpdateGenre} className="text-sm bg-green-500 hover:bg-green-600 text-white py-1 px-2 rounded">保存</button>
                    <button onClick={() => setEditingGenre(null)} className="text-sm bg-gray-500 hover:bg-gray-600 text-white py-1 px-2 rounded">キャンセル</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setEditingGenre(genre)} className="text-sm bg-yellow-500 hover:bg-yellow-600 text-white py-1 px-2 rounded">編集</button>
                    <button onClick={() => handleDeleteGenre(genre.id)} className="text-sm bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded">削除</button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default GenresPage;