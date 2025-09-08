import { NextApiRequest, NextApiResponse } from 'next';
import nookies from 'nookies';

const handler = (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).end(); // POSTメソッド以外は許可しない
  }

  try {
    // Cookieを削除
    nookies.destroy(
      { res }, // resオブジェクトを渡す
      'token', // 削除したいCookieの名前
      {
        path: '/', // アプリケーション全体で有効なCookieを削除
      }
    );
    
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

export default handler;