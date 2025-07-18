// pages/api/logout.ts

import { NextApiRequest, NextApiResponse } from 'next';
import nookies from 'nookies';

const handler = (req: NextApiRequest, res: NextApiResponse) => {
  nookies.destroy(
    { req, res },
    'token',
    { path: '/' }
  );
  res.status(200).json({ success: true });
};

export default handler;
