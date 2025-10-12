import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { getPartnerUidFromCookie, adminDb } from '@/lib/firebase-admin';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// --- 型定義 ---
interface JobPageProps {
  partnerData: {
    uid: string;
    companyName: string;
  };
}

// --- サーバーサイド処理 ---
export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const uid = await getPartnerUidFromCookie(context);
    if (!uid) {
      return { redirect: { destination: '/partner/login', permanent: false } };
    }
    const userDoc = await adminDb.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return { redirect: { destination: '/partner/login?error=user_not_found', permanent: false } };
    }
    const userData = userDoc.data()!;
    if (!userData.roles?.includes('recruit')) {
      return { redirect: { destination: '/partner/login?error=permission_denied_recruit', permanent: false } };
    }
    return {
      props: {
        partnerData: {
          uid: userDoc.id,
          companyName: userData.companyName || userData.storeName || '',
        },
      },
    };
  } catch (error) {
    console.error('Jobs page getServerSideProps error:', error);
    return { redirect: { destination: '/partner/login', permanent: false } };
  }
};

// --- ページコンポーネント ---
const ManageJobsPage: NextPage<JobPageProps> = ({ partnerData }) => {
  const router = useRouter();
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    if (!jobTitle || !jobDescription) {
        setError('役職名と仕事内容は必須です。');
        setIsLoading(false);
        return;
    }

    try {
        // 'jobs' コレクションに新しい求人情報を追加
        const docRef = await addDoc(collection(db, 'jobs'), {
            uid: partnerData.uid,
            companyName: partnerData.companyName,
            title: jobTitle,
            description: jobDescription,
            published: true, // デフォルトで公開
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        setSuccess(`求人情報が正常に登録されました。(ID: ${docRef.id})`);
        // フォームをリセット
        setJobTitle('');
        setJobDescription('');
    } catch (err: any) {
        setError('求人情報の登録に失敗しました。時間をおいて再度お試しください。');
        console.error('Job submission error:', err);
    } finally {
        setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>求人情報の登録・管理</title>
      </Head>
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">求人情報の登録・管理</h1>
            <Link href="/recruit/dashboard" className="text-sm text-blue-600 hover:underline">
                ダッシュボードに戻る
            </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-gray-800 mb-6">新しい求人を登録する</h2>

            {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md"><p>{error}</p></div>}
            {success && <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-md"><p>{success}</p></div>}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="job-title" className="block text-sm font-medium text-gray-700">役職名 / タイトル</label>
                    <input
                        type="text"
                        id="job-title"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="例：ホールスタッフ、Webデザイナー"
                    />
                </div>

                <div>
                    <label htmlFor="job-description" className="block text-sm font-medium text-gray-700">仕事内容</label>
                    <textarea
                        id="job-description"
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        rows={8}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="具体的な仕事内容、応募資格、勤務時間、給与などを記載してください。"
                    />
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
                    >
                        {isLoading ? '登録中...' : 'この内容で求人を登録する'}
                    </button>
                </div>
            </form>
        </div>

        {/* 将来的に登録済み求人一覧を表示するセクション */}
        <div className="mt-12 bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">登録済みの求人一覧</h2>
            <div className="border-t border-gray-200 pt-4">
                <p className="text-gray-500">現在、登録済みの求人はありません。</p>
                {/* ここにデータベースから取得した求人情報をリスト表示するコードを追加します */}
            </div>
        </div>
      </main>
    </div>
  );
};

export default ManageJobsPage;