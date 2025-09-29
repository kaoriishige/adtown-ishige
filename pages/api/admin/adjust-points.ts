import type { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import nookies from 'nookies';
import * as admin from 'firebase-admin';

type SuccessResponse = {
  message: string;
  newBalance: number;
};

type ErrorResponse = {
  error: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | ErrorResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const cookies = nookies.get({ req });
    const token = await adminAuth.verifySessionCookie(cookies.token, true);
    const adminDoc = await adminDb.collection('users').doc(token.uid).get();

    if (!adminDoc.exists || adminDoc.data()?.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized: User is not an admin' });
    }

    const { uid, amount, reason } = req.body;

    if (!uid || typeof amount !== 'number' || !reason) {
      return res.status(400).json({ error: 'Missing parameters' });
    }

    const userRef = adminDb.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentPoints = userDoc.data()?.points?.usableBalance || 0;
    const newBalance = currentPoints + amount;

    await userRef.update({
      'points.usableBalance': newBalance,
      'points.lastAdjustedAt': admin.firestore.FieldValue.serverTimestamp(),
      'points.lastAdjustedReason': reason,
    });

    return res.status(200).json({ message: 'Points adjusted successfully', newBalance });
  } catch (error) {
    return res.status(500).json({ error: 'An error occurred' });
  }
}