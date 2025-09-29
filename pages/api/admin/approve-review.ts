import type { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import nookies from 'nookies';
import * as admin from 'firebase-admin';

const REVIEW_REWARD_POINTS = 5;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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

    const { reviewId, action } = req.body;
    if (!reviewId || (action !== 'approve' && action !== 'reject')) {
      return res.status(400).json({ error: 'Missing reviewId or invalid action' });
    }

    const reviewRef = adminDb.collection('reviews').doc(reviewId);
    const review = await reviewRef.get();

    if (!review.exists) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (action === 'approve') {
      await reviewRef.update({ status: 'approved', reviewedAt: admin.firestore.FieldValue.serverTimestamp() });
      return res.status(200).json({ message: 'Review approved' });
    } else {
      await reviewRef.update({ status: 'rejected', reviewedAt: admin.firestore.FieldValue.serverTimestamp() });
      return res.status(200).json({ message: 'Review rejected' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'An error occurred' });
  }
}