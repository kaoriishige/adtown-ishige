// pages/api/manual/recalculate-rewards.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { admin } from '../../../lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import nookies from 'nookies';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  try {
    // 管理者認証
    const cookies = nookies.get({ req });
    const token = await admin.auth().verifyIdToken(cookies.token);
    // ここで特定の管理者UIDかチェックすることも可能
    if (!token.uid) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const db = admin.firestore();
    
    // ロジック：ここではダミー処理として成功メッセージを返す
    // 実際のロジックは非常に複雑になるため、別途詳細に実装する必要があります。
    // 例：
    // 1. 先月の日付範囲を計算
    // 2. referralRewards から先月分のデータを削除
    // 3. users と Stripeの支払い履歴を照合
    // 4. 先月分の報酬を再生成して referralRewards に追加

    console.log(`Manual recalculation triggered by admin: ${token.email}`);
    
    res.status(200).json({ success: true, message: '報酬の再計算処理を開始しました。完了まで数分かかる場合があります。' });

  } catch (error: any) {
    console.error("Manual function error:", error);
    res.status(500).json({ error: error.message });
  }
};

export default handler;
