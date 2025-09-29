import { NextPage, GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import nookies from 'nookies';
import { adminAuth, adminDb } from '../../lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { useRouter } from 'next/router';

// --- 型定義 ---
interface Inquiry {
  id: string;
  name: string;
  email: string;
  message: string;
  status: 'pending' | 'resolved';
  createdAt: string; // シリアライズのために文字列にする
}

interface InquiryListPageProps {
  initialInquiries: Inquiry[];
}

// --- ダッシュボードページ本体 ---
const AdminInquiryListPage: NextPage<InquiryListPageProps> = ({ initialInquiries }) => {
    const [inquiries, setInquiries] = useState(initialInquiries);
    const router = useRouter();

    const handleStatusChange = async (id: string, newStatus: 'pending' | 'resolved') => {
        // TODO: ここにステータスを更新するAPI呼び出しを実装
        console.log(`Updating inquiry ${id} to ${newStatus}`);
        
        // UIを即時反映
        setInquiries(currentInquiries =>
            currentInquiries.map(inquiry =>
                inquiry.id === id ? { ...inquiry, status: newStatus } : inquiry
            )
        );
    };
    
    return (
        <div className="min-h-screen bg-gray-100">
            <Head>
                <title>問い合わせ管理</title>
            </Head>

            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-800">問い合わせ管理</h1>
                    <Link href="/admin" className="text-sm text-blue-600 hover:underline">
                        管理メニューへ戻る
                    </Link>
                </div>
            </header>

            <main className="max-w-screen-xl mx-auto p-4 sm:p-6 lg:p-8">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3">日時</th>
                                    <th scope="col" className="px-6 py-3">氏名</th>
                                    <th scope="col" className="px-6 py-3">メールアドレス</th>
                                    <th scope="col" className="px-6 py-3">ステータス</th>
                                    <th scope="col" className="px-6 py-3">詳細</th>
                                </tr>
                            </thead>
                            <tbody>
                                {inquiries.map((inquiry) => (
                                    <tr key={inquiry.id} className="bg-white border-b hover:bg-gray-50">
                                        <td className="px-6 py-4">{inquiry.createdAt}</td>
                                        <td className="px-6 py-4 font-medium text-gray-900">{inquiry.name}</td>
                                        <td className="px-6 py-4">{inquiry.email}</td>
                                        <td className="px-6 py-4">
                                            <select 
                                                value={inquiry.status} 
                                                onChange={(e) => handleStatusChange(inquiry.id, e.target.value as 'pending' | 'resolved')}
                                                className={`border text-sm rounded-lg block w-full p-2.5 ${inquiry.status === 'pending' ? 'bg-yellow-100 border-yellow-300 text-yellow-800' : 'bg-green-100 border-green-300 text-green-800'}`}
                                            >
                                                <option value="pending">未対応</option>
                                                <option value="resolved">対応済み</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4">
                                            {/* TODO: 詳細ページのリンク先を設定 */}
                                            <Link href={`/admin/inquiries/${inquiry.id}`} className="font-medium text-blue-600 hover:underline">
                                                確認する
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                     {inquiries.length === 0 && (
                        <p className="text-center text-gray-500 py-10">新しい問い合わせはありません。</p>
                    )}
                </div>
            </main>
        </div>
    );
};

// --- サーバーサイドでのデータ取得と認証 ---
export const getServerSideProps: GetServerSideProps = async (context) => {
    try {
        const cookies = nookies.get(context);
        if (!cookies.token) {
            return { redirect: { destination: '/admin/login', permanent: false } };
        }
        
        const token = await adminAuth.verifyIdToken(cookies.token, true);
        const userDoc = await adminDb.collection('users').doc(token.uid).get();

        if (!userDoc.exists || !userDoc.data()?.roles?.includes('admin')) {
            return { redirect: { destination: '/admin/login', permanent: false } };
        }
        
        // Firestoreから問い合わせ一覧を取得
        const inquiriesSnapshot = await adminDb.collection('inquiries').orderBy('createdAt', 'desc').get();
        const initialInquiries = inquiriesSnapshot.docs.map(doc => {
            const data = doc.data();
            const createdAt = data.createdAt as Timestamp;
            return {
                id: doc.id,
                name: data.name || '',
                email: data.email || '',
                message: data.message || '',
                status: data.status || 'pending',
                createdAt: createdAt.toDate().toLocaleString('ja-JP'), // シリアライズ可能な形式に変換
            };
        });

        return {
            props: {
                initialInquiries
            },
        };
    } catch (error) {
        return { redirect: { destination: '/admin/login', permanent: false } };
    }
};

export default AdminInquiryListPage;


