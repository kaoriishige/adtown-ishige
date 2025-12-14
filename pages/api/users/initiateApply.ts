// ファイル名: /pages/api/users/initiateApply.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import nookies from 'nookies';
import * as admin from 'firebase-admin'; // Timestampのためにインポート

export default async function initiateApply(
    req: NextApiRequest,
    res: NextApiResponse
) {
    // 💡 POSTメソッドのみを許可 (応募の作成)
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        // 1. 認証チェック
        const cookies = nookies.get({ req });
        const token = await adminAuth.verifySessionCookie(cookies.session || '', true);
        const currentUserUid = token.uid; // 求職者のUID

        // 2. リクエストから求人IDを取得
        const { recruitmentId } = req.body;
        if (!recruitmentId) {
            return res.status(400).json({ error: 'Recruitment ID is required.' });
        }

        // 3. 重複応募のチェック
        const applicantCheck = await adminDb
            .collection('applicants')
            .where('userUid', '==', currentUserUid)
            .where('recruitmentId', '==', recruitmentId)
            .get();

        if (!applicantCheck.empty) {
            return res.status(409).json({ error: 'Already applied to this job.' });
        }

        // 4. 新しい応募データの作成
        const newApplicationData = {
            userUid: currentUserUid,
            recruitmentId: recruitmentId,
            status: 'applied', // 応募済みステータス
            appliedAt: admin.firestore.Timestamp.now(),
            // 💡 必要に応じて、ユーザーの氏名などのスナップショット情報も追加可能
        };

        // 5. 'applicants' コレクションに永続化 (データベース書き込み)
        const docRef = await adminDb.collection('applicants').add(newApplicationData);

        // 6. 成功応答
        return res.status(200).json({ 
            success: true, 
            applicationId: docRef.id,
            message: 'Application successfully created and persisted in the database.' 
        });

    } catch (error: any) {
        console.error("Initiate Apply API Error:", error);
        if (error.code === 'auth/session-cookie-expired' || error.code === 'auth/id-token-expired') {
            return res.status(401).json({ error: 'Session expired, please log in again.' });
        }
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
}