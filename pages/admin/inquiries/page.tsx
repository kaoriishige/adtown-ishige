'use client';

import { useEffect, useState } from 'react';
import { db } from '../../../lib/firebase';
import { collection, getDocs, Timestamp } from 'firebase/firestore';

type Inquiry = {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: Timestamp;
};

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);

  useEffect(() => {
    const fetchInquiries = async () => {
      const snapshot = await getDocs(collection(db, 'inquiries'));
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Inquiry[];
      // createdAt を日付でソート
      list.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
      setInquiries(list);
    };
    fetchInquiries();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-xl font-bold mb-4">お問い合わせ一覧</h1>

      {inquiries.length === 0 ? (
        <p>問い合わせがまだありません。</p>
      ) : (
        <ul className="space-y-4">
          {inquiries.map(inquiry => (
            <li key={inquiry.id} className="border p-4 rounded">
              <p className="font-bold">{inquiry.name}（{inquiry.email}）</p>
              <p className="text-sm text-gray-600">
                {inquiry.createdAt?.toDate().toLocaleString() || '日時不明'}
              </p>
              <p className="mt-2 whitespace-pre-wrap">{inquiry.message}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
