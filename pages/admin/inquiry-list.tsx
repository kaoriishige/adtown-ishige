import { GetServerSideProps, NextPage } from 'next';
import Link from 'next/link';
import { useState } from 'react';
import { getAdminAuth, getAdminDb } from '../../lib/firebase-admin'; // ★ 修正点1: 新しいインポート
import nookies from 'nookies';
import { Timestamp } from 'firebase-admin/firestore'; // FirestoreのTimestamp型をインポート

// 型定義
type InquiryStatus = '新規' | '対応中' | '完了';

interface Inquiry {
  id: string;
  name: string;
  email: string;
  message: string;
  status: InquiryStatus;
  createdAt: string; // JSONで渡せるようにstring型に
}

interface InquiriesPageProps {
  initialInquiries: Inquiry[];
}

// ページコンポーネント
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
          {/* ... テーブルのヘッダー部分は変更なし ... */}
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
                <td className="px-6 py-4 border-b border-gray-200 whitespace-nowrap">{new Date(inquiry.createdAt).toLocaleString('ja-JP')}</td>
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

// サーバーサイドでのデータ取得
export const getServerSideProps: GetServerSideProps = async (context) => {
  // ★ 修正点2: 新しい方法でAuthとDBを呼び出す
  const adminAuth = getAdminAuth();
  const adminDb = getAdminDb();

  // 初期化失敗時のガード
  if (!adminAuth || !adminDb) {
    console.error("Firebase Admin on inquiry-list failed to initialize.");
    return { redirect: { destination: '/login', permanent: false } };
  }

  try {
    // 管理者認証
    const cookies = nookies.get(context);
    await adminAuth.verifyIdToken(cookies.token);

    // ★ 修正点3: Admin SDKを使ってFirestoreからデータを取得
    const inquiriesSnapshot = await adminDb.collection('inquiries').orderBy('createdAt', 'desc').get();

    const initialInquiries = inquiriesSnapshot.docs.map(doc => {
      const data = doc.data();
      // Admin SDKのTimestampを、ページに渡せるように文字列に変換
      const createdAtTimestamp = data.createdAt as Timestamp;
      return {
        id: doc.id,
        name: data.name || '',
        email: data.email || '',
        message: data.message || '',
        status: data.status || '新規',
        createdAt: createdAtTimestamp.toDate().toISOString(), // ISO文字列に変換
      };
    });

    return { props: { initialInquiries } };
  } catch (error) {
    console.error("Error fetching inquiries:", error);
    // 認証失敗時などはログインページへリダイレクト
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }
};

export default InquiriesPage;



