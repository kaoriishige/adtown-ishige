// pages/api/logout.ts

import { NextApiRequest, NextApiResponse } from 'next';
import nookies from 'nookies';

// reqとresの両方をany型に変更
const handler = (req: any, res: any) => {
  nookies.destroy(
    { req, res },
    'token',
    { path: '/' }
  );
  res.status(200).json({ success: true });
};

export default handler;
