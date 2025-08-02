import { GetServerSideProps, NextPage } from 'next';
import Link from 'next/link';
import { useState } from 'react';
import { getAdminDb } from '../../lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { useRouter } from 'next/router';
import { signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';

// (型定義やページコンポーネントは変更ありません)
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
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleStatusChange = async (inquiryId: string, newStatus: InquiryStatus) => {
    // (この関数の中身は変更ありません)
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/logout');
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Logout failed', error);
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="p-5">
      <div className="flex justify-between items-center mb-6">
        <Link href="/admin" className="text-blue-500 hover:underline">
          ← 管理メニューに戻る
        </Link>
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400"
        >
          {isLoggingOut ? 'ログアウト中...' : 'ログアウト'}
        </button>
      </div>
      <h1 className="text-3xl font-bold my-6 text-center">問い合わせ管理</h1>
      {/* (テーブル表示部分は変更ありません) */}
    </div>
  );
};


// サーバーサイドでのデータ取得
export const getServerSideProps: GetServerSideProps = async (context) => {
  // ▼▼▼ ここからが修正箇所です ▼▼▼
  const adminDb = getAdminDb();

  if (!adminDb) {
    // DBに接続できない場合は空のデータを返す
    return { props: { initialInquiries: [] } };
  }

  try {
    // --- 認証チェックをすべて削除し、直接データを取得します ---
    const inquiriesSnapshot = await adminDb.collection('inquiries').orderBy('createdAt', 'desc').get();

    const initialInquiries = inquiriesSnapshot.docs.map(doc => {
      const data = doc.data();
      const createdAtTimestamp = data.createdAt as Timestamp;
      return {
        id: doc.id,
        name: data.name || '',
        email: data.email || '',
        message: data.message || '',
        status: data.status || '新規',
        createdAt: createdAtTimestamp.toDate().toISOString(),
      };
    });

    return { props: { initialInquiries: JSON.parse(JSON.stringify(initialInquiries)) } };
  } catch (error) {
    console.error("Error fetching inquiries:", error);
    // エラー時も空のデータを返す
    return { props: { initialInquiries: [] } };
  }
  // ▲▲▲ ここまで ▲▲▲
};

export default InquiriesPage;


