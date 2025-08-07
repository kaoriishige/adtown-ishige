import type { NextApiRequest, NextApiResponse } from 'next';
import nookies from 'nookies';
import { getAdminAuth } from '../../../lib/firebase-admin'; // 共通ファイルをインポート

// 返却するデータの型
interface ResponseData {
  role?: 'admin' | 'user' | null;
  error?: string;
}

// APIのメイン処理
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  try {
    const adminAuth = getAdminAuth();
    const cookies = nookies.get({ req });
    
    // トークンがなければ、ロールはnull
    if (!cookies.token) {
      return res.status(200).json({ role: null });
    }
    
    // トークンを検証
    const token = await adminAuth.verifyIdToken(cookies.token);
    
    // カスタムクレームからadminロールがあるか判断
    const role = token.admin === true ? 'admin' : 'user';

    res.status(200).json({ role });

  } catch (error) {
    // トークンが無効な場合は、ロールはnull
    console.error('get-role APIでのトークン検証エラー:', error);
    res.status(200).json({ role: null });
  }
}