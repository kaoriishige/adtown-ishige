// pages/api/login.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import nookies from 'nookies';
import { getAuth } from 'firebase-admin/auth';
import { adminAuth } from '@/lib/firebase-admin'; // 修正: 独自の初期化関数をインポート

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  try {
    const { token } = req.body as { token: string };
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5日間

    const sessionCookie = await adminAuth.createSessionCookie(token, { expiresIn });

    // クッキーオプション (ローカルと本番で切り替え)
    const options =
      process.env.NODE_ENV === 'production'
        ? {
            maxAge: expiresIn / 1000,
            httpOnly: true,
            secure: true,
            path: '/',
            sameSite: 'none' as const,
          }
        : {
            maxAge: expiresIn / 1000,
            httpOnly: true,
            secure: false,
            path: '/',
            sameSite: 'lax' as const, // 修正: ローカルではlaxが最も安定的
          };

    nookies.set({ res }, 'token', sessionCookie, options);
    res.status(200).json({ success: true });

  } catch (error) {
    console.error('Login API error:', error);
    res.status(401).json({ error: 'Unauthorized' });
  }
}






