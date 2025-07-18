// pages/api/inquiries/update-status.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { admin } from '../../../lib/firebase-admin';
import nookies from 'nookies';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  try {
    // 管理者認証
    const cookies = nookies.get({ req });
    const token = await admin.auth().verifyIdToken(cookies.token);
    if (!token.uid) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const { inquiryId, newStatus } = req.body;
    if (!inquiryId || !newStatus) {
      return res.status(400).json({ error: 'Missing parameters' });
    }

    const db = admin.firestore();
    await db.collection('inquiries').doc(inquiryId).update({
      status: newStatus,
    });

    res.status(200).json({ success: true, message: 'Status updated successfully' });

  } catch (error: any) {
    console.error("Status update error:", error);
    res.status(500).json({ error: error.message });
  }
};

export default handler;
