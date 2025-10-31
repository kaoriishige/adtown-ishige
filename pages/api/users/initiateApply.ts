// pages/api/users/initiateApply.ts (最終安全版 - 応募登録のみ)

import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebase-admin'; 
import * as admin from 'firebase-admin';

const MIN_SCORE = 60;

export default async function initiateApply(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { userId, userProfileData } = req.body;

        if (!userId || !userProfileData) {
            return res.status(400).json({ error: 'User ID and Profile Data are required.' });
        }

        // 1. AI推薦求人（スコア60点以上）を取得
        // 🚨 このクエリが0件を返すと、何も実行されないため、ターミナルログをチェック
        const matchSnap = await adminDb.collection('matchResults')
            .where('userUid', '==', userId)
            .where('score', '>=', MIN_SCORE)
            .get();

        const totalMatchesFound = matchSnap.docs.length;
        
        if (totalMatchesFound === 0) {
             return res.status(200).json({ success: true, count: 0, totalMatches: 0 });
        }
        
        // 既存の応募済み求人IDを取得
        const existingApplications = await adminDb.collection('jobApplicants')
            .where('userId', '==', userId)
            .get();
        const appliedJobIds = new Set(existingApplications.docs.map(doc => doc.data().recruitmentId));
        
        let newApplicationsCount = 0;
        
        // 2. 未応募の求人に対して jobApplicants レコードを作成 (同期処理を強制)
        for (const matchDoc of matchSnap.docs) {
            const matchData = matchDoc.data();
            const recruitmentId = matchData.jobId;
            const companyUid = matchData.companyUid;

            if (!appliedJobIds.has(recruitmentId)) {
                
                const newApplicantData = {
                    userId: userId,
                    recruitmentId: recruitmentId,
                    companyUid: companyUid,
                    matchStatus: 'applied', // 👈 応募登録！
                    jobTitle: matchData.jobTitle || 'タイトル不明', 
                    companyName: matchData.companyName || '企業名不明',
                    matchScore: matchData.score, // スコアも一緒に保存
                    companyFeedback: null, 
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                };

                // 💡 確実に書き込みが完了するまで待機
                await adminDb.collection('jobApplicants').add(newApplicantData); 
                
                newApplicationsCount++;
            }
        }
        
        // 3. 成功を返す
        return res.status(200).json({ 
            success: true, 
            count: newApplicationsCount, 
            totalMatches: totalMatchesFound 
        });
    } catch (e) {
        console.error("Initiate Apply API CRITICAL FAILURE:", e); 
        const errorMessage = e instanceof Error ? e.message : 'Unknown error';
        
        return res.status(500).json({ error: `Critical API failure: ${errorMessage}` }); 
    }
}
