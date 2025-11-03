/**
 * pages/api/match.ts: APIエンドポイントハンドラー
 * 🚨 注意: このファイルはpages/apiフォルダに配置してください。
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebase-admin'; // 🚨 プロジェクトのパスに合わせてください
import admin from 'firebase-admin';
// 💡 ロジック本体をインポート
import { calculateMatchScore, UserProfile, Job, CompanyProfile } from '@/lib/ai-matching-engine'; 


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // req.bodyからデータを受信
        const { userProfile, job, companyUid } = req.body as { userProfile: UserProfile, job: Job, companyUid: string }; 

        if (!userProfile || !job || !companyUid) {
            return res.status(400).json({ error: 'Missing required fields (userProfile, job, or companyUid).' });
        }

        // Firestoreから企業プロフィールを取得
        const companyRef = adminDb.collection('recruiters').doc(companyUid); 
        const companySnap = await companyRef.get();

        if (!companySnap.exists) {
            return res.status(404).json({ error: 'Company profile not found in recruiters collection.' });
        }

        // 💡 calculateMatchScoreが期待する型にキャスト
        const companyProfile = companySnap.data() as CompanyProfile; 

        // マッチングスコア算出
        const { score, reasons } = calculateMatchScore(userProfile, job, companyProfile);

        // 応募データ保存 (matchResults に結果を保存)
        const matchResultRef = adminDb.collection('matchResults').doc();
        await matchResultRef.set({
            userUid: userProfile.uid,
            companyUid,
            jobId: job.id,
            score,
            reasons,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });


        return res.status(200).json({
            message: 'Matching completed successfully.',
            matchScore: score,
            matchReasons: reasons,
        });
    } catch (err: any) {
        console.error('AI Match Error:', err);
        return res.status(500).json({ error: err.message || 'Internal server error' });
    }
}


