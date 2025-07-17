import { useState, useEffect } from 'react';
import Link from 'next/link';

interface User {
  uid: string;
  email: string;
  displayName: string;
  lastSignInTime: string;
  creationTime: string;
}

const UserManagementPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/listUsers');
        const data = await response.json();
        if (data.users) {
          setUsers(data.users);
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <Link href="/admin">← 管理メニューに戻る</Link>
      <h1>ユーザー管理</h1>
      {isLoading ? (
        <p>ユーザー情報を読み込んでいます...</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f2f2f2' }}>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Email</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>表示名</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>最終ログイン</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>登録日</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.uid}>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{user.email}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{user.displayName || 'N/A'}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{new Date(user.lastSignInTime).toLocaleString()}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{new Date(user.creationTime).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default UserManagementPage;



