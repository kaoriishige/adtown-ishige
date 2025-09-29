import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '../../../lib/firebase-admin';
import nookies from 'nookies';
import * as admin from 'firebase-admin';

const REVIEW_REWARD_POINTS = 5; // 投稿が承認された際に付与するポイント数

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') { return res.status(405).end(); }

  try {
    // 管理者認証
    const cookies = nookies.get({ req });
    const token = await adminAuth().verifySessionCookie(cookies.token, true);
    const adminDoc = await adminDb().collection('users').doc(token.uid).get();
    if (!adminDoc.exists || adminDoc.data()?.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { reviewId, action } = req.body; // actionは 'approve' または 'reject'
    if (!reviewId || !action) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const db = adminDb();
    const reviewRef = db.collection('reviews').doc(reviewId);
    
    const reviewDoc = await reviewRef.get();
    if (!reviewDoc.exists || reviewDoc.data()?.status !== 'pending') {
        throw new Error('This review is not awaiting approval.');
    }
    
    if (action === 'approve') {
        const userId = reviewDoc.data()?.userId;
        if (!userId) { throw new Error('User ID not found in review.'); }

        const userRef = db.collection('users').doc(userId);

        // トランザクションで複数の更新を安全に実行
        await db.runTransaction(async (transaction) => {
            // 1. レビューのステータスを 'approved' に更新
            transaction.update(reviewRef, { status: 'approved', reviewedAt: admin.firestore.FieldValue.serverTimestamp() });

            // 2. ユーザーにポイントを付与し、最終利用日を更新
            transaction.update(userRef, {
                "points.usableBalance": admin.firestore.FieldValue.increment(REVIEW_REWARD_POINTS),
                "lastTransactionAt": admin.firestore.FieldValue.serverTimestamp()
            });
            
            // 3. ポイント履歴に記録
            const historyRef = userRef.collection("pointHistory").doc();
            transaction.set(historyRef, {
                amount: REVIEW_REWARD_POINTS,
                type: "review_reward",
                description: `思い出の投稿ボーナス`,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        });
        res.status(200).json({ success: true, message: 'Review approved and points awarded.' });

    } else if (action === 'reject') {
        await reviewRef.update({ status: 'rejected', reviewedAt: admin.firestore.FieldValue.serverTimestamp() });
        res.status(200).json({ success: true, message: 'Review rejected.' });

    } else {
        res.status(400).json({ error: 'Invalid action.' });
    }

  } catch (error: any) {
    console.error("Review processing failed:", error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}