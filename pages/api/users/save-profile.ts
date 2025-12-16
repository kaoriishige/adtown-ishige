// pages/api/users/save-profile.ts
import { NextApiRequest, NextApiResponse } from 'next';
import nookies from 'nookies';
// ★★★ 2552エラーを解消する重要な修正箇所 ★★★
import * as admin from 'firebase-admin'; 
import { adminAuth, adminDb } from '../../../lib/firebase-admin'; 

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    // 1. セッションクッキーからUIDを取得し、認証
    const cookies = nookies.get({ req });
    const sessionCookie = cookies.session || '';
    let currentUserUid: string | null = null;
    
    try {
        const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
        currentUserUid = decodedToken.uid;
    } catch (error) {
        return res.status(401).json({ error: 'Unauthorized: セッションが切れました。再ログインしてください。' });
    }

    if (!currentUserUid) {
        return res.status(401).json({ error: 'Unauthorized: ユーザーIDが見つかりません。' });
    }

    // 2. データ検証とAdmin SDKによる書き込み
    try {
        const { dataToSave } = req.body; 

        if (!dataToSave) {
             return res.status(400).json({ error: '送信データが不足しています。' });
        }
        
        // 33行目: Cannot find name 'admin' の原因箇所。修正した 'admin' を使用。
        dataToSave.updatedAt = admin.firestore.FieldValue.serverTimestamp();
        
        // Admin SDKでFirestoreに書き込む
        await adminDb.collection('userProfiles').doc(currentUserUid).set(dataToSave, { merge: true });

        return res.status(200).json({ success: true, message: 'プロフィールを正常に保存しました。' });

    } catch (error: any) {
        console.error('API Firestore Write Error:', error);
        return res.status(500).json({ error: `保存中にサーバー側で予期せぬエラーが発生しました: ${error.message}` });
    }
}