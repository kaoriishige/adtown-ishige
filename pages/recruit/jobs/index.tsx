import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { getAuth, signOut } from 'firebase/auth';
import { app, db } from '@/lib/firebase';
import { adminDb, adminAuth } from '@/lib/firebase-admin'; // ★修正
import { doc, updateDoc } from 'firebase/firestore';
import * as admin from 'firebase-admin';
import nookies from 'nookies'; // ★追加
import {
  RiAddLine, RiEdit2Line, RiPauseLine, RiPlayLine, RiLogoutBoxRLine,
  RiCheckboxCircleLine, RiCloseCircleLine, RiTimeLine, RiErrorWarningLine, RiArrowLeftLine
} from 'react-icons/ri';

// --- 型定義 ---
interface Job {
  id: string;
  jobTitle: string;
  status: 'active' | 'paused' | 'pending_review' | 'rejected';
  aiFeedback?: string;
}

interface JobsPageProps {
  companyName: string;
  jobs: Job[];
}

// --- SSR: サーバーサイドでのデータ取得 ---
export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    // ★★★ ここから修正 ★★★
    const cookies = nookies.get(context);
    const token = await adminAuth.verifySessionCookie(cookies.session || '', true);
    const { uid } = token;
    // ★★★ ここまで修正 ★★★

    if (!uid) {
      return { redirect: { destination: '/partner/login', permanent: false } };
    }

    const userDoc = await adminDb.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return { redirect: { destination: '/partner/login?error=user_not_found', permanent: false } };
    }

    const userData = userDoc.data()!;
    const userRoles: string[] = userData.roles || [];

    if (!userRoles.includes('recruit')) {
      return {
        redirect: { destination: '/partner/login?error=permission_denied', permanent: false } 
      };
    }

    const companyName = userData.companyName || 'パートナー';
    
    const jobsQuery = await adminDb.collection('jobs').where('uid', '==', uid).get();
    const jobs = jobsQuery.docs.map((doc: admin.firestore.QueryDocumentSnapshot) => ({
      id: doc.id,
      jobTitle: doc.data().jobTitle || '無題の求人',
      status: doc.data().status || 'paused',
      aiFeedback: doc.data().aiFeedback || null,
    }));

    // createdAtでソート（Firestoreのインデックスエラーを避けるため、取得後にソート）
    // この部分はもし createdAt フィールドがなければ不要です
    // jobs.sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate());

    return { props: { companyName, jobs } };
  } catch (error) {
    console.error('JobsPage getServerSideProps error:', error);
    return { redirect: { destination: '/partner/login', permanent: false } };
  }
};

// --- メインページコンポーネント ---
const JobsPage: NextPage<JobsPageProps> = ({ companyName, jobs }) => {
  const router = useRouter();
  const [jobList, setJobList] = useState<Job[]>(jobs);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/sessionLogout', { method: 'POST' });
      await signOut(getAuth(app));
      router.push('/partner/login');
    } catch (error) {
      console.error('ログアウト失敗:', error);
      router.push('/partner/login');
    }
  };

  const handleToggleJobStatus = async (jobId: string, currentStatus: Job['status']) => {
    if (currentStatus === 'pending_review' || currentStatus === 'rejected') {
      alert('審査中または要修正のためステータスは変更できません。');
      return;
    }

    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    const originalJobs = [...jobList];

    setJobList(prev => prev.map(job => job.id === jobId ? { ...job, status: newStatus } : job));

    const auth = getAuth(app);
    if (!auth.currentUser) {
      setError("ログインセッションが無効です。再度ログインしてください。");
      setJobList(originalJobs);
      return;
    }

    try {
      const idToken = await auth.currentUser.getIdToken();
      const response = await fetch(`/api/recruit/jobs/${jobId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) throw new Error('ステータスの更新に失敗しました。');
    } catch (err) {
      setJobList(originalJobs);
      console.error('ステータスの更新に失敗しました。', err);
      alert('ステータスの更新に失敗しました。');
    }
  };

  const JobStatusBadge = ({ status }: { status: Job['status'] }) => {
    switch (status) {
      case 'active': return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 flex items-center gap-1"><RiCheckboxCircleLine/> 掲載中</span>;
      case 'pending_review': return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 flex items-center gap-1"><RiTimeLine className="animate-spin"/> AI審査中</span>;
      case 'rejected': return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700 flex items-center gap-1"><RiCloseCircleLine/> 要修正</span>;
      default: return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 flex items-center gap-1"><RiPauseLine/> 停止中</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Head>
        <title>求人一覧を管理 - {companyName}</title>
      </Head>

      <header className="bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <div>
            <Link href="/recruit/dashboard" className="flex items-center text-sm text-gray-600 hover:text-gray-900 font-semibold mb-2">
              <RiArrowLeftLine className="w-4 h-4 mr-2" />
              ダッシュボードに戻る
            </Link>
            <h1 className="text-3xl font-extrabold text-gray-900">求人一覧を管理</h1>
            <p className="text-gray-500 mt-1 text-sm">現在掲載中の求人や、過去の求人情報を確認できます。</p>
          </div>
          <button onClick={handleLogout} className="flex items-center space-x-2 text-sm text-red-600 hover:text-white hover:bg-red-600 transition-colors bg-red-100 p-3 rounded-xl font-semibold shadow-sm" aria-label="ログアウト">
            <RiLogoutBoxRLine size={20} />
            <span>ログアウト</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="space-y-8">

          <div className="flex justify-end">
            <Link href="/recruit/jobs/create" className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-colors">
              <RiAddLine className="mr-3" size={24} />
              新しい求人を作成する
            </Link>
          </div>

          {jobList.length > 0 ? (
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              {error && <p className="text-red-600 text-sm mb-4 flex items-center"><RiErrorWarningLine className="mr-2"/>{error}</p>}
              <div className="divide-y divide-gray-200">
                {jobList.map((job: Job) => (
                  <div key={job.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-lg text-gray-900 truncate">{job.jobTitle}</p>
                      <JobStatusBadge status={job.status} />
                    </div>
                    <div className="mt-4 sm:mt-0 flex items-center space-x-3">
                      <Link href={`/recruit/jobs/edit/${job.id}`} className="flex items-center text-sm text-indigo-600 hover:text-indigo-800 transition-colors p-2 rounded-lg bg-indigo-50 hover:bg-indigo-100">
                        <RiEdit2Line className="mr-1" />編集
                      </Link>
                      <button
                        onClick={() => handleToggleJobStatus(job.id, job.status)}
                        disabled={job.status === 'pending_review' || job.status === 'rejected'}
                        className={`flex items-center text-sm px-4 py-2 font-semibold rounded-lg transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-white ${job.status === 'active' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
                      >
                        {job.status === 'active' ? <><RiPauseLine className="mr-1" />停止</> : <><RiPlayLine className="mr-1" />再開</>}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
              <p className="text-gray-500 text-lg">現在、有効な求人は登録されていません。</p>
              <p className="text-gray-500 mt-2">新しい求人を作成して、AIマッチングを開始しましょう。</p>
              <Link href="/recruit/jobs/create" className="mt-6 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-colors">
                <RiAddLine className="mr-3" size={24} />
                新しい求人を作成する
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default JobsPage;