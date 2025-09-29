import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '../../../lib/firebase-admin';
import nookies from 'nookies';
import * as admin from 'firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const cookies = nookies.get({ req });
    if (!cookies.token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const token = await adminAuth.verifySessionCookie(cookies.token, true);
    const { uid } = token;
    const { storeId, amount } = req.body;

    if (!storeId || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid request parameters' });
    }

    const db = adminDb;
    const userRef = db.collection('users').doc(uid);
    const storeRef = db.collection('users').doc(storeId); // 店舗もusersコレクションにある前提

    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      const storeDoc = await transaction.get(storeRef);

      if (!userDoc.exists) {
        throw new Error('User not found');
      }
      if (!storeDoc.exists || storeDoc.data()?.role !== 'partner') {
        throw new Error('Store not found');
      }

      const userPoints = userDoc.data()?.points;
      if (!userPoints || userPoints.usableBalance < amount) {
        throw new Error('Insufficient points');
      }

      // 1. ユーザーのポイントを減算
      transaction.update(userRef, {
        "points.usableBalance": admin.firestore.FieldValue.increment(-amount),
        // ▼▼▼【修正点】最終利用日時を現在時刻で更新 ▼▼▼
        "lastTransactionAt": admin.firestore.FieldValue.serverTimestamp()
      });

      // 2. 店舗の未払い収益を増算
      transaction.update(storeRef, {
        "payouts.pendingBalance": admin.firestore.FieldValue.increment(amount)
      });
      
      // 3. 取引履歴を作成
      const transactionRef = db.collection('transactions').doc();
      transaction.set(transactionRef, {
          userId: uid,
          storeId: storeId,
          amount: amount,
          type: 'payment',
          status: 'completed',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    res.status(200).json({ success: true, message: 'Payment successful' });

  } catch (error: any) {
    console.error("Payment processing failed:", error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}