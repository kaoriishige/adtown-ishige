import { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from 'firebase-admin/auth';
import { adminDb, initializeAdminApp } from '@/lib/firebase-admin';

initializeAdminApp(); 
const adminAuth = getAuth();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  const { idToken } = req.body;
  if (!idToken) {
    return res.status(401).json({ error: 'ID token is required.' });
  }

  const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5日間

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // ★★★【最重要修正点】★★★
    // 'partners'ではなく'users'コレクションからユーザー情報を取得するように修正
    const userDoc = await adminDb.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      // データベースにユーザー情報がない場合はエラーを投げる
      throw new Error('User data not found in database.');
    }

    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
    const options = { maxAge: expiresIn / 1000, httpOnly: true, secure: process.env.NODE_ENV === 'production', path: '/' };
    res.setHeader('Set-Cookie', `token=${sessionCookie}; Max-Age=${options.maxAge}; Path=${options.path}; ${options.httpOnly ? 'HttpOnly;' : ''} ${options.secure ? 'Secure;' : ''} SameSite=Lax`);
    
    res.status(200).json({ status: 'success' });
  } catch (error: any) {
    console.error('Login API error:', error);
    res.status(401).json({ error: '認証に失敗しました: ' + error.message });
  }
}