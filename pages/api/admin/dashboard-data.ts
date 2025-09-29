import type { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import nookies from 'nookies';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const cookies = nookies.get({ req });
    // 正しい呼び出しに修正
    const token = await adminAuth.verifySessionCookie(cookies.token, true);
    // 正しい呼び出しに修正
    const adminDoc = await adminDb.collection('users').doc(token.uid).get();

    if (!adminDoc.exists || adminDoc.data()?.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized: User is not an admin' });
    }

    // ここにダッシュボードのデータを取得するロジックを記述
    const usersSnapshot = await adminDb.collection('users').get();
    const partnersSnapshot = await adminDb.collection('partners').get();

    return res.status(200).json({
      totalUsers: usersSnapshot.size,
      totalPartners: partnersSnapshot.size,
    });
  } catch (error) {
    return res.status(500).json({ error: 'An error occurred' });
  }
}