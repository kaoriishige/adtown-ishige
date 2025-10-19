// pages/api/recruit/initiate-match.ts (求人審査API)

import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebase-admin'; 
import * as admin from 'firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { jobId } = req.body; 
    const recruiterUid = req.body.uid; 

    if (!jobId || !recruiterUid) {
        return res.status(400).json({ error: 'Missing jobId or uid in request body.' });
    }

    const jobRef = adminDb.collection('recruitments').doc(jobId);
    let jobDoc; 

    try {
        jobDoc = await jobRef.get();
        if (!jobDoc.exists) return res.status(404).json({ error: 'Recruitment post not found.' });

        const jobData = jobDoc.data()!;
        
        let aiReviewFeedback = '';
        let newVerificationStatus: 'verified' | 'rejected' = 'verified';
        // 運用ステータスを初期化。デフォルトは既存のステータスを維持
        let newStatus: 'active' | 'paused' | 'draft' = jobData.status || 'draft'; 

        // 必須項目チェック (シミュレーション)
        if (
             !jobData.jobDescription || 
             jobData.salaryMin === 0 || 
             !jobData.jobCategory || 
             (jobData.appealPoints && ensureArray(jobData.appealPoints.wlb).length === 0)
        ) {
             newVerificationStatus = 'rejected';
             aiReviewFeedback = '必須項目が不足しています。内容を充実させて再申請してください。';
             // 却下された場合は、運用ステータスを下書きに戻す
             newStatus = 'draft'; 
        } else {
             aiReviewFeedback = `AI審査を通過しました。求人スコアリング品質は「高」です。`;
             
             // ==========================================================
             // 💡 修正箇所: 審査通過時の自動掲載開始ロジックを無条件で 'active' に設定
             // ==========================================================
             // 審査に合格した場合は、運用ステータスを無条件で 'active' にする。
             // これにより、再編集時に status が active のまま残っていても、
             // 審査通過後の自動掲載が確実にトリガーされます。
             newStatus = 'active'; 
             console.log(`Job ${jobId} automatically forced to active upon verification.`);
             // ==========================================================
        }

        // 4. 求人ドキュメントを結果で更新
        await jobRef.update({
            verificationStatus: newVerificationStatus, // 審査結果
            status: newStatus,                         // 運用ステータス
            aiFeedback: aiReviewFeedback,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // 💡 成功時でも、新しいステータスを返却
        return res.status(200).json({ 
            success: true, 
            message: 'Job review completed. Status updated.', 
            newVerificationStatus: newVerificationStatus,
            newStatus: newStatus
        });

    } catch (error: any) {
        console.error('Error in AI review process (Forcing Rejection):', error);
        
        // 🚨 エラーが発生した場合、verificationStatus と status を 'rejected' と 'draft' に設定
        if (jobDoc && jobDoc.exists) {
            await jobRef.update({
                verificationStatus: 'rejected',
                status: 'draft',
                aiFeedback: `審査中に重大なシステムエラーが発生しました。時間を置いて再申請するか、内容を確認して修正してください。 (${error.message || 'Unknown error'})`,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
        
        return res.status(500).json({ error: 'Failed to complete AI review. Status forced to rejected.' });
    }
}

// 配列であることを保証するヘルパー関数
function ensureArray(value: any): any[] {
    return Array.isArray(value) ? value : [];
}