'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { db } from '../../../../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

type UserData = {
  email: string;
  name?: string;
  referrerId?: string;
};

export default function EditUserPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<UserData | null>(null);
  const [message, setMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetch = async () => {
      const ref = doc(db, 'users', params.id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setData(snap.data() as UserData);
      }
    };
    fetch();
  }, [params.id]);

  const handleChange = (field: keyof UserData, value: string) => {
    setData(prev => prev ? { ...prev, [field]: value } : prev);
  };

  const save = async () => {
    if (!data) return;
    await updateDoc(doc(db, 'users', params.id), data);
    setMessage('✅ 保存しました');
    setTimeout(() => setMessage(''), 2000);
  };

  if (!data) return <p className="p-4">読み込み中...</p>;

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-xl font-bold mb-4">ユーザー編集</h1>

      <label className="block font-semibold">メールアドレス</label>
      <input
        className="w-full p-2 border rounded mb-4"
        value={data.email}
        readOnly
      />

      <label className="block font-semibold">名前</label>
      <input
        className="w-full p-2 border rounded mb-4"
        value={data.name || ''}
        onChange={e => handleChange('name', e.target.value)}
      />

      <label className="block font-semibold">紹介者ID</label>
      <input
        className="w-full p-2 border rounded mb-4"
        value={data.referrerId || ''}
        onChange={e => handleChange('referrerId', e.target.value)}
      />

      <button
        className="bg-blue-600 text-white px-4 py-2 rounded"
        onClick={save}
      >
        保存
      </button>

      {message && <p className="mt-4 text-green-600">{message}</p>}
    </div>
  );
}
