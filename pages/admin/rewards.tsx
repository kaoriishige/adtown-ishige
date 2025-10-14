import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import React from 'react';
import { adminDb, adminAuth } from '@/lib/firebase-admin'; // ★修正: adminAuthを直接インポート
import nookies from 'nookies';

// --- 型定義 ---
interface RewardSummary {
    id: string; // YYYY-MM 形式の月
    grandTotal: number;
    partnerTotal: number;
    userTotal: number;
}

interface RewardsPageProps {
    summaries: RewardSummary[];
}

// --- サーバーサイド処理 ---
export const getServerSideProps: GetServerSideProps = async (context) => {
    try {
        // ★修正: getUidFromCookieを使わず、ここで直接認証を行う
        const cookies = nookies.get(context);
        await adminAuth.verifySessionCookie(cookies.session || '', true);

        const summariesSnap = await adminDb.collection('referralSummaries').orderBy('month', 'desc').get();
        const summaries = summariesSnap.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                grandTotal: data.grandTotal || 0,
                partnerTotal: data.partnerTotal || 0,
                userTotal: data.userTotal || 0,
            };
        });

        return {
            props: {
                summaries,
            },
        };

    } catch (error) {
        // 認証失敗時は管理者ログインページなどにリダイレクト
        return {
            redirect: {
                destination: '/admin/login',
                permanent: false,
            },
        };
    }
};

// --- ページコンポーネント本体 ---
const RewardsPage: NextPage<RewardsPageProps> = ({ summaries }) => {
    return (
        <div>
            <Head>
                <title>月別報酬サマリー</title>
            </Head>
            <main>
                <h1>月別報酬サマリー</h1>
                <table>
                    <thead>
                        <tr>
                            <th>月</th>
                            <th>合計報酬</th>
                            <th>パートナー報酬</th>
                            <th>ユーザー報酬</th>
                        </tr>
                    </thead>
                    <tbody>
                        {summaries.map((summary) => (
                            <tr key={summary.id}>
                                <td>{summary.id}</td>
                                <td>{summary.grandTotal.toLocaleString()} ポイント</td>
                                <td>{summary.partnerTotal.toLocaleString()} ポイント</td>
                                <td>{summary.userTotal.toLocaleString()} ポイント</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </main>
        </div>
    );
};

export default RewardsPage;