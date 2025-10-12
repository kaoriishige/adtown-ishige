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

    const { dealId } = req.body;
    if (!dealId) {
      return res.status(400).json({ error: 'Deal ID is required.' });
    }

    const dealRef = adminDb.collection('foodLossDeals').doc(dealId);
    const dealDoc = await dealRef.get();

    if (!dealDoc.exists) {
      return res.status(404).json({ error: 'Deal not found.' });
    }
    
    // セキュリティチェック：ディールを作成した本人か確認
    if (dealDoc.data()?.partnerId !== uid) {
        return res.status(403).json({ error: 'You are not authorized to close this deal.' });
    }

    // ディールのステータスを更新
    await dealRef.update({
      status: 'closed', // 'ended'から'closed'に変更するなど、状態を明確に
      closedAt: new Date().toISOString(),
    });

    return res.status(200).json({ message: 'Deal closed successfully.' });

  } catch (error: any) {
    console.error('Error closing deal:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
}