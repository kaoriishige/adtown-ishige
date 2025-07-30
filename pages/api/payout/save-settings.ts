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
    await admin.firestore().collection('settings').doc('payout').set(req.body, { merge: true });
    res.status(200).json({ message: 'Settings saved successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
}