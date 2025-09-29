import { NextApiRequest, NextApiResponse } from 'next';
import stripe from '@/lib/stripe';
import { adminAuth } from '@/lib/firebase-admin'; // ★ここを修正しました

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  const { sessionId } = req.body;

  if (!sessionId) {
    return res.status(400).json({ error: 'Session ID is required.' });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const firebaseUid = session.metadata?.firebaseUID;
    
    if (!firebaseUid) {
      return res.status(404).json({ error: 'Firebase UID not found in session metadata.' });
    }

    const customToken = await adminAuth.createCustomToken(firebaseUid);
    res.status(200).json({ customToken });

  } catch (error: any) {
    console.error('Error generating custom token:', error);
    res.status(500).json({ error: error.message });
  }
}