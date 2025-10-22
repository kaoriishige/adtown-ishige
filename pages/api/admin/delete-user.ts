import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

// NOTE: このAPIは、adminユーザーの認証チェックを別途行う必要があります。

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).end('Method Not Allowed');
    }

    // 💡 認証ガードを省略 (開発モード) 💡
    // 本番環境では、ここで管理者の認証を確認する処理が必要です。

    const { uid } = req.body;

    if (!uid) {
        return res.status(400).json({ error: 'UID is required.' });
    }

    try {
        // 1. Firestore のユーザーデータを削除 (またはソフト削除)
        // ここでは、関連データのクリーンアップまたはソフト削除を行うべきです。
        // 例: 完全に削除する場合
        await adminDb.collection('users').doc(uid).delete();
        
        // 2. Firebase Auth からユーザーを削除
        await adminAuth.deleteUser(uid);

        console.log(`Successfully deleted user: ${uid} and their Firestore data.`);
        
        return res.status(200).json({ success: true, message: `User ${uid} deleted successfully.` });

    } catch (error) {
        console.error('Error deleting user:', error);
        if (error instanceof Error && 'code' in error && error.code === 'auth/user-not-found') {
            return res.status(404).json({ error: 'User not found in Firebase Auth.' });
        }
        return res.status(500).json({ error: 'Failed to delete user account.' });
    }
}
