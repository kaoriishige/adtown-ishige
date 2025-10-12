import type { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) throw new Error('No token provided');
    await adminAuth.verifyIdToken(idToken);

    const { inquiryId, status } = req.body;
    if (!inquiryId || !status) {
      return res.status(400).json({ error: 'Inquiry ID and status are required.' });
    }

    const inquiryRef = adminDb.collection('inquiries').doc(inquiryId);
    await inquiryRef.update({
      status: status,
      updatedAt: new Date().toISOString(),
    });

    return res.status(200).json({ message: 'Status updated successfully.' });

  } catch (error: any) {
    console.error('Failed to update inquiry status:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}