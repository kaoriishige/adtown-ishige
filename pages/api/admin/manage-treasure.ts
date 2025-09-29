import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '../../../lib/firebase-admin';
import nookies from 'nookies';
import * as admin from 'firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 管理者認証
  try {
    const cookies = nookies.get({ req });
    const token = await adminAuth().verifySessionCookie(cookies.token, true);
    const adminDoc = await adminDb().collection('users').doc(token.uid).get();
    if (!adminDoc.exists || adminDoc.data()?.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
  } catch (error) {
    return res.status(401).json({ error: 'Authentication failed' });
  }

  const db = adminDb();

  // 新しい宝箱の作成 (POST)
  if (req.method === 'POST') {
    try {
      const { name, latitude, longitude, points, activeUntil } = req.body;
      if (!name || !latitude || !longitude || !points || !activeUntil) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      const newTreasure = {
        name,
        location: new admin.firestore.GeoPoint(Number(latitude), Number(longitude)),
        points: Number(points),
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        activeUntil: admin.firestore.Timestamp.fromDate(new Date(activeUntil)),
      };
      const docRef = await db.collection('treasures').add(newTreasure);
      res.status(200).json({ success: true, id: docRef.id });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
  // (ここに後から削除(DELETE)や更新(PUT)のロジックも追加可能)
  else {
    res.status(405).end();
  }
}