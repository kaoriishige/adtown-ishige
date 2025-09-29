import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '../../../lib/firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).end();
  }

  const { storeId } = req.query;

  if (typeof storeId !== 'string') {
    return res.status(400).json({ error: 'Invalid store ID' });
  }

  try {
    const db = adminDb();
    // 店舗(パートナー)もusersコレクションにある前提
    const storeDoc = await db.collection('users').doc(storeId).get();

    if (!storeDoc.exists || storeDoc.data()?.role !== 'partner') {
      return res.status(404).json({ error: 'Store not found' });
    }

    const storeName = storeDoc.data()?.storeName || '不明な店舗';
    res.status(200).json({ storeName });

  } catch (error) {
    console.error(`Failed to fetch store name for ${storeId}`, error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}