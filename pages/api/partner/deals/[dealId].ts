import type { NextApiRequest, NextApiResponse } from 'next';

// データベース処理などをすべて取り除いた、最小限のテストコード
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // URLからIDを取得
  const { dealId } = req.query;

  // 成功したというJSONを返すだけのシンプルな処理
  res.status(200).json({ 
    message: 'API route is working!', 
    dealId: dealId 
  });
}