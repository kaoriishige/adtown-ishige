import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminAuth, getAdminDb } from '../../../lib/firebase-admin';
import nookies from 'nookies';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { idToken } = req.body;
  if (!idToken) return res.status(400).json({ error: 'ID token is required.' });
  try {
    const decodedToken = await getAdminAuth().verifyIdToken(idToken);
    const { uid, email } = decodedToken;
    const userRef = getAdminDb().collection('users').doc(uid);
    const userDoc = await userRef.get();
    let userRole = 'user';
    if (!userDoc.exists) {
      await userRef.set({
        email: email,
        role: 'user',
        createdAt: new Date().toISOString(),
      }, { merge: true });
    } else {
      userRole = userDoc.data()?.role || 'user';
    }
    const expiresIn = 60 * 60 * 24 * 14 * 1000;
    const sessionCookie = await getAdminAuth().createSessionCookie(idToken, { expiresIn });
    const options = { maxAge: expiresIn, httpOnly: true, secure: process.env.NODE_ENV === 'production', path: '/' };
    nookies.set({ res }, 'token', sessionCookie, options);
    return res.status(200).json({ success: true, role: userRole });
  } catch (error) {
    console.error('Session login error:', error);
    return res.status(401).json({ error: 'Authentication failed.' });
  }
}



