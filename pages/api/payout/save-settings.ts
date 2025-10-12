import type { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    // ユーザーを認証
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) {
      return res.status(401).json({ error: 'Authentication token is required.' });
    }
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // リクエストのボディから設定情報を取得 (例)
    const { accountHolderName, accountNumber } = req.body;

    if (!accountHolderName || !accountNumber) {
        return res.status(400).json({ error: 'Required payout information is missing.' });
    }
    
    // インポートしたadminDbを直接使ってユーザーのドキュメントを更新
    const userRef = adminDb.collection('users').doc(uid);
    
    await userRef.update({
      payoutSettings: {
        accountHolderName,
        accountNumber,
        updatedAt: new Date().toISOString(),
      }
    });

    return res.status(200).json({ message: 'Payout settings saved successfully.' });

  } catch (error: any) {
    console.error('Error saving payout settings:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
}
