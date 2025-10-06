import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { adminDb, getPartnerUidFromCookie } from '../../lib/firebase-admin';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

// --- 型定義 ---
type ApplicationStatus = '新規' | '選考中' | '採用' | '不採用';

interface Applicant {
  id: string;
  jobTitle: string;
  applicantName: string;
  appliedDate: string;
  status: ApplicationStatus;
}

interface ApplicantsPageProps {
  applicants: Applicant[];
}

// --- サーバーサイド処理 ---
export const getServerSideProps: GetServerSideProps = async (context) => {
  const uid = await getPartnerUidFromCookie(context);
  if (!uid) {
    return { redirect: { destination: '/partner/login', permanent: false } };
  }

  // applicationsコレクションから自社への応募を取得
  // ※このコードはサンプルです。実際のデータ構造に合わせてクエリを調整してください。
  const applicationsSnapshot = await adminDb.collection('applications').where('partnerUid', '==', uid).orderBy('appliedAt', 'desc').get();
  
  const applicants: Applicant[] = applicationsSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      jobTitle: data.jobTitle || 'N/A',
      applicantName: data.applicantName || 'N/A',
      appliedDate: data.appliedAt.toDate().toLocaleDateString('ja-JP'),
      status: data.status || '新規',
    };
  });

  return {
    props: {
      applicants,
    },
  };
};


// --- ページコンポーネント ---
const ApplicantsPage: NextPage<ApplicantsPageProps> = ({ applicants: initialApplicants }) => {
  const [applicants, setApplicants] = useState(initialApplicants);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStatusChange = async (applicantId: string, newStatus: ApplicationStatus) => {
    setIsLoading(true);
    try {
      // Firestoreのドキュメントを更新
      const applicantRef = doc(db, 'applications', applicantId);
      await updateDoc(applicantRef, { status: newStatus });

      // フロントエンドの表示を更新
      setApplicants(prev => prev.map(app => app.id === applicantId ? { ...app, status: newStatus } : app));
    } catch (err) {
      console.error("ステータスの更新に失敗しました:", err);
      setError("ステータスの更新に失敗しました。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>応募者の確認・管理</title>
      </Head>
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">応募者の確認・管理</h1>
          <Link href="/recruit/dashboard" className="text-sm text-blue-600 hover:underline">
            ダッシュボードに戻る
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="overflow-x-auto">
            {applicants.length === 0 ? (
              <p className="text-gray-500 text-center py-8">現在、応募者はいません。</p>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">応募職種</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">応募者名</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">応募日</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ステータス</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {applicants.map((applicant) => (
                    <tr key={applicant.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{applicant.jobTitle}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{applicant.applicantName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{applicant.appliedDate}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <select
                          value={applicant.status}
                          onChange={(e) => handleStatusChange(applicant.id, e.target.value as ApplicationStatus)}
                          disabled={isLoading}
                          className="rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                        >
                          <option>新規</option>
                          <option>選考中</option>
                          <option>採用</option>
                          <option>不採用</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {error && <p className="text-red-500 mt-4">{error}</p>}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ApplicantsPage;