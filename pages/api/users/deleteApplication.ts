import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import nookies from 'nookies';

export default async function deleteApplication(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'DELETE') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        // 1. 認証チェック
        const cookies = nookies.get({ req });
        const token = await adminAuth.verifySessionCookie(cookies.session || '', true);
        const currentUserUid = token.uid;

        // 2. 応募ID (applicants ドキュメントのID) を取得
        const { applicationId } = req.body;
        if (!applicationId) {
            return res.status(400).json({ error: 'Application ID is required.' });
        }

        // --- ★★★ 修正箇所 (ここから) ★★★ ---

        // 3. 削除対象の 'applicants' ドキュメントを取得
        const applicantRef = adminDb.collection('applicants').doc(applicationId as string);
        const applicantSnap = await applicantRef.get();

        if (!applicantSnap.exists) {
            return res.status(404).json({ error: 'Application not found.' });
        }

        const applicantData = applicantSnap.data();

        // 4. セキュリティチェック: 応募の持ち主であることを確認
        if (applicantData?.userUid !== currentUserUid) {
            return res.status(403).json({ error: 'Forbidden: You do not own this application.' });
        }

        // 5. 対応する 'matchResults' ドキュメントのIDを特定
        const recruitmentId = applicantData?.recruitmentId;
        
        // 6. バッチ処理で両方のドキュメントを削除
        const batch = adminDb.batch();

        // (A) 'applicants' ドキュメントを削除
        batch.delete(applicantRef);

        // (B) 対応する 'matchResults' ドキュメントを削除
        if (recruitmentId) {
            // 'matchResults' ドキュメントは通常、複合ID (userUid_recruitmentId) を使用
            const matchResultId = `${currentUserUid}_${recruitmentId}`;
            const matchResultRef = adminDb.collection('matchResults').doc(matchResultId);
            batch.delete(matchResultRef);
        }

        // 7. バッチをコミット
        await batch.commit();
        
        // --- ★★★ 修正箇所 (ここまで) ★★★ ---

        return res.status(200).json({ success: true, message: 'Application and Match Result deleted successfully.' });

    } catch (error: any) {
        console.error("Delete Application API Error:", error);
        if (error.code === 'auth/session-cookie-expired' || error.code === 'auth/id-token-expired') {
            return res.status(401).json({ error: 'Session expired, please log in again.' });
        }
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
}