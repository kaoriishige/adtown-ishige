import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import nookies from 'nookies';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 管理者認証
    const cookies = nookies.get({ req });
    const token = await adminAuth().verifySessionCookie(cookies.token, true);
    if (token.role !== 'admin') {
      return res.status(403).json({ error: 'アクセス権がありません。' });
    }

    const settings = req.body;
    // TODO: バリデーションを追加（例：報酬率が0-100の間かなど）

    const adminDb = adminDb();
    await adminDb.collection('settings').doc('referral').set(settings);

    res.status(200).json({ success: true });

  } catch (error: any) {
    res.status(500).json({ error: error.message || 'サーバーエラー' });
  }
}