import type { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import nookies from 'nookies';

/**
 * ユーザーの認証情報とFirestoreデータを削除するAPIハンドラ
 * * @param req リクエスト (POSTメソッド, bodyに { uid: string } を含む)
 * @param res レスポンス
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse<{ success: boolean; error?: string }>) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    // 🚨 注意: 本番環境では、ここで管理者の認証とロールチェックが必要です。
    // 例:
    // try {
    //     const cookies = nookies.get({ req });
    //     const token = await adminAuth.verifySessionCookie(cookies.session || '', true);
    //     const userDoc = await adminDb.collection('users').doc(token.uid).get();
    //     if (userDoc.data()?.role !== 'admin') throw new Error('Forbidden: Not an admin');
    // } catch (error) {
    //     return res.status(403).json({ success: false, error: 'Forbidden: Authentication required.' });
    // }

    try {
        const { uid } = req.body;
        if (!uid) {
            return res.status(400).json({ success: false, error: 'User UID is required.' });
        }

        const db = adminDb;
        const batch = db.batch();

        // 1. Firebase Authentication からユーザーを削除
        await adminAuth.deleteUser(uid);
        
        // 2. Firestore から関連データを削除 (バッチ処理)
        
        // userProfiles ドキュメントをバッチに追加
        const profileRef = db.collection('userProfiles').doc(uid);
        batch.delete(profileRef);

        // users コレクションのユーザーロール情報 (もしあれば)
        const userRef = db.collection('users').doc(uid);
        batch.delete(userRef);

        // ※ 応募履歴 (applicants), マッチング結果 (matchResults) など、
        // 他の関連コレクションのドキュメントもここで削除することが推奨されます。
        // ただし、コレクション全体をバッチで削除できないため、
        // クエリで検索し、ループで参照を追加する必要があります。

        // 3. バッチコミット
        await batch.commit();

        return res.status(200).json({ success: true });
    } catch (e: any) {
        console.error('Admin user deletion error:', e);
        // Firebase Auth のエラー (例: ユーザーが見つからないなど) もここで処理
        return res.status(500).json({ success: false, error: e.message || 'Internal server error during deletion.' });
    }
}
