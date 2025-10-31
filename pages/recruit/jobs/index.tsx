import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { getAuth, signOut } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import nookies from 'nookies';
import {
    RiAddLine, RiEdit2Line, RiPauseLine, RiPlayLine, RiLogoutBoxRLine,
    RiCheckboxCircleLine, RiCloseCircleLine, RiTimeLine, RiErrorWarningLine, RiArrowLeftLine, RiUserSearchLine
} from 'react-icons/ri';


// --- 型定義 ---
interface Job {
    id: string;
    jobTitle: string;
    status: 'active' | 'paused' | 'pending_review' | 'rejected' | 'verified' | 'draft'; 
    aiFeedback?: string;
    applicantsCount?: number; 
    currentStatus: 'active' | 'paused' | 'draft';
}

interface JobsPageProps {
    companyName: string;
    jobs: Job[];
    isPaid: boolean; // ★★★ 課金ステータスを追加 ★★★
}

// --- SSR: サーバーサイドでのデータ取得 (★★★ isPaid を追加) ★★★
export const getServerSideProps: GetServerSideProps = async (context) => {
    try {
        const cookies = nookies.get(context);
        const token = await adminAuth.verifySessionCookie(cookies.session || '', true);
        const { uid } = token;

        if (!uid) {
            return { redirect: { destination: '/partner/login', permanent: false } };
        }

        const userSnap = await adminDb.collection('users').doc(uid).get();
        if (!userSnap.exists) {
             return { redirect: { destination: '/partner/login?error=user_not_found', permanent: false } };
        }

        const userData = userSnap.data()!;
        const companyName = userData.companyName || '求人パートナー';
        const userRoles: string[] = userData.roles || [];
        if (!userRoles.includes('recruit')) {
             return { redirect: { destination: '/partner/login?error=permission_denied', permanent: false } };
        }
        
        // ★★★ isPaid を取得 ★★★
        const isPaid = !!userData.isPaid;

        const jobsQuery = await adminDb.collection('recruitments').where('uid', '==', uid).orderBy('createdAt', 'desc').get();
        
        const jobsPromises = jobsQuery.docs.map(async (doc: admin.firestore.QueryDocumentSnapshot) => {
             const data = doc.data();
             
             const verificationStatus = data.verificationStatus || 'draft'; 
             const currentStatus = data.status || 'draft';             

             const applicantsSnap = await adminDb.collection('applicants')
                 .where('recruitmentId', '==', doc.id)
                 .get();

             return {
                 id: doc.id,
                 jobTitle: data.jobTitle || '無題の求人',
                 status: verificationStatus, // 審査ステータス
                 currentStatus: currentStatus, // 運用ステータス
                 aiFeedback: data.aiFeedback || null,
                 applicantsCount: applicantsSnap.size,
             };
        });

        const jobs = await Promise.all(jobsPromises);

        // ★★★ isPaid を props に渡す ★★★
        return { props: { companyName, jobs, isPaid } };

    } catch (error) {
        console.error('JobsPage getServerSideProps error:', error);
        return { redirect: { destination: '/partner/login', permanent: false } };
    }
};

// --- メインページコンポーネント (★★★ isPaid を受け取る) ---
const JobsPage: NextPage<JobsPageProps> = ({ companyName, jobs, isPaid }) => {
    const router = useRouter();
    
    // =================================================================
    // 💡 修正箇所: jobs の値をそのまま利用（statusとcurrentStatusを上書きしない）
    // =================================================================
    const [jobList, setJobList] = useState<Job[]>(jobs); 
    // =================================================================
    
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

    const handleToggleJobStatus = async (jobId: string, currentStatus: Job['currentStatus'], verificationStatus: Job['status']) => {
        
        // 🚨 修正: 審査通過済み ('verified') 以外の審査ステータスは変更不可
        if (verificationStatus !== 'verified') {
            alert('AI審査の承認を得ていないため、掲載ステータスは変更できません。');
            return;
        }

        const newStatus = currentStatus === 'active' ? 'paused' : 'active';
        const originalJobs = [...jobList];
        
        // UIを即座に更新 (フォールバックのためにオリジナルを保存)
        setJobList(prev => prev.map(job => job.id === jobId ? { ...job, currentStatus: newStatus } : job));
        
        const auth = getAuth(app);
        if (!auth.currentUser) {
            setError("ログインセッションが無効です。再度ログインしてください。");
            setJobList(originalJobs); 
            router.push('/partner/login');
            return;
        }

        try {
            const idToken = await auth.currentUser.getIdToken();
            const response = await fetch(`/api/recruitments/${jobId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!response.ok) throw new Error('ステータスの更新に失敗しました。');
            
            // 強制リロードにより確実に最新データを取得
            window.location.reload(); 

        } catch (err) {
            setJobList(originalJobs); 
            console.error('ステータスの更新に失敗しました。', err);
            alert('ステータスの更新に失敗しました。');
        }
    };

    // JobStatusBadge は運用ステータスと審査ステータスの両方を見る (変更なし)
    const JobStatusBadge = ({ status, currentStatus }: { status: Job['status'], currentStatus: Job['currentStatus'] }) => {
        if (status === 'pending_review') return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 flex items-center gap-1"><RiTimeLine className="animate-spin"/> AI審査中</span>;
        if (status === 'rejected') return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700 flex items-center gap-1"><RiCloseCircleLine/> 要修正</span>;
        
        if (status === 'verified') {
            if (currentStatus === 'active') return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 flex items-center gap-1"><RiCheckboxCircleLine/> 掲載中</span>;
            if (currentStatus === 'paused') return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 flex items-center gap-1"><RiPauseLine/> 停止中 (承認済)</span>;
            return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 flex items-center gap-1"><RiCheckboxCircleLine/> 承認済 / 下書き</span>;
        }

        return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 flex items-center gap-1"><RiPauseLine/> 停止中</span>;
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <Head>
                <title>{'求人一覧を管理'} - {companyName}</title>
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
                                            <JobStatusBadge status={job.status} currentStatus={job.currentStatus} />
                                        </div>
                                        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
                                            <Link 
                                                href={`/recruit/jobs/edit?id=${job.id}`} 
                                                className="flex items-center text-sm text-indigo-600 hover:text-indigo-800 transition-colors p-2 rounded-lg bg-indigo-50 hover:bg-indigo-100"
                                            >
                                                <RiEdit2Line className="mr-1" />編集
                                            </Link>
                                            <Link 
                                                href={`/recruit/applicants?recruitmentId=${job.id}`} 
                                                className="flex items-center text-sm text-green-600 hover:text-green-800 transition-colors p-2 rounded-lg bg-green-50 hover:bg-green-100"
                                            >
                                                <RiUserSearchLine className="mr-1" />応募者 ({job.applicantsCount || 0})
                                            </Link>
                                            <button
                                                onClick={() => handleToggleJobStatus(job.id, job.currentStatus, job.status)}
                                                disabled={job.status !== 'verified'} 
                                                className={`flex items-center text-sm px-4 py-2 font-semibold rounded-lg transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-white ${job.currentStatus === 'active' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
                                            >
                                                {job.currentStatus === 'active' ? <><RiPauseLine className="mr-1" />停止</> : <><RiPlayLine className="mr-1" />再開</>}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        // ★★★ 変更点: 0件の場合の表示を更新 ★★★
                        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                            <p className="text-gray-500 text-lg">現在、有効な求人は登録されていません。</p>
                            
                            {/* ★ ご要望の文言を追加 ★ */}
                            <p className="text-gray-500 mt-2">新しい求人を作成して、開始しましょう。</p>

                            <Link href="/recruit/jobs/create" className="mt-6 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-colors">
                                <RiAddLine className="mr-3" size={24} />
                                新しい求人を作成する
                            </Link>

                            {/* ★★★ 有料プランボタンの追加 (isPaid が false の場合のみ) ★★★ */}
                            {!isPaid && (
                                <div className="mt-8 pt-6 border-t border-gray-200 max-w-lg mx-auto">
                                     <p className="text-lg font-semibold text-gray-700">AIマッチング機能で、さらに採用を加速しませんか？</p>
                                     <p className="text-gray-500 mt-2">AIによる候補者の自動提案やスカウト機能は有料プランでご利用いただけます。</p>
                                     <Link href="/recruit/subscribe_plan" legacyBehavior>
                                        <a className="inline-block mt-4 bg-orange-500 text-white font-extrabold py-3 px-8 rounded-full shadow-lg hover:bg-orange-700 transition duration-150">
                                            有料AIプランに申し込む
                                        </a>
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};


export default JobsPage;