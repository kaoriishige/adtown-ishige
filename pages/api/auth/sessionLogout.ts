import type { NextApiRequest, NextApiResponse } from 'next';
import nookies from 'nookies';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  // Cookieを削除（maxAgeを0に設定）
  nookies.destroy(
    { res }, 
    'token', 
    { path: '/' }
  );

  res.status(200).json({ success: true });
}