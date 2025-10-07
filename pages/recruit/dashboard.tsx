import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { getAuth, signOut } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { adminDb, getPartnerUidFromCookie } from '../../lib/firebase-admin';
import { 
  RiBuilding4Line, RiFileList3Line, RiUserSearchLine, RiLogoutBoxRLine, 
  RiPlayLine, RiPauseLine, RiErrorWarningLine, RiEdit2Line 
} from 'react-icons/ri';

// --- 型定義 ---
interface Job {
  id: string;
  jobTitle: string;
  status: 'active' | 'paused';
}

interface DashboardProps {
  companyName: string;
  initialSubscriptionStatus: 'active' | 'paused' | 'inactive';
  jobs: Job[];
}

interface DashboardCardProps {
  href: string;
  icon: React.ReactElement;
  title: string;
  description: string;
}

// --- サーバーサイドでのデータ取得 ---
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
    const companyName = userData.companyName || 'パートナー';
    const initialSubscriptionStatus = userData.recruitSubscriptionStatus || 'inactive';

    // ユーザーがオーナーである求人情報を取得
    const jobsQuery = await adminDb.collection('jobs').where('ownerId', '==', uid).get();
    const jobs = jobsQuery.docs.map(doc => ({
      id: doc.id,
      jobTitle: doc.data().jobTitle || '無題の求人',
      status: doc.data().status || 'paused',
    }));

    return {
      props: {
        companyName,
        initialSubscriptionStatus,
        jobs,
      },
    };
  } catch (error) {
    console.error('Dashboard getServerSideProps error:', error);
    return { redirect: { destination: '/partner/login', permanent: false } };
  }
};


// --- UIコンポーネント ---
const DashboardCard: React.FC<DashboardCardProps> = ({ href, icon, title, description }) => (
  <Link href={href} className="block hover:shadow-lg transition-shadow duration-300 bg-white p-6 rounded-lg shadow-md">
    <div className="flex items-center space-x-6">
      <div className="bg-indigo-100 text-indigo-600 p-4 rounded-full">{icon}</div>
      <div>
        <h3 className="text-lg font-bold text-gray-800">{title}</h3>
        <p className="text-gray-500 mt-1">{description}</p>
      </div>
    </div>
  </Link>
);

// --- メインページコンポーネント ---
const RecruitDashboardPage: NextPage<DashboardProps> = ({ companyName, initialSubscriptionStatus, jobs }) => {
  const router = useRouter();
  const [subscriptionStatus, setSubscriptionStatus] = useState(initialSubscriptionStatus);
  const [jobList, setJobList] = useState<Job[]>(jobs);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    try {
      await signOut(getAuth(app));
      await fetch('/api/auth/sessionLogout', { method: 'POST' });
      router.push('/partner/login');
    } catch (error) {
      console.error('ログアウト失敗:', error);
      router.push('/partner/login');
    }
  };

  // 全体のサブスクリプション（課金）を停止・再開する
  const handleToggleSubscription = async () => {
    setIsLoading(true);
    setError(null);
    const action = subscriptionStatus === 'active' ? 'pause' : 'resume';
    const auth = getAuth(app);
    if (!auth.currentUser) {
        setError("ログインセッションが無効です。再度ログインしてください。");
        setIsLoading(false);
        return;
    }

    try {
        const idToken = await auth.currentUser.getIdToken();
        const response = await fetch('/api/recruit/subscription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
            body: JSON.stringify({ action }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || '操作に失敗しました。');

        setSubscriptionStatus(data.newStatus);
        // 全ての求人のローカルステータスも更新
        setJobList(prev => prev.map(job => ({ ...job, status: data.newStatus })));
        alert(`求人広告サービス全体を${action === 'pause' ? '停止' : '再開'}しました。`);
    } catch (err: any) {
        setError(err.message);
    } finally {
        setIsLoading(false);
    }
  };

  // 個別の求人ステータスを更新する
  const handleToggleJobStatus = async (jobId: string, currentStatus: 'active' | 'paused') => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    const originalJobs = [...jobList];
    
    // UIを即時反映
    setJobList(prev => prev.map(job => job.id === jobId ? { ...job, status: newStatus } : job));

    const auth = getAuth(app);
    if (!auth.currentUser) {
        setError("ログインセッションが無効です。再度ログインしてください。");
        setJobList(originalJobs); // UIを元に戻す
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
        setJobList(originalJobs); // エラー時にUIを元に戻す
        alert('ステータスの更新に失敗しました。');
    }
  };
    
  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>AI求人パートナー ダッシュボード</title>
      </Head>

      <header className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI求人パートナー ダッシュボード</h1>
            <p className="text-gray-600 mt-1">ようこそ、{companyName} 様</p>
          </div>
          <button onClick={handleLogout} className="flex items-center space-x-2 text-sm text-gray-600 hover:text-red-600 transition-colors">
            <RiLogoutBoxRLine size={20} />
            <span>ログアウト</span>
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-10">
          
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">メインメニュー</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DashboardCard href="/recruit/jobs/create" icon={<RiFileList3Line size={28} />} title="新しい求人の作成" description="募集する職種の情報を新たに入力します" />
              <DashboardCard href="/recruit/applicants" icon={<RiUserSearchLine size={28} />} title="応募者を確認・管理" description="あなたの求人に応募したユーザーを確認します" />
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">求人一覧・管理</h2>
            <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
              {jobList.length > 0 ? jobList.map(job => (
                <div key={job.id} className="flex items-center justify-between p-4 border rounded-md">
                  <div>
                    <p className="font-bold text-gray-800">{job.jobTitle}</p>
                    <p className={`text-sm font-semibold ${job.status === 'active' ? 'text-green-600' : 'text-gray-500'}`}>
                      {job.status === 'active' ? '掲載中' : '停止中'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Link href={`/recruit/jobs/edit/${job.id}`} className="flex items-center text-sm text-blue-600 hover:underline">
                      <RiEdit2Line className="mr-1" />編集
                    </Link>
                    <button 
                      onClick={() => handleToggleJobStatus(job.id, job.status)}
                      disabled={subscriptionStatus !== 'active'}
                      className={`flex items-center text-sm px-3 py-1 rounded-md text-white transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed ${job.status === 'active' ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'}`}
                    >
                      {job.status === 'active' ? <><RiPauseLine className="mr-1"/>停止</> : <><RiPlayLine className="mr-1"/>再開</>}
                    </button>
                  </div>
                </div>
              )) : <p className="text-gray-500">まだ求人が登録されていません。</p>}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">求人サービス全体の管理</h2>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">サービス契約ステータス</h3>
                        <p className={`mt-1 font-semibold ${subscriptionStatus === 'active' ? 'text-green-600' : 'text-yellow-600'}`}>
                            {subscriptionStatus === 'active' ? '契約中' : '停止中'}
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                          {subscriptionStatus === 'active' 
                            ? 'サービスは現在有効です。停止すると全ての求人が非表示になり、次回の課金が停止されます。' 
                            : 'サービスは現在停止中です。再開すると全ての求人が掲載可能になり、課金も再開されます。'}
                        </p>
                    </div>
                    <button onClick={handleToggleSubscription} disabled={isLoading} className={`flex items-center justify-center px-6 py-2 font-semibold rounded-md transition-colors disabled:opacity-50 ${subscriptionStatus === 'active' ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}>
                        {isLoading ? '処理中...' : (subscriptionStatus === 'active' ? <><RiPauseLine className="mr-2"/>サービスを停止</> : <><RiPlayLine className="mr-2"/>サービスを再開</>)}
                    </button>
                </div>
                {error && <p className="text-red-600 text-sm mt-4 flex items-center"><RiErrorWarningLine className="mr-2"/>{error}</p>}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">アカウント設定</h2>
            <div className="space-y-4">
              <DashboardCard href="/recruit/profile" icon={<RiBuilding4Line size={28} />} title="企業プロフィールを編集" description="会社情報やアカウント情報を変更します" />
            </div>
          </section>

        </div>
      </main>
    </div>
  );
};

export default RecruitDashboardPage;
