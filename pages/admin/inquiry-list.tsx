import { GetServerSideProps, NextPage } from 'next';
import Link from 'next/link';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';

// 問い合わせ1件のデータの型
interface Inquiry {
  id: string;
  name: string;
  email: string;
  message: string;
  status: '新規' | '対応中' | '完了';
  createdAt: string;
}

interface InquiriesPageProps {
  inquiries: Inquiry[];
}

const InquiriesPage: NextPage<InquiriesPageProps> = ({ inquiries }) => {
  return (
    <div className="p-5">
      <Link href="/admin" className="text-blue-500 hover:underline">
        ← 管理メニューに戻る
      </Link>
      <h1 className="text-3xl font-bold my-6 text-center">問い合わせ管理</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">日時</th>
              <th className="px-6 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">名前</th>
              <th className="px-6 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">メッセージ（抜粋）</th>
              <th className="px-6 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ステータス</th>
            </tr>
          </thead>
          <tbody>
            {inquiries.map((inquiry) => (
              <tr key={inquiry.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 border-b border-gray-200">{inquiry.createdAt}</td>
                <td className="px-6 py-4 border-b border-gray-200">{inquiry.name}</td>
                <td className="px-6 py-4 border-b border-gray-200">{inquiry.message.substring(0, 50)}...</td>
                <td className="px-6 py-4 border-b border-gray-200">{inquiry.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {inquiries.length === 0 && <p className="text-center mt-4">現在、新しい問い合わせはありません。</p>}
      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    const inquiriesCollectionRef = collection(db, 'inquiries');
    const q = query(inquiriesCollectionRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    const inquiries = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || '',
        email: data.email || '',
        message: data.message || '',
        status: data.status || '新規',
        // Timestampを文字列に変換
        createdAt: data.createdAt.toDate().toLocaleString('ja-JP'),
      };
    });

    return { props: { inquiries } };
  } catch (error) {
    console.error("Error fetching inquiries:", error);
    // inquiriesコレクションが存在しない場合もエラーになるので、空配列を返す
    return { props: { inquiries: [] } };
  }
};

export default InquiriesPage;


