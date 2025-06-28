'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type UserData = {
  email: string;
  displayName?: string;
  createdAt?: string;
};

export default function UsersPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [users, setUsers] = useState<UserData[]>([]);
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
      } else {
        router.push('/login');
      }
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    const fetchUsers = async () => {
      const snapshot = await getDocs(collection(db, 'users'));
      const usersData = snapshot.docs.map((doc) => ({
        email: doc.data().email || '',
        displayName: doc.data().displayName || '',
        createdAt: doc.data().createdAt || '',
      }));
      setUsers(usersData);
    };

    if (user) fetchUsers();
  }, [user]);

  if (loadingAuth) return <p className="p-6 text-gray-600">読み込み中...</p>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">ユーザー一覧</h1>

      <table className="w-full border text-sm">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="border px-3 py-2">メールアドレス</th>
            <th className="border px-3 py-2">表示名</th>
            <th className="border px-3 py-2">登録日</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u, i) => (
            <tr key={i} className="border-t">
              <td className="border px-3 py-2">{u.email}</td>
              <td className="border px-3 py-2">{u.displayName}</td>
              <td className="border px-3 py-2">{u.createdAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
