import { NextApiRequest, NextApiResponse } from 'next';
import nookies from 'nookies';
import { getAdminAuth } from '@/lib/firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 1. ブラウザから送られてきたクッキーを取得
    const cookies = nookies.get({ req });
    if (!cookies.token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // 2. クッキー内のトークンを検証し、ユーザー情報を取得
    const token = await getAdminAuth().verifySessionCookie(cookies.token, true);
    
    // 3. トークンに含まれる役割(role)をクライアントに返す
    res.status(200).json({ role: token.role || 'user' });

  } catch (error) {
    console.error("Error fetching user role:", error);
    res.status(401).json({ error: 'Invalid token' });
  }
}