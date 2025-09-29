import type { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, getAdminDb } from '../../../lib/firebase-admin';
import nookies from 'nookies';
import * as admin from 'firebase-admin';

type SuccessResponse = {
  message: string;
  newBalance?: number;
};

type ErrorResponse = {
  error: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | ErrorResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // --- 管理者認証 ---
    const cookies = nookies.get({ req });
    if (!cookies.token) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }
    const token = await adminAuth().verifySessionCookie(cookies.token, true);
    const adminUser = await adminAuth().getUser(token.uid);
    if (adminUser.customClaims?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: User is not an admin' });
    }

    const { uid, amount, reason } = req.body;

    // --- 入力値のバリデーション ---
    if (!uid || typeof uid !== 'string') {
      return res.status(400).json({ error: 'Valid user ID (uid) is required.' });
    }
    if (typeof amount !== 'number' || isNaN(amount)) {
      return res.status(400).json({ error: 'Valid amount is required.' });
    }
    if (!reason || typeof reason !== 'string' || !reason.trim()) {
      return res.status(400).json({ error: 'A reason for the adjustment is required.' });
    }
    
    const db = getAdminDb();
    const userRef = db.collection('users').doc(uid);
    const logRef = db.collection('pointTransactionLogs').doc(); // 監査ログ用の新しいドキュメント参照

    // --- トランザクションでポイントを更新 ---
    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) {
        throw new Error('User not found in Firestore.');
      }

      const userData = userDoc.data();
      const currentPoints = userData?.points || { balance: 0, usableBalance: 0 };
      
      const newBalance = (currentPoints.balance || 0) + amount;
      const newUsableBalance = (currentPoints.usableBalance || 0) + amount;

      // ポイントがマイナスにならないようにチェック (必要に応じて)
      if (newUsableBalance < 0) {
        throw new Error('Resulting usable balance cannot be negative.');
      }

      // ユーザーのポイントを更新
      transaction.update(userRef, {
        points: {
          balance: newBalance,
          usableBalance: newUsableBalance,
        },
      });
      
      // 監査ログを記録
      transaction.set(logRef, {
        userId: uid,
        amount: amount,
        reason: reason,
        adminId: token.uid, // 操作を実行した管理者のID
        adminEmail: token.email,
        beforeBalance: currentPoints.usableBalance,
        afterBalance: newUsableBalance,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        type: 'admin_adjustment',
      });
    });

    res.status(200).json({ message: 'Points adjusted successfully.' });

  } catch (error: any) {
    console.error('Error adjusting points:', error);
    res.status(500).json({ error: error.message || 'An unexpected error occurred.' });
  }
}