import type { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '../../../lib/firebase-admin';

// このAPIハンドラの正しい構造
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // このAPIは手動実行用なので、特定のメソッド（例: POST）のみを許可
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    // 管理者からのリクエストか認証する
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) {
      return res.status(401).json({ error: 'Authentication token is required.' });
    }
    await adminAuth.verifyIdToken(idToken);

    //
    // --- ここにリワードの再計算ロジックを実装します ---
    // (例: 全ユーザーのポイントを計算し直してFirestoreを更新するなど)
    //
    // この例では、インポートしたadminDbを直接使います
    const usersSnapshot = await adminDb.collection('users').get();
    console.log(`Recalculating rewards for ${usersSnapshot.size} users...`);
    // ...計算処理...
    //

    // 成功したことをクライアントに伝える
    return res.status(200).json({ message: 'Reward recalculation process started successfully.' });



  } catch (error: any) {
    console.error('Error recalculating rewards:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
}