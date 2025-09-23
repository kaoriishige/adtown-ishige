// pages/api/login.ts
import { NextApiRequest, NextApiResponse } from 'next';
import nookies from 'nookies';
import { getAuth } from 'firebase-admin/auth';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  try {
    const idToken = req.body.token; // クライアントから送られてきた Firebase ID トークン
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5日間（必要に応じて変更）

    // Firebase Admin SDKでセッションクッキーを発行
    const sessionCookie = await getAuth().createSessionCookie(idToken, { expiresIn });

    const options = {
      maxAge: expiresIn / 1000, // 秒単位
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    };

    // セッションクッキーをセット
    nookies.set({ res }, 'token', sessionCookie, options);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Login API error:', error);
    res.status(401).json({ error: 'Unauthorized' });
  }
};

export default handler;
