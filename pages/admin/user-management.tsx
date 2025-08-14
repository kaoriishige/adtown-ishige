import { useEffect, useState } from 'react';
import { collection, getDocs, getFirestore } from 'firebase/firestore';
import { app } from '../../lib/firebase'; // Firebase appの初期化に合わせてパスを調整してください

// ユーザー情報の型定義
interface UserData {
  uid: string;
  email?: string;
  displayName?: string;
  creationTime?: string;
  lastSignInTime?: string; // この項目は現在利用していないため、将来的に削除または実装を検討
  role?: string; // 'partner' または 'general'
}

// ページコンポーネント
export default function UserManagement() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // 表示するユーザー種別を管理するstate ('all', 'partner', 'general')
  const [filter, setFilter] = useState<'all' | 'partner' | 'general'>('all');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const db = getFirestore(app);
        const usersCollection = await getDocs(collection(db, 'users'));
        
        const usersData = usersCollection.docs.map(doc => {
          const data = doc.data();
          return {
            uid: doc.id,
            email: data.email || 'N/A',
            displayName: data.partnerInfo?.storeName || data.name || 'N/A',
            creationTime: data.createdAt?.toDate()?.toLocaleDateString('ja-JP') || 'N/A',
            lastSignInTime: 'N/A',
            role: data.role || 'general',
          };
        });
        setUsers(usersData);
      } catch (err) {
        console.error('Failed to fetch users:', err);
        setError('ユーザー情報の取得に失敗しました。');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // 選択されたフィルターに基づいてユーザーリストを絞り込む
  const filteredUsers = users.filter(user => {
    if (filter === 'all') {
      return true; // 'all'の場合はすべてのユーザーを表示
    }
    return user.role === filter; // 'partner' or 'general'
  });

  // タブのスタイルを動的に変更するためのヘルパー関数
  const getButtonClass = (tabName: typeof filter) => {
    return filter === tabName
      ? 'bg-blue-600 text-white px-4 py-2 rounded-md shadow-md'
      : 'bg-white text-gray-700 px-4 py-2 rounded-md border hover:bg-gray-100 transition';
  };

  return (
    <div className="container mx-auto p-4 bg-gray-50 min-h-screen">
      <a href="/admin" className="text-blue-600 hover:underline">
        &larr; 管理メニューに戻る
      </a>
      <h1 className="text-3xl font-bold my-6 text-gray-800">ユーザー管理</h1>

      {/* --- ここから変更 --- */}
      {/* フィルターボタン */}
      <div className="flex space-x-2 mb-4">
        <button onClick={() => setFilter('all')} className={getButtonClass('all')}>
          すべて ({users.length})
        </button>
        <button onClick={() => setFilter('partner')} className={getButtonClass('partner')}>
          企業・店舗 ({users.filter(u => u.role === 'partner').length})
        </button>
        <button onClick={() => setFilter('general')} className={getButtonClass('general')}>
          一般 ({users.filter(u => u.role === 'general').length})
        </button>
      </div>
      {/* --- ここまで変更 --- */}

      {loading && <p>読み込み中...</p>}
      {error && <p className="text-red-500 bg-red-100 p-3 rounded-md">{error}</p>}

      {!loading && !error && (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-600">Email</th>
                <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-600">表示名</th>
                <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-600">種別</th>
                <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-600">登録日</th>
              </tr>
            </thead>
            <tbody>
              {/* --- ここから変更 (filteredUsers を使用) --- */}
              {filteredUsers.map((user) => (
                <tr key={user.uid} className="hover:bg-gray-50">
                  <td className="py-3 px-4 border-b text-sm text-gray-700">{user.email}</td>
                  <td className="py-3 px-4 border-b text-sm text-gray-700">{user.displayName}</td>
                  <td className="py-3 px-4 border-b text-sm text-center">
                    {user.role === 'partner' ? (
                      <span className="bg-green-200 text-green-800 font-semibold py-1 px-3 rounded-full text-xs">
                        企業・店舗
                      </span>
                    ) : (
                      <span className="bg-blue-200 text-blue-800 font-semibold py-1 px-3 rounded-full text-xs">
                        一般
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 border-b text-sm text-gray-700">{user.creationTime}</td>
                </tr>
              ))}
              {/* --- ここまで変更 --- */}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}



