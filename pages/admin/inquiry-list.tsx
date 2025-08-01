import { GetServerSideProps, NextPage } from 'next';
import Link from 'next/link';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useState } from 'react';
import nookies from 'nookies';
// ★ 変更点: 新しい関数をインポート
import { getAdminAuth } from '../../lib/firebase-admin';

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
                  <a href={`mailto:${inquiry.email}`} className="text-blue-600 hover:underline">{inquiry.email}</a>
                </td>
                <td className="px-6 py-4 border-b border-gray-200 text-sm">{inquiry.message.substring(0, 50)}...</td>
                <td className="px-6 py-4 border-b border-gray-200 whitespace-nowrap">
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

// ★ 変更点: getServerSidePropsを新しい関数形式に修正
export const getServerSideProps: GetServerSideProps = async (context) => {
  const adminAuth = getAdminAuth();
  if (!adminAuth) {
    console.error("Firebase Admin on InquiryList failed to initialize.");
    return { redirect: { destination: '/login', permanent: false } };
  }

  try {
    const cookies = nookies.get(context);
    await adminAuth.verifyIdToken(cookies.token);

    // 問い合わせデータの取得はクライアント側と同じdbインスタンスでOK
    // (サーバーサイドでFirestoreのルールをバイパスする必要がない場合)
    const inquiriesCollectionRef = collection(db, 'inquiries');
    const q = query(inquiriesCollectionRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    const initialInquiries = querySnapshot.docs.map(doc => {
      const data = doc.data();
      // FirestoreのTimestamp型を安全に日付文字列に変換
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : null;
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
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }
};

export default InquiriesPage;



