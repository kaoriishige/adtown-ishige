// pages/api/user/get-role.ts (修正後)

import { NextApiRequest, NextApiResponse } from 'next';
import nookies from 'nookies';
import { adminAuth } from '@/lib/firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const cookies = nookies.get({ req });
    if (!cookies.token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const token = await adminAuth.verifySessionCookie(cookies.token, true);
    
    // ★ 1. トークンから role と一緒に plan も取得
    const role = token.role || 'user';
    const plan = token.plan || 'free'; // planクレイムがなければ'free'を返す

    // ★ 2. 両方の情報をクライアントに返す
    res.status(200).json({ role, plan });

  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(401).json({ error: 'Invalid token' });
  }
}