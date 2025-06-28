'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type Inquiry = {
  email: string;
  message: string;
  createdAt: any;
};

export default function InquiriesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
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
    const fetchInquiries = async () => {
      const snapshot = await getDocs(collection(db, 'inquiries'));
      const data: Inquiry[] = snapshot.docs.map((doc) => {
        const d = doc.data();
        return {
          email: d.email || '',
          message: d.message || '',
          createdAt: d.createdAt?.toDate?.() || null,
        };
      });
      setInquiries(data);
    };

    if (user) fetchInquiries();
  }, [user]);

  if (loadingAuth) return <p className="p-6 text-gray-600">読み込み中...</p>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">お問い合わせ一覧</h1>

      {inquiries.length === 0 ? (
        <p className="text-gray-600">まだお問い合わせはありません。</p>
      ) : (
        <table className="w-full border text-sm">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="border px-3 py-2">メールアドレス</th>
              <th className="border px-3 py-2">メッセージ</th>
              <th className="border px-3 py-2">送信日時</th>
            </tr>
          </thead>
          <tbody>
            {inquiries.map((inq, i) => (
              <tr key={i}>
                <td className="border px-3 py-2">{inq.email}</td>
                <td className="border px-3 py-2">{inq.message}</td>
                <td className="border px-3 py-2">
                  {inq.createdAt ? inq.createdAt.toLocaleString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
