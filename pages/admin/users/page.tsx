'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { db } from '../../../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

type User = {
  id: string;
  email: string;
  name?: string;
  referrerId?: string;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const snapshot = await getDocs(collection(db, 'users'));
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as User[];
      setUsers(list);
    };
    fetchUsers();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-xl font-bold mb-4">ユーザー一覧</h1>
      <ul className="space-y-4">
        {users.map(user => (
          <li key={user.id} className="border p-4 rounded">
            <p className="font-semibold">{user.email}</p>
            <p className="text-sm text-gray-500">
              紹介者ID: {user.referrerId || 'なし'}
            </p>
            <Link
              href={`/admin/users/${user.id}/edit`}
              className="text-blue-600 underline text-sm"
            >
              詳細・編集
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
