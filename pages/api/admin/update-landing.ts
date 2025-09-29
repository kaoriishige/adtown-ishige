import { NextApiRequest, NextApiResponse } from 'next';
import nookies from 'nookies';
import { adminAuth, getAdminDb } from '../../../lib/firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // POSTメソッド以外は許可しない
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 1. 管理者認証チェック
    const cookies = nookies.get({ req });
    const token = await adminAuth().verifySessionCookie(cookies.token, true);
    
    // もし管理者専用にするなら、ここでtoken.admin === true などをチェック
    if (!token.uid) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // 2. 送られてきたデータを取得
    const contentData = req.body;

    // 3. Firestoreにデータを保存
    const adminDb = getAdminDb();
    const docRef = adminDb.collection('settings').doc('landingV2');
    await docRef.set(contentData, { merge: true }); // merge:trueでドキュメントを上書き

    // 4. 成功応答を返す
    res.status(200).json({ success: true, message: '保存しました！' });

  } catch (error: any) {
    console.error('Landing page update error:', error);
    if (error.code === 'auth/session-cookie-expired' || error.code === 'auth/session-cookie-revoked') {
      return res.status(401).json({ error: 'セッションの有効期限が切れました。再度ログインしてください。' });
    }
    res.status(500).json({ error: 'サーバー内部でエラーが発生しました。' });
  }
}