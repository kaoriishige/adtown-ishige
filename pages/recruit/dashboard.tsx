// pages/recruit/dashboard.tsx
import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { getAuth, signOut } from 'firebase/auth';
import { app } from '../../lib/firebase';
import { adminDb, getUidFromCookie } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import {
  RiBuilding4Line,
  RiFileList3Line,
  RiUserSearchLine,
  RiLogoutBoxRLine,
  RiPlayLine,
  RiPauseLine,
  RiErrorWarningLine,
  RiEdit2Line,
  RiAdvertisementLine,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiAddLine,
  RiLayout2Line,
  RiMoneyDollarCircleLine,
} from 'react-icons/ri';

// --- 型定義 ---
interface Job {
  id: string;
  jobTitle: string;
  status: 'active' | 'paused';
}

interface DashboardProps {
  companyName: string;
  initialSubscriptionStatus: 'active' | 'paused' | 'inactive' | 'trialing';
  jobs: Job[];
  userRoles: string[];
}

// --- 汎用カードコンポーネント ---
const DashboardCard: React.FC<{
  href: string;
  icon: React.ReactElement;
  title: string;
  description: string;
  color: 'indigo' | 'green' | 'red' | 'yellow' | 'purple';
}> = ({ href, icon, title, description, color }) => {
  const colors = {
    indigo: 'bg-indigo-100 text-indigo-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    purple: 'bg-purple-100 text-purple-600',
  }[color];

  return (
    <Link
      href={href}
      className="group bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-2xl hover:border-indigo-300 transition-all duration-300"
    >
      <div className="flex items-start space-x-4">
        <div className={`p-4 rounded-xl ${colors} transition-colors`}>
          {icon}
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-800 group-hover:text-indigo-600 transition">
            {title}
          </h3>
          <p className="text-gray-500 text-sm mt-1">{description}</p>
        </div>
      </div>
    </Link>
  );
};

// --- SSR ---
export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const uid = await getUidFromCookie(context);
    if (!uid) {
      return { redirect: { destination: '/partner/login', permanent: false } };
    }

    const userDoc = await adminDb.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return { redirect: { destination: '/partner/login', permanent: false } };
    }

    const userData = userDoc.data()!;
    const userRoles: string[] = userData.roles || [];

    if (!userRoles.includes('recruit')) {
      return {
        redirect: { destination: '/partner/login?error=permission_denied', permanent: false },
      };
    }

    const companyName = userData.companyName || 'パートナー';
    const initialSubscriptionStatus = userData.recruitSubscriptionStatus || 'inactive';

    const jobsQuery = await adminDb.collection('jobs').where('ownerId', '==', uid).get();
    const jobs = jobsQuery.docs.map((doc: admin.firestore.QueryDocumentSnapshot) => ({
      id: doc.id,
      jobTitle: doc.data().jobTitle || '無題の求人',
      status: doc.data().status || 'paused',
    }));

    return { props: { companyName, initialSubscriptionStatus, jobs, userRoles } };
  } catch (err) {
    console.error(err);
    return { redirect: { destination: '/partner/login', permanent: false } };
  }
};

// --- メインページ ---
const RecruitDashboardPage: NextPage<DashboardProps> = ({
  companyName,
  initialSubscriptionStatus,
  jobs,
  userRoles,
}) => {
  const router = useRouter();
  const [subscriptionStatus, setSubscriptionStatus] = useState(initialSubscriptionStatus);
  const [jobList, setJobList] = useState<Job[]>(jobs);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isNotAdPartner = !userRoles.includes('adver');

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/sessionLogout', { method: 'POST' });
      await signOut(getAuth(app));
      router.push('/partner/login');
    } catch {
      router.push('/partner/login');
    }
  };

  const getSubState = () => {
    const isActive = subscriptionStatus === 'active' || subscriptionStatus === 'trialing';
    if (isActive) {
      return {
        status: '契約中',
        desc: 'サービスは現在有効です。停止すると全求人が非表示になります。',
        color: 'text-green-600 bg-green-50',
      };
    }
    return {
      status: '停止中',
      desc: '再開すると全求人が有効化され、課金も再開されます。',
      color: 'text-red-600 bg-red-50',
    };
  };

  const sub = getSubState();

  const handleMatchAction = async (action: 'pause' | 'resume', type: 'credit' | 'invoice') => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'エラーが発生しました');
      setSubscriptionStatus(action === 'pause' ? 'paused' : 'active');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Head>
        <title>AI求人パートナー ダッシュボード</title>
      </Head>

      {/* ヘッダー */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">
              AI求人パートナー ダッシュボード
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              ようこそ、{companyName} 様。
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center text-sm bg-red-100 text-red-600 hover:bg-red-600 hover:text-white px-4 py-2 rounded-xl font-semibold shadow-sm transition"
          >
            <RiLogoutBoxRLine className="mr-1" /> ログアウト
          </button>
        </div>
      </header>

      {/* メイン */}
      <main className="max-w-6xl mx-auto px-6 py-10 space-y-16">
        {/* --- 企業情報 --- */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 border-b pb-3 mb-6">
            1. 企業情報の管理
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <DashboardCard
              href="/recruit/profile"
              icon={<RiBuilding4Line size={28} />}
              title="企業プロフィールを編集"
              description="会社情報・担当者・ロゴ設定など"
              color="indigo"
            />
          </div>
        </section>

        {/* --- 求人管理 --- */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 border-b pb-3 mb-6">
            2. 求人・応募者の管理
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <DashboardCard
              href="/recruit/jobs/create"
              icon={<RiFileList3Line size={28} />}
              title="新しい求人の作成"
              description="AIマッチングに最適な求人を登録"
              color="green"
            />
            <DashboardCard
              href="/recruit/applicants"
              icon={<RiUserSearchLine size={28} />}
              title="応募者を確認"
              description="候補者と進行中の選考を管理"
              color="yellow"
            />
            <DashboardCard
              href="#job-list-anchor"
              icon={<RiLayout2Line size={28} />}
              title="求人一覧を管理"
              description="既存求人を編集・停止・再開"
              color="indigo"
            />
          </div>
        </section>

        {/* --- 求人一覧 --- */}
        <section id="job-list-anchor">
          <h2 className="text-2xl font-bold text-gray-800 border-b pb-3 mb-6">
            掲載中の求人 ({jobList.length}件)
          </h2>
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            {jobList.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">現在登録中の求人はありません。</p>
                <Link
                  href="/recruit/jobs/create"
                  className="mt-3 inline-flex items-center text-indigo-600 hover:underline font-medium"
                >
                  <RiAddLine className="mr-1" /> 新しい求人を作成
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {jobList.map((job) => (
                  <div key={job.id} className="flex items-center justify-between py-4">
                    <div>
                      <p className="font-semibold text-gray-900 text-lg">{job.jobTitle}</p>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          job.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {job.status === 'active' ? '掲載中' : '停止中'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/recruit/jobs/edit/${job.id}`}
                        className="flex items-center text-sm text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-2 rounded-lg"
                      >
                        <RiEdit2Line className="mr-1" /> 編集
                      </Link>
                      <button
                        className={`flex items-center text-sm px-4 py-2 rounded-lg text-white font-semibold shadow-md ${
                          job.status === 'active'
                            ? 'bg-red-500 hover:bg-red-600'
                            : 'bg-green-500 hover:bg-green-600'
                        }`}
                      >
                        {job.status === 'active' ? (
                          <>
                            <RiPauseLine className="mr-1" /> 停止
                          </>
                        ) : (
                          <>
                            <RiPlayLine className="mr-1" /> 再開
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* --- 契約管理 --- */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 border-b pb-3 mb-6">
            3. サービス契約・決済管理
          </h2>
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div>
                <h3 className="flex items-center text-lg font-bold text-gray-800">
                  {sub.status === '停止中' ? (
                    <RiCloseCircleLine className="mr-2 text-red-500" size={22} />
                  ) : (
                    <RiCheckboxCircleLine className="mr-2 text-green-500" size={22} />
                  )}
                  サブスクリプション状況
                </h3>
                <p className={`mt-2 text-sm px-3 py-1 rounded-full w-fit ${sub.color}`}>
                  {sub.status}
                </p>
                <p className="text-gray-600 text-sm mt-3 max-w-md">{sub.desc}</p>
              </div>
            </div>

            {/* クレジットカード決済 */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h4 className="text-lg font-semibold text-gray-800 flex items-center">
                <RiMoneyDollarCircleLine className="mr-2 text-indigo-600" />
                クレジットカード決済の方は、こちらをご利用ください。
              </h4>
              <div className="flex gap-4 mt-3">
                <button
                  onClick={() => handleMatchAction('resume', 'credit')}
                  disabled={isLoading}
                  className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold disabled:opacity-50"
                >
                  {isLoading ? '処理中...' : (<><RiPlayLine className="mr-1" /> 求人マッチングAI開始</>)}
                </button>
                <button
                  onClick={() => handleMatchAction('pause', 'credit')}
                  disabled={isLoading}
                  className="flex items-center px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold disabled:opacity-50"
                >
                  {isLoading ? '処理中...' : (<><RiPauseLine className="mr-1" /> 求人マッチングAI停止</>)}
                </button>
              </div>
            </div>

            {/* 請求書払い */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h4 className="text-lg font-semibold text-gray-800 flex items-center">
                <RiMoneyDollarCircleLine className="mr-2 text-purple-600" />
                請求書払いの方は、こちらをご利用ください。
              </h4>
              <div className="flex gap-4 mt-3">
                <button
                  onClick={() => handleMatchAction('resume', 'invoice')}
                  disabled={isLoading}
                  className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold disabled:opacity-50"
                >
                  {isLoading ? '処理中...' : (<><RiPlayLine className="mr-1" /> 求人マッチングAI開始</>)}
                </button>
                <button
                  onClick={() => handleMatchAction('pause', 'invoice')}
                  disabled={isLoading}
                  className="flex items-center px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold disabled:opacity-50"
                >
                  {isLoading ? '処理中...' : (<><RiPauseLine className="mr-1" /> 求人マッチングAI停止</>)}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-red-600 text-sm mt-4 flex items-center">
                <RiErrorWarningLine className="mr-1" /> {error}
              </p>
            )}
          </div>
        </section>

        {/* --- 追加サービス --- */}
        {isNotAdPartner && (
          <section>
            <h2 className="text-2xl font-bold text-gray-800 border-b pb-3 mb-6">
              4. 追加の収益化サービス
            </h2>
            <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-dashed border-blue-200">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-800 flex items-center">
                    <RiAdvertisementLine className="mr-2 text-blue-500" />
                    広告パートナーサービス
                  </h3>
                  <p className="text-sm text-gray-600 mt-2 max-w-md">
                    月額3,300円でアプリ内広告掲載や紹介プログラムで新たな収益を獲得。
                  </p>
                </div>
                <Link
                  href="/partner/ad-subscribe"
                  className="px-6 py-3 rounded-xl text-white bg-blue-600 hover:bg-blue-700 font-semibold shadow-md"
                >
                  詳しく見る
                </Link>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default RecruitDashboardPage;







