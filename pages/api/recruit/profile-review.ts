// pages/api/recruit/profile-review.ts
// 役割: 企業プロフィール (recruiters) の内容を審査し、verificationStatusを更新するAPI

import { NextApiRequest, NextApiResponse } from 'next';
// 🚨 パスをプロジェクトに合わせて確認してください
import { adminDb } from '@/lib/firebase-admin'; 
import * as admin from 'firebase-admin';

// 💡 修正 1: ハンドラ関数を定義
const profileReviewHandler = async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // クライアントから渡される UID を取得 (プロフィールオーナー)
    const { uid } = req.body; 

    if (!uid) {
        return res.status(400).json({ error: 'Missing uid for AI profile review.' });
    }

    const recruiterRef = adminDb.collection('recruiters').doc(uid);

    try {
        const recruiterDoc = await recruiterRef.get();

        if (!recruiterDoc.exists) {
            // ログアウト状態が続いている場合は、ここでリダイレクトをトリガー
            return res.status(404).json({ error: 'Recruiter profile not found.' });
        }

        const profileData = recruiterDoc.data()!;
        
        // --- AI審査ロジックのシミュレーション ---
        let aiReviewFeedback = '';
        let newStatus: 'verified' | 'rejected' = 'verified';

        // 必須項目（企業名、所在地、ミッション）のチェック (審査シミュレーション)
        if (
            !profileData.companyName || 
            !profileData.address || 
            !profileData.ourMission
        ) {
            newStatus = 'rejected';
            aiReviewFeedback = 'AI審査の結果、企業の基本情報（企業名、所在地、ミッション）の記入が完了していません。内容を埋めて再申請してください。';
        } else {
            aiReviewFeedback = 'AI審査を通過しました。プロフィールは承認済み（verified）です。';
        }

        // 審査結果を Firestore に更新
        await recruiterRef.update({
            verificationStatus: newStatus,
            aiFeedback: aiReviewFeedback,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // 成功レスポンス
        return res.status(200).json({ 
            success: true, 
            status: newStatus,
            message: `Profile review completed. Status: ${newStatus}.` 
        });

    } catch (error: any) {
        console.error('Failed to complete AI profile review:', error);
        
        // 失敗時、強制的に 'rejected' に更新してユーザーが編集できるようにする
        await recruiterRef.update({
            verificationStatus: 'rejected',
            aiFeedback: '審査中にシステムエラーが発生しました。時間を置いて再申請してください。',
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return res.status(500).json({ error: 'Failed to complete AI profile review.' });
    }
};

// 💡 修正 2: Next.js API Route の要件に従い、デフォルトエクスポート
export default profileReviewHandler;