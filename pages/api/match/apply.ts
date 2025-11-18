/**
 * pages/api/match.ts: APIエンドポイントハンドラー
 * (修正版：'applicants'書き込み ＋ companyNameの型エラー修正)
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

        // ★★★ 修正箇所 ★★★
        // companySnap.data() を生のデータとして保持します
        const companyData = companySnap.data();
        if (!companyData) {
             return res.status(404).json({ error: 'Company data is empty.' });
        }

        // 💡 calculateMatchScoreが期待する型にキャスト
        const companyProfile = companyData as CompanyProfile; 

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

        // 'applicants' コレクションへの書き込み
        const applicantData = {
            userUid: userProfile.uid,
            recruitmentId: job.id,
            companyUid: companyUid,
            
            // 'status' と 'matchStatus' の両方を 'applied' に設定
            status: 'applied',
            matchStatus: 'applied',

            // 補足情報
            jobTitle: job.jobTitle || 'タイトル不明', 
            
            // ★★★ 修正箇所 ★★★
            // 型キャストされた 'companyProfile' ではなく、
            // 生データの 'companyData' から 'companyName' を取得します
            companyName: companyData.companyName || '企業名不明',
            
            matchScore: score,
            companyFeedback: null, 
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        // 'applicants' コレクションに新しい応募ドキュメントを作成
        await adminDb.collection('applicants').add(applicantData);


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


