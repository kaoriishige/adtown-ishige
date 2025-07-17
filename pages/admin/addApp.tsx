import { useState } from 'react';
import { useRouter } from 'next/router';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Link from 'next/link';

// ジャンルの選択肢
const genres = [
  '生活情報', '健康支援', '節約・特売', '人間関係',
  '教育・学習', '子育て', '防災・安全', '診断・運勢',
  'エンタメ', '趣味・文化', 'その他' // ← 「その他」が選択肢にあることを確認
];

const AddAppPage = () => {
  const router = useRouter();
  const [name, setName] = useState('');
  const [genre, setGenre] = useState(genres[0]);
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  //【変更点1】その他ジャンル用のstateを追加
  const [customGenre, setCustomGenre] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    //【変更点2】保存するジャンル名を決定するロジック
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

    try {
      await addDoc(collection(db, 'apps'), {
        name: name,
        genre: genreToSave, // ← 保存するジャンル名を変更
        url: url,
      });
      alert('新しいアプリを登録しました。');
      router.push('/admin/manageApps');
    } catch (error) {
      console.error("Error adding document: ", error);
      alert('登録中にエラーが発生しました。');
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <Link href="/admin/manageApps">← アプリ管理に戻る</Link>
      <h1>新規アプリ追加</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label>
            アプリ名:
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{ width: '100%', padding: '8px' }}
            />
          </label>
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label>
            ジャンル:
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              style={{ width: '100%', padding: '8px' }}
            >
              {genres.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </label>
        </div>

        {/* 【変更点3】「その他」が選ばれた時だけ表示される入力欄 */}
        {genre === 'その他' && (
          <div style={{ marginBottom: '15px', paddingLeft: '20px' }}>
            <label>
              新しいジャンル名:
              <input
                type="text"
                value={customGenre}
                onChange={(e) => setCustomGenre(e.target.value)}
                placeholder="新しいジャンル名を入力"
                style={{ width: '100%', padding: '8px' }}
              />
            </label>
          </div>
        )}

        <div style={{ marginBottom: '15px' }}>
          <label>
            URL:
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/app/your-app"
              style={{ width: '100%', padding: '8px' }}
            />
          </label>
        </div>
        <button type="submit" disabled={isLoading}>
          {isLoading ? '登録中...' : '登録する'}
        </button>
      </form>
    </div>
  );
};

export default AddAppPage;

