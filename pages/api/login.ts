// pages/api/login.ts

import { NextApiRequest, NextApiResponse } from 'next';
import nookies from 'nookies';

const handler = (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  // Cookieの有効期限（例: 1時間）
  const options = {
    maxAge: 60 * 60,
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  };

  nookies.set(
    { res },
    'token',
    req.body.token,
    options
  );
  
  res.status(200).json({ success: true });
};

export default handler;