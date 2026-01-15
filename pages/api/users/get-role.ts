import { NextApiRequest, NextApiResponse } from 'next';
import nookies from 'nookies';
import { adminAuth } from '@/lib/firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const cookies = nookies.get({ req });
    
    // 【修正】セッションがない場合は401を返さず、role: null で正常終了させる
    if (!cookies.session) {
      return res.status(200).json({ 
        role: null, 
        roles: [], 
        plan: null,
        authenticated: false 
      });
    }

    // セッションクッキーの検証
    const token = await adminAuth.verifySessionCookie(cookies.session, true);
    
    const role = token.role || 'user';
    const plan = token.plan || 'free'; 
    const roles = token.roles || [role];

    console.log(`[GetRole] User: ${token.uid}, Role: ${role}, Plan: ${plan}`);

    res.status(200).json({ 
      role, 
      roles,
      plan,
      uid: token.uid,
      authenticated: true
    });

  } catch (error) {
    // 【修正】トークンエラー時もリダイレクトループを防ぐため200でゲスト扱いにする
    console.error("Error fetching user data:", error);
    res.status(200).json({ 
      role: null, 
      roles: [], 
      plan: null,
      authenticated: false,
      error: 'Invalid session'
    });
  }
}