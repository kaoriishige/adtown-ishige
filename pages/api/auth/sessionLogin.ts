import { NextApiRequest, NextApiResponse } from 'next';
import { getAdminAuth } from '@/lib/firebase-admin';
import { serialize } from 'cookie';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { idToken } = req.body;
  if (!idToken) {
    return res.status(400).json({ error: 'ID token is missing.' });
  }

  try {
    const adminAuth = getAdminAuth();
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    const options = {
      maxAge: expiresIn / 1000, // maxAge must be in seconds
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' ? true : false,
      path: '/',
      sameSite: 'lax' as 'lax',
    };

    res.setHeader('Set-Cookie', serialize('token', sessionCookie, options));

    return res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('Session cookie creation error:', error);
    return res.status(401).json({ error: 'Unauthorized. Invalid ID token.' });
  }
}




