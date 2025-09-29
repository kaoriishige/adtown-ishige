import type { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import nookies from 'nookies';

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
    
    const settings = req.body;
    
    await adminDb.collection('settings').doc('referral').set(settings);
    
    return res.status(200).json({ message: 'Settings saved successfully' });
    
  } catch (error) {
    return res.status(500).json({ error: 'An error occurred' });
  }
}