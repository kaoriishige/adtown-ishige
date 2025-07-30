import type { NextApiRequest, NextApiResponse } from 'next';
import admin from '../../../lib/firebase-admin';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  try {
    const { authorization } = req.headers;
    if (!authorization) return res.status(401).json({ error: 'Unauthorized' });
    const token = authorization.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    if (decodedToken.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const db = admin.firestore();
    const usersSnapshot = await db.collection('users').where('referredBy', '!=', null).get();
    let recalculatedCount = 0;
    const batch = db.batch();
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      if (userData.subscriptionStatus === 'active') {
        const rewardAmount = 980 * 0.2; // 報酬率20%と仮定
        const rewardId = `recalc_${userDoc.id}_${new Date().getTime()}`;
        const rewardRef = db.collection('rewards').doc(rewardId);
        batch.set(rewardRef, {
          referrerUid: userData.referredBy,
          referredUid: userDoc.id,
          amount: rewardAmount,
          status: 'pending',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          notes: 'Manual recalculation',
        });
        recalculatedCount++;
      }
    }
    await batch.commit();
    res.status(200).json({ message: `Successfully recalculated rewards for ${recalculatedCount} users.` });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
}