import type { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import nookies from 'nookies';
import * as admin from 'firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const cookies = nookies.get({ req });
    const token = await adminAuth.verifySessionCookie(cookies.token, true);
    const adminDoc = await adminDb.collection('users').doc(token.uid).get();

    if (!adminDoc.exists || adminDoc.data()?.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { questId, action } = req.body;
    if (!questId || (action !== 'approve' && action !== 'reject')) {
      return res.status(400).json({ error: 'Invalid parameters' });
    }

    const questRef = adminDb.collection('quests').doc(questId);
    
    if (action === 'approve') {
      await questRef.update({ status: 'approved', reviewedAt: admin.firestore.FieldValue.serverTimestamp() });
    } else {
      await questRef.update({ status: 'rejected', reviewedAt: admin.firestore.FieldValue.serverTimestamp() });
    }

    return res.status(200).json({ message: 'Quest status updated successfully' });

  } catch (error) {
    return res.status(500).json({ error: 'An error occurred' });
  }
}