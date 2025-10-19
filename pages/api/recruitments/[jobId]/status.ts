// pages/api/recruitments/[jobId]/status.ts (完全コード)

import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/lib/firebase-admin'; // 🚨 パスはプロジェクトに合わせて確認
import * as admin from 'firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'PATCH') {
        res.setHeader('Allow', 'PATCH');
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const jobId = req.query.jobId as string;
    const { status } = req.body; // status: 'active' or 'paused'

    if (!jobId || (status !== 'active' && status !== 'paused')) {
        return res.status(400).json({ error: 'Missing jobId or invalid status value.' });
    }

    // 1. 認証トークンからユーザーIDを取得
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) {
        return res.status(401).json({ error: 'Authentication required.' });
    }

    let uid: string;
    try {
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        uid = decodedToken.uid;
    } catch (error) {
        console.error('Invalid ID token:', error);
        return res.status(401).json({ error: 'Invalid authentication token.' });
    }

    try {
        // 🟢 'recruitments' コレクションを参照
        const jobRef = adminDb.collection('recruitments').doc(jobId);
        const jobDoc = await jobRef.get();

        if (!jobDoc.exists) {
            return res.status(404).json({ error: 'Job document not found.' });
        }

        const jobData = jobDoc.data()!;

        // 2. 権限チェック: ログインユーザーがこの求人のオーナーであるか検証
        if (jobData.uid !== uid) {
            return res.status(403).json({ error: 'Permission denied. You are not the owner of this job.' });
        }
        
        // 3. 審査ステータスの確認（active/paused への変更は pending/rejected 以外でのみ許可）
        if (jobData.status === 'pending_review' || jobData.status === 'rejected') {
            return res.status(403).json({ error: 'Status cannot be changed. Job is currently under review or requires correction.' });
        }

        // 4. ステータスの更新
        await jobRef.update({
            status: status,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return res.status(200).json({ success: true, newStatus: status });

    } catch (error: any) {
        console.error('Error updating job status:', error);
        return res.status(500).json({ error: error.message || 'Failed to update job status.' });
    }
}