// pages/admin/inquiry-list.tsx

import { GetServerSideProps, NextPage } from 'next';
import Link from 'next/link';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useState } from 'react';
import { admin } from '../../lib/firebase-admin';
import nookies from 'nookies';

type InquiryStatus = '新規' | '対応中' | '完了';

interface Inquiry {
  id: string;
  name: string;
  email: string;
  message: string;
  status: InquiryStatus;
  createdAt: string;
}

interface InquiriesPageProps {
  initialInquiries: Inquiry[];
}

const InquiriesPage: NextPage<InquiriesPageProps> = ({ initialInquiries }) => {
  const [inquiries, setInquiries] = useState(initialInquiries);

  const handleStatusChange = async (inquiryId: string, newStatus: InquiryStatus) => {
    try {
      const response = await fetch('/api/inquiries/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inquiryId, newStatus }),
      });

      if (!response.ok) {
        throw new Error('ステータスの更新に失敗しました。');
      }
      
      // 画面上の表示を更新
      setInquiries(prevInquiries =>
        prevInquiries.map(inquiry =>
          inquiry.id === inquiryId ? { ...inquiry, status: newStatus } : inquiry
        )
      );
    } catch (error) {
      alert(error instanceof Error ? error.message : 'エラーが発生しました。');
    }
  };

  return (
    <div className="p-5">
      <Link href="/admin" className="text-blue-500 hover:underline">
        ← 管理メニューに戻る
      </Link>
      <h1 className="text-3xl font-bold my-6 text-center">問い合わせ管理</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow-md rounded-lg">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">日時</th>
              <th className="px-6 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">名前</th>
              <th className="px-6 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">メールアドレス</th>
              <th className="px-6 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">メッセージ（抜粋）</th>
              <th className="px-6 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ステータス</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {inquiries.map((inquiry) => (
              <tr key={inquiry.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 border-b border-gray-200 whitespace-nowrap">{inquiry.createdAt}</td>
                <td className="px-6 py-4 border-b border-gray-200 whitespace-nowrap">{inquiry.name}</td>
                <td className="px-6 py-4 border-b border-gray-200 whitespace-nowrap">
                  {/* ▼▼▼ メールアドレスをクリック可能に ▼▼▼ */}
                  <a href={`mailto:${inquiry.email}`} className="text-blue-600 hover:underline">{inquiry.email}</a>
                </td>
                <td className="px-6 py-4 border-b border-gray-200 text-sm">{inquiry.message.substring(0, 50)}...</td>
                <td className="px-6 py-4 border-b border-gray-200 whitespace-nowrap">
                  {/* ▼▼▼ ステータス変更ドロップダウンを追加 ▼▼▼ */}
                  <select
                    value={inquiry.status}
                    onChange={(e) => handleStatusChange(inquiry.id, e.target.value as InquiryStatus)}
                    className="p-2 border rounded-md"
                  >
                    <option value="新規">新規</option>
                    <option value="対応中">対応中</option>
                    <option value="完了">完了</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {inquiries.length === 0 && <p className="text-center mt-4">現在、新しい問い合わせはありません。</p>}
      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    // 管理者認証
    const cookies = nookies.get(context);
    await admin.auth().verifyIdToken(cookies.token);

    const inquiriesCollectionRef = collection(db, 'inquiries');
    const q = query(inquiriesCollectionRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    const initialInquiries = querySnapshot.docs.map(doc => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate();
      return {
        id: doc.id,
        name: data.name || '',
        email: data.email || '',
        message: data.message || '',
        status: data.status || '新規',
        createdAt: createdAt ? createdAt.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }) : '日付不明',
      };
    });

    return { props: { initialInquiries } };
  } catch (error) {
    console.error("Error fetching inquiries:", error);
    // 認証失敗時などはログインページへ
    if ((error as any).code === 'auth/id-token-expired' || (error as any).code === 'auth/argument-error') {
      return {
        redirect: {
          destination: '/login',
          permanent: false,
        },
      };
    }
    return { props: { initialInquiries: [] } };
  }
};

export default InquiriesPage;



