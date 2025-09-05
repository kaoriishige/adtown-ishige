import { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '../../../lib/firebase-admin';

// このAPIは認証されたユーザーのみがアクセスできるように、
// 実際の運用では認証チェックを追加するのが望ましいです。

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const db = getAdminDb();
    
    // "active"状態のクエストのみを取得
    const questsSnapshot = await db.collection('quests').where('status', '==', 'active').get();

    if (questsSnapshot.empty) {
      return res.status(200).json([]);
    }

    const quests = questsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    
    res.status(200).json(quests);

  } catch (error) {
    console.error('Error fetching quests:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}