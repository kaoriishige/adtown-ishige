import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import React from 'react';
import { adminDb, getUidFromCookie } from '../../lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import * as admin from 'firebase-admin';

// ===============================
// 型定義
// ===============================
interface Applicant {
    id: string;
    jobTitle: string;
    userName: string;
    userEmail: string;
    appliedAt: string;
}

interface ApplicantsProps {
    applicants: Applicant[];
}

// ===============================
// メインページコンポーネント
// ===============================
const ApplicantsPage: NextPage<ApplicantsProps> = ({ applicants }) => {
    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <Head>
                <title>応募者管理</title>
                <script src="https://cdn.tailwindcss.com"></script>
            </Head>
            <div className="max-w-6xl mx-auto bg-white p-6 rounded-lg shadow-md">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">応募者管理</h1>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">応募求人</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">応募者名</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">連絡先</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">応募日時</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {applicants.map((applicant) => (
                                <tr key={applicant.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{applicant.jobTitle}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{applicant.userName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{applicant.userEmail}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{applicant.appliedAt}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                 {applicants.length === 0 && (
                    <p className="text-center text-gray-500 mt-6">現在、応募者はいません。</p>
                )}
            </div>
        </div>
    );
};

// ===============================
// サーバーサイド処理
// ===============================
export const getServerSideProps: GetServerSideProps = async (context) => {
    try {
        const uid = await getUidFromCookie(context);
        if (!uid) {
            return { redirect: { destination: '/partner/login', permanent: false } };
        }

        // 応募情報を取得 (自分の求人に対する応募のみ)
        const applicantsSnapshot = await adminDb.collection('jobApplicants').where('partnerId', '==', uid).orderBy('appliedAt', 'desc').get();

        if (applicantsSnapshot.empty) {
            return { props: { applicants: [] } };
        }

        // ★★★ 修正箇所1: docに型を指定し、Setの展開方法を変更 ★★★
        const jobIds = Array.from(new Set(applicantsSnapshot.docs.map((doc: admin.firestore.QueryDocumentSnapshot) => doc.data().jobId)));
        const userIds = Array.from(new Set(applicantsSnapshot.docs.map((doc: admin.firestore.QueryDocumentSnapshot) => doc.data().userId)));

        // 求人情報を一括取得
        const jobsPromise = jobIds.map(id => adminDb.collection('jobs').doc(id).get());
        const jobsDocs = await Promise.all(jobsPromise);
        const jobsData: { [key: string]: string } = {};
        jobsDocs.forEach(doc => {
            if (doc.exists) {
                jobsData[doc.id] = doc.data()?.jobTitle || '無題の求人';
            }
        });

        // ユーザー情報（応募者）を一括取得
        const usersPromise = userIds.map(id => adminDb.collection('users').doc(id).get());
        const usersDocs = await Promise.all(usersPromise);
        const usersData: { [key: string]: { name: string; email: string } } = {};
        usersDocs.forEach(doc => {
            if (doc.exists) {
                const data = doc.data();
                usersData[doc.id] = {
                    name: data?.displayName || '名前未設定',
                    email: data?.email || 'メアド未設定',
                };
            }
        });
        
        // ★★★ 修正箇所2: 'doc'に型を明示的に指定 ★★★
        const applicants = applicantsSnapshot.docs.map((doc: admin.firestore.QueryDocumentSnapshot) => {
            const data = doc.data();
            const appliedAt = data.appliedAt as Timestamp;
            return {
                id: doc.id,
                jobTitle: jobsData[data.jobId] || '不明な求人',
                userName: usersData[data.userId]?.name || '不明な応募者',
                userEmail: usersData[data.userId]?.email || '不明',
                appliedAt: appliedAt.toDate().toLocaleString('ja-JP'),
            };
        });

        return { props: { applicants } };

    } catch (error) {
        console.error("Error fetching applicants:", error);
        return { props: { applicants: [] } };
    }
};

export default ApplicantsPage;