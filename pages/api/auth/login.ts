import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth } from '@/lib/firebase-admin'; // ★修正: adminAuthを直接インポート

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).send({ message: 'Only POST requests allowed' });
  }

  const { idToken } = req.body;

  if (!idToken) {
    return res.status(401).send({ message: 'ID token is required.' });
  }

  // セッションクッキーの有効期限（例：5日間）
  const expiresIn = 60 * 60 * 24 * 5 * 1000;

  try {
    // IDトークンからセッションクッキーを作成
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
    
    // クッキーをHttpOnly, Secureで設定
    const options = { maxAge: expiresIn, httpOnly: true, secure: process.env.NODE_ENV === 'production' };
    res.setHeader('Set-Cookie', `session=${sessionCookie}; Max-Age=${options.maxAge}; Path=/; HttpOnly; ${options.secure ? 'Secure' : ''}`);
    
    res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('Error creating session cookie:', error);
    res.status(401).send({ message: 'Unauthorized request' });
  }
}