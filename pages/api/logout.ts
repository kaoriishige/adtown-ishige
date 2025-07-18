// pages/api/logout.ts

import { NextApiRequest, NextApiResponse } from 'next';
import nookies from 'nookies';

const handler = (req: NextApiRequest, res: NextApiResponse) => {
  nookies.destroy(
    { res }, // 変更点： req を削除
    'token',
    { path: '/' }
  );
  res.status(200).json({ success: true });
};

export default handler;

