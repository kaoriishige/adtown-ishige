import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import nookies from 'nookies';

export default async function deleteApplication(req: NextApiRequest, res: NextApiResponse) {
    // 💡 DELETEメソッドのみを許可
    if (req.method !== 'DELETE') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        // 1. 認証チェック
        const cookies = nookies.get({ req });
        // サーバーサイドでセッションクッキーを検証
        const token = await adminAuth.verifySessionCookie(cookies.session || '', true);
        const currentUserUid = token.uid;

        // 2. リクエストから応募IDを取得
        const { applicationId } = req.body;
        if (!applicationId) {
            return res.status(400).json({ error: 'Application ID is required.' });
        }

        // 3. ドキュメントの参照を取得
        const docRef = adminDb.collection('applicants').doc(applicationId as string);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return res.status(404).json({ error: 'Application not found.' });
        }

        // 4. 🚨 セキュリティチェック
        // その応募が本当にこのユーザーのものか確認
        const data = docSnap.data();
        if (data?.userUid !== currentUserUid) {
            return res.status(403).json({ error: 'Forbidden: You do not own this application.' });
        }

        // 5. 削除を実行
        await docRef.delete();

        return res.status(200).json({ success: true, message: 'Application deleted successfully.' });

    } catch (error: any) {
        console.error("Delete Application API Error:", error);
        // セッション切れのエラーハンドリング
        if (error.code === 'auth/session-cookie-expired' || error.code === 'auth/id-token-expired') {
            return res.status(401).json({ error: 'Session expired, please log in again.' });
        }
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
}