import type { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import nookies from 'nookies';
import { Timestamp } from 'firebase-admin/firestore';

// --- 型定義 ---
interface ReferralSummaryData {
    month: string;
    partnerTotal: number;
    userTotal: number;
    grandTotal: number;
}

interface ErrorResponse {
    error: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ReferralSummaryData[] | ErrorResponse>) {
    if (req.method !== 'GET') {
        return res.status(405).end('Method Not Allowed');
    }

    try {
        const cookies = nookies.get({ req });
        if (!cookies.token) {
            return res.status(401).json({ error: 'Unauthorized: No token provided' });
        }

        // 修正: adminAuthを直接使用
        const token = await adminAuth.verifyIdToken(cookies.token, true);
        
        // 1. 管理者権限の確認
        const adminDoc = await adminDb.collection('users').doc(token.uid).get();
        if (!adminDoc.exists || adminDoc.data()?.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden: Not admin' });
        }

        // 2. 全ユーザーのIDと役割(role)を事前に取得
        const usersSnapshot = await adminDb.collection('users').get();
        const userRoles = new Map<string, string>();
        usersSnapshot.forEach(doc => {
            // docにany型を指定してエラー回避
            userRoles.set(doc.id, (doc.data() as any).role || 'user');
        });

        // 3. 報酬データの取得
        const rewardsSnapshot = await adminDb.collection('referralRewards').get();
        
        const monthlyData: { [key: string]: { partnerTotal: number; userTotal: number } } = {};

        rewardsSnapshot.forEach((doc: any) => {
            const reward = doc.data();
            const referrerUid = reward.referrerUid;
            const rewardAmount = reward.rewardAmount || 0;
            const createdAt = (reward.createdAt as Timestamp).toDate();
            
            const monthKey = `${createdAt.getFullYear()}-${(createdAt.getMonth() + 1).toString().padStart(2, '0')}`;

            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { partnerTotal: 0, userTotal: 0 };
            }

            // 修正: referrerUidから実際のロールを取得して判定に使用
            const role = userRoles.get(referrerUid) || 'user'; 

            if (role === 'partner') { 
                monthlyData[monthKey].partnerTotal += rewardAmount;
            } else {
                monthlyData[monthKey].userTotal += rewardAmount;
            }
        });

        const summaries: ReferralSummaryData[] = Object.entries(monthlyData).map(([month, totals]) => ({
            month,
            ...totals,
            grandTotal: totals.partnerTotal + totals.userTotal,
        }));

        summaries.sort((a, b) => b.month.localeCompare(a.month));

        return res.status(200).json(summaries);

    } catch (error) {
        console.error("Error fetching referral summary:", error);
        return res.status(500).json({ error: 'An unexpected error occurred.' });
    }
}