import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  // このAPIはクライアントのログアウト処理を補完する役割です。
  // 今後のセッション管理拡張のために用意しています。
  res.status(200).json({ message: 'Logged out successfully' });
}

