import type { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import nookies from 'nookies';

/**
 * AIマッチング結果（matchResultsコレクション）を削除するAPIハンドラ
 * (ユーザーが見送った求人をリストから除外する)
 */
export default async function handler(
    req: NextApiRequest,
    // ★★★ 修正箇所: message?: string を型定義に追加 ★★★
    res: NextApiResponse<{ success: boolean; error?: string; message?: string }>
) {
    if (req.method !== 'DELETE') {
        res.setHeader('Allow', 'DELETE');
        return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    let currentUserUid: string;
    const db = adminDb;

    try {
        // 1. 認証チェック
        const cookies = nookies.get({ req });
        const token = await adminAuth.verifySessionCookie(cookies.session || '', true);
        currentUserUid = token.uid;
    } catch (err) {
        console.error('Authentication Error:', err);
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    try {
        const { matchId } = req.body;

        if (!matchId) {
            return res.status(400).json({ success: false, error: 'matchId が不足しています。' });
        }

        const matchRef = db.collection('matchResults').doc(matchId);
        const matchDoc = await matchRef.get();

        if (!matchDoc.exists) {
             // ドキュメントが存在しない場合は、成功として扱う（冪等性のため）
             // message プロパティを使用するように修正
             return res.status(200).json({ success: true, message: 'Match result already deleted or not found.' });
        }
        
        // 2. 権限チェック: 削除しようとしているマッチング結果が、ログインユーザーのものであることを確認
        if (matchDoc.data()?.userUid !== currentUserUid) {
            return res.status(403).json({ success: false, error: 'Forbidden: 削除権限がありません。' });
        }

        // 3. 削除実行
        await matchRef.delete();

        return res.status(200).json({ success: true, message: 'Match result deleted successfully.' });
    } catch (error) {
        console.error('Match deletion error:', error);
        return res.status(500).json({ success: false, error: 'Internal Server Error during deletion' });
    }
}