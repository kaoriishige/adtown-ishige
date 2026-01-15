import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { refId, type } = req.body; // typeは 'user' | 'adver' | 'recruit'

  if (!refId || !['user', 'adver', 'recruit'].includes(type)) {
    return res.status(400).json({ error: 'Invalid parameters' });
  }

  try {
    const userRef = adminDb.collection('users').doc(refId);
    
    // カテゴリごとに対応する統計フィールドをカウントアップ
    const fieldName = `stats_${type}`; // stats_user, stats_adver, stats_recruit
    
    await userRef.update({
      [`${fieldName}.clicks`]: FieldValue.increment(1)
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Click tracking error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}