import { NextApiRequest, NextApiResponse } from 'next';
import { getAdminAuth } from '../../../lib/firebase-admin';
import nookies from 'nookies';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  try {
    const adminAuth = getAdminAuth();
    const idToken = req.body.idToken;
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5日間

    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
    
    const options = {
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    };

    nookies.set({ res }, 'token', sessionCookie, options);

    res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('Session login error:', error);
    res.status(401).json({ error: 'Unauthorized' });
  }
}