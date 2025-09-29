import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, getAdminDb } from '../../../lib/firebase-admin';
import nookies from 'nookies';

// Stripe SDKのインポートはStripe連携時に再度有効化します
// import Stripe from 'stripe';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 1. ユーザーを認証
    const cookies = nookies.get({ req });
    const token = await adminAuth().verifySessionCookie(cookies.token, true);
    const { uid } = token;

    // 2. リクエストから口座情報を取得
    const { bankName, branchName, accountType, accountNumber, accountName } = req.body;
    if (!bankName || !branchName || !accountType || !accountNumber || !accountName) {
      return res.status(400).json({ error: 'すべての必須フィールドを入力してください。' });
    }

    // 3. ユーザー自身のドキュメントに口座情報を保存
    const adminDb = getAdminDb();
    const userRef = adminDb.collection('users').doc(uid);
    
    await userRef.update({
      payoutSettings: { // payoutSettingsというオブジェクトにまとめて保存
        bankName,
        branchName,
        accountType,
        accountNumber,
        accountName,
        updatedAt: new Date(), // 更新日時を記録
      }
    });

    res.status(200).json({ success: true, message: '口座情報を保存しました。' });

  } catch (error: any) {
    console.error('Error saving payout settings:', error);
    // 認証エラーの場合も考慮
    if (error.code === 'auth/session-cookie-expired' || error.code === 'auth/session-cookie-revoked') {
      return res.status(401).json({ error: 'セッションの有効期限が切れました。再度ログインしてください。' });
    }
    res.status(500).json({ error: 'サーバー内部でエラーが発生しました。' });
  }
}

