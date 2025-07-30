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
    const { inquiryId, status } = req.body;
    if (!inquiryId || !status) {
      return res.status(400).json({ error: 'inquiryId and status are required' });
    }
    const inquiryRef = admin.firestore().collection('inquiries').doc(inquiryId);
    await inquiryRef.update({
      status: status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.status(200).json({ message: 'Status updated successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
}