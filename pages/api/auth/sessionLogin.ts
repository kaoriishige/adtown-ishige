import { NextApiRequest, NextApiResponse } from 'next';
import { getAdminAuth } from '@/lib/firebase-admin'; // tsconfig.jsonの絶対パス設定を使用

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const adminAuth = getAdminAuth();
    const idToken = req.body.idToken as string;

    if (!idToken) {
      return res.status(401).json({ error: 'ID token is missing.' });
    }

    // セッションCookieの有効期間（例：5日間）
    const expiresIn = 60 * 60 * 24 * 5 * 1000;
    
    // IDトークンからセッションCookieを作成
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    // クライアントのCookieにHttpOnlyでセキュアに設定
    const options = { maxAge: expiresIn, httpOnly: true, secure: process.env.NODE_ENV === 'production', path: '/' };
    res.setHeader('Set-Cookie', `token=${sessionCookie}; Max-Age=${options.maxAge}; Path=${options.path}; ${options.httpOnly ? 'HttpOnly;' : ''} ${options.secure ? 'Secure;' : ''}`);
    
    res.status(200).json({ status: 'success' });

  } catch (error) {
    console.error('Session login error:', error);
    res.status(401).json({ error: 'Unauthorized' });
  }
}