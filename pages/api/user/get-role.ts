import type { NextApiRequest, NextApiResponse } from 'next';
import admin from '../../../lib/firebase-admin';
import nookies from 'nookies';

type Data = {
  role: 'admin' | 'user';
  error?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  try {
    // ユーザーを認証
    const cookies = nookies.get({ req });
    const token = await admin.auth().verifyIdToken(cookies.token);
    
    // トークン内のカスタムクレイムを確認
    const role = token.admin === true ? 'admin' : 'user';

    res.status(200).json({ role });
  } catch (error) {
    res.status(401).json({ role: 'user', error: '認証に失敗しました。' });
  }
}