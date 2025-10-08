import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import React from 'react';
import { adminDb, getUidFromCookie } from '../../lib/firebase-admin';
import * as admin from 'firebase-admin';

// ===============================
// 型定義
// ===============================
interface PartnerSummary {
    id: string;
    companyName: string;
    email: string;
    totalReferrals: number;
    totalRevenue: number;
}

interface ReferralRewardsProps {
    summaries: PartnerSummary[];
}

interface ReferralSummaryDoc {
    id: string;
    totalReferrals?: number;
    totalRevenue?: number;
}

// ===============================
// メインページコンポーネント
// ===============================
const ReferralRewardsPage: NextPage<ReferralRewardsProps> = ({ summaries }) => {
    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <Head>
                <title>紹介リワード管理</title>
                <script src="https://cdn.tailwindcss.com"></script>
            </Head>
            <div className="max-w-6xl mx-auto bg-white p-6 rounded-lg shadow-md">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">紹介リワード管理</h1>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">パートナー名</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">メールアドレス</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">紹介者数</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">合計収益</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {summaries.map((summary) => (
                                <tr key={summary.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{summary.companyName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{summary.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{summary.totalReferrals}人</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">¥{summary.totalRevenue.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// ===============================
// サーバーサイド処理
// ===============================
export const getServerSideProps: GetServerSideProps = async (context) => {
    try {
        // 管理者認証
        const uid = await getUidFromCookie(context);
        if (!uid) {
            return { redirect: { destination: '/partner/login', permanent: false } };
        }
        const userDoc = await adminDb.collection('users').doc(uid).get();
        if (!userDoc.exists || !userDoc.data()?.roles?.includes('admin')) {
            return { redirect: { destination: '/partner/login?error=permission_denied', permanent: false } };
        }

        // 全ての紹介サマリーを取得
        const summarySnapshot = await adminDb.collection('referralSummaries').get();
        
        const summariesData = summarySnapshot.docs.map((doc: admin.firestore.QueryDocumentSnapshot) => ({
            id: doc.id,
            ...doc.data(),
        })) as ReferralSummaryDoc[];
        
        // 全てのパートナー情報を取得
        const usersSnapshot = await adminDb.collection('users').get();
        const usersData: { [key: string]: { companyName: string; email: string } } = {};
        
        // ★★★ エラー箇所を修正: 'doc'に型を明示的に指定 ★★★
        usersSnapshot.docs.forEach((doc: admin.firestore.QueryDocumentSnapshot) => {
            const data = doc.data();
            usersData[doc.id] = {
                companyName: data.companyName || '（企業名未設定）',
                email: data.email || '（メールアドレス未設定）',
            };
        });

        const summaries = summariesData.map((summary: ReferralSummaryDoc) => ({
            id: summary.id,
            companyName: usersData[summary.id]?.companyName || '（不明なパートナー）',
            email: usersData[summary.id]?.email || '（不明）',
            totalReferrals: summary.totalReferrals || 0,
            totalRevenue: summary.totalRevenue || 0,
        }));

        return {
            props: {
                summaries,
            },
        };

    } catch (error) {
        console.error('Error fetching referral rewards:', error);
        return {
            props: {
                summaries: [],
            },
        };
    }
};

export default ReferralRewardsPage;