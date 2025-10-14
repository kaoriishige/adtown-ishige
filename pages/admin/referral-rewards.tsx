import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import React from 'react';
import { adminDb, adminAuth } from '@/lib/firebase-admin'; // ★修正: adminAuthを直接インポート
import nookies from 'nookies';

// --- 型定義 ---
interface Reward {
    id: string;
    referrerName: string; // 紹介者の名前
    referredName: string;  // 紹介された人の名前
    rewardAmount: number;
    rewardStatus: string;
    createdAt: string;
}

interface ReferralRewardsPageProps {
    rewards: Reward[];
}

// --- サーバーサイド処理 ---
export const getServerSideProps: GetServerSideProps = async (context) => {
    try {
        // ★修正: getUidFromCookieを使わず、ここで直接認証を行う
        const cookies = nookies.get(context);
        await adminAuth.verifySessionCookie(cookies.session || '', true);

        const rewardsSnap = await adminDb.collection('referralRewards').orderBy('createdAt', 'desc').get();
        
        // Firestoreのドキュメントから非同期でユーザー名を取得するための準備
        const rewardsPromises = rewardsSnap.docs.map(async (doc) => {
            const data = doc.data();
            
            // 紹介者と紹介された人の名前を非同期で取得
            const referrerSnap = await adminDb.collection('users').doc(data.referrerUid).get();
            const referredSnap = await adminDb.collection('users').doc(data.referredUid).get();
            
            const referrerName = referrerSnap.data()?.name || '不明なユーザー';
            const referredName = referredSnap.data()?.name || '不明なユーザー';

            return {
                id: doc.id,
                referrerName: referrerName,
                referredName: referredName,
                rewardAmount: data.rewardAmount,
                rewardStatus: data.rewardStatus,
                createdAt: data.createdAt.toDate().toLocaleString('ja-JP'),
            };
        });

        const rewards = await Promise.all(rewardsPromises);

        return {
            props: {
                rewards,
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
const ReferralRewardsPage: NextPage<ReferralRewardsPageProps> = ({ rewards }) => {
    return (
        <div>
            <Head>
                <title>紹介報酬一覧</title>
            </Head>
            <main>
                <h1>紹介報酬一覧</h1>
                <table>
                    <thead>
                        <tr>
                            <th>発生日時</th>
                            <th>紹介者</th>
                            <th>紹介された人</th>
                            <th>報酬額</th>
                            <th>ステータス</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rewards.map((reward) => (
                            <tr key={reward.id}>
                                <td>{reward.createdAt}</td>
                                <td>{reward.referrerName}</td>
                                <td>{reward.referredName}</td>
                                <td>{reward.rewardAmount} ポイント</td>
                                <td>{reward.rewardStatus}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </main>
        </div>
    );
};

export default ReferralRewardsPage;