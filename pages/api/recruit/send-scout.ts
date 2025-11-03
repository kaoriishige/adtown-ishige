import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

// --- メイン スカウト送信ハンドラー ---
export default async function handler(req: NextApiRequest, res: NextApiResponse<{ message: string } | { error: string }>) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { candidateId } = req.body;
    
    // 認証とUIDの取得
    const sessionCookie = req.cookies.session || '';
    let companyUid: string;

    try {
        const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
        companyUid = decodedClaims.uid;
    } catch (e) {
        return res.status(401).json({ error: '認証トークンの検証に失敗しました。再ログインしてください。' });
    }

    if (!candidateId) {
        return res.status(400).json({ error: '候補者IDが不足しています。' });
    }

    try {
        // 企業情報（通知表示用）を取得
        const companySnap = await adminDb.collection('users').doc(companyUid).get();
        const companyName = companySnap.data()?.companyName || '企業パートナー';

        // スカウト記録の重複チェック
        const existingScout = await adminDb.collection('scoutHistory')
            .where('companyUid', '==', companyUid)
            .where('candidateId', '==', candidateId)
            .limit(1)
            .get();

        if (!existingScout.empty) {
            return res.status(200).json({ message: 'この候補者には既にスカウトを送信済みです。' });
        }

        // スカウト履歴をデータベースに記録 (企業側)
        await adminDb.collection('scoutHistory').add({
            companyUid: companyUid,
            candidateId: candidateId,
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
            status: 'sent', // 状態を 'sent' として記録
        });
        
        // 求職者側（候補者）の通知コレクションを更新
        await adminDb.collection('userProfiles').doc(candidateId).collection('notifications').add({
            type: 'scout_received',
            message: `${companyName} からスカウトが届きました！AIマッチ度の高い求人です。`,
            companyUid: companyUid,
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        
        // 成功応答
        return res.status(200).json({ message: 'スカウトの送信に成功しました。' });

    } catch (e) {
        console.error('❌ スカウト送信APIエラー:', e);
        // データベースエラーやその他のサーバーエラー
        return res.status(500).json({ error: 'サーバー側でのスカウト送信処理中にエラーが発生しました。' });
    }
}
