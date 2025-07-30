import type { NextApiRequest, NextApiResponse } from 'next';
import admin from '../../lib/firebase-admin';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
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
    const rewardsSnapshot = await admin.firestore().collection('rewards').get();
    let totalAmount = 0;
    rewardsSnapshot.forEach(doc => {
      totalAmount += doc.data().amount || 0;
    });
    const summary = {
      totalRewardsCount: rewardsSnapshot.size,
      totalRewardsAmount: totalAmount,
    };
    res.status(200).json(summary);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
}