import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const isProduction = process.env.NODE_ENV === 'production';

    // Cookieを無効化するためのヘッダーを設定
    // Max-Age=0 と Expires を設定することで、ブラウザにCookieを即時削除させる
    // 開発環境(http)ではSecure属性を外す
    res.setHeader(
      'Set-Cookie',
      `token=; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; HttpOnly; ${
        isProduction ? 'Secure;' : ''
      } SameSite=Lax`
    );

    // 成功したことをクライアントに通知
    res.status(200).json({ status: 'success', message: 'Logged out' });
  } catch (error) {
    console.error('Logout API error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
}