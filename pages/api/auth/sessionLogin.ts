import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminAuth, getAdminDb } from '../../../lib/firebase-admin';
import nookies from 'nookies';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }
  
  try {
    const { authorization } = req.headers;

    if (!authorization || !authorization.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization header is missing or invalid.' });
    }
    
    const idToken = authorization.split('Bearer ')[1];

    const decodedToken = await getAdminAuth().verifyIdToken(idToken);
    const { uid } = decodedToken;

    const userDoc = await getAdminDb().collection('users').doc(uid).get();

    if (!userDoc.exists) {
        throw new Error('User data not found.');
    }
    
    const userData = userDoc.data();
    const userRole = userData?.role || 'user';

    const expiresIn = 60 * 60 * 24 * 14 * 1000; // 14 days
    const sessionCookie = await getAdminAuth().createSessionCookie(idToken, { expiresIn });

    // ▼▼▼ ここからが修正箇所です ▼▼▼
    const options = { 
      maxAge: expiresIn / 1000, 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production', 
      path: '/',
      sameSite: 'lax' as 'lax', // sameSite属性を追加
    };
    // ▲▲▲ ここまでが修正箇所です ▲▲▲

    nookies.set({ res }, 'token', sessionCookie, options);

    return res.status(200).json({ success: true, role: userRole });

  } catch (error) {
    console.error('Session login error:', error);
    return res.status(401).json({ error: 'Authentication failed.' });
  }
}


