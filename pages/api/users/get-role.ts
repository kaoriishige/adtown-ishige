import { NextApiRequest, NextApiResponse } from 'next';
import nookies from 'nookies';
import { adminAuth } from '@/lib/firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const cookies = nookies.get({ req });
    // ★修正: cookies.token を cookies.session に戻す
    if (!cookies.session) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // ★修正: cookies.token を cookies.session に戻す
    const token = await adminAuth.verifySessionCookie(cookies.session, true);
    
    // 🔹 トークンから role と一緒に plan も取得 (ロジックは維持)
    const role = token.role || 'user';
    const plan = token.plan || 'free'; // planクレイムがなければ'free'を返す

    // 🔹 両方の情報をクライアントに返す (ロジックは維持)
    res.status(200).json({ role, plan });

  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(401).json({ error: 'Invalid token' });
  }
}