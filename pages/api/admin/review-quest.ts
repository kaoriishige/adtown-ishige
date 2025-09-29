import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, getAdminDb } from '../../../lib/firebase-admin';
import nookies from 'nookies';
import * as admin from 'firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') { return res.status(405).end(); }

  try {
    // 管理者認証
    const cookies = nookies.get({ req });
    const token = await adminAuth().verifySessionCookie(cookies.token, true);
    const adminDoc = await getAdminDb().collection('users').doc(token.uid).get();
    if (!adminDoc.exists || adminDoc.data()?.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { userId, questId, action } = req.body; // actionは 'approve' または 'reject'
    if (!userId || !questId || !action) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const db = getAdminDb();
    const userQuestRef = db.collection('users').doc(userId).collection('acceptedQuests').doc(questId);
    
    if (action === 'approve') {
        await db.runTransaction(async (transaction) => {
            const userQuestDoc = await transaction.get(userQuestRef);
            if (!userQuestDoc.exists || userQuestDoc.data()?.status !== 'submitted') {
                throw new Error('This quest is not awaiting approval.');
            }

            const reward = userQuestDoc.data()?.reward || 0;
            if (reward <= 0) { throw new Error('Invalid reward amount.'); }

            // 1. ユーザーのクエストステータスを 'completed' に更新
            transaction.update(userQuestRef, { status: 'completed', reviewedAt: admin.firestore.FieldValue.serverTimestamp() });

            // 2. ユーザーのポイント残高に報酬を加算し、最終利用日を更新
            const userRef = db.collection('users').doc(userId);
            transaction.update(userRef, {
                "points.usableBalance": admin.firestore.FieldValue.increment(reward),
                "lastTransactionAt": admin.firestore.FieldValue.serverTimestamp()
            });
            
            // 3. ポイント履歴に記録
            const historyRef = userRef.collection("pointHistory").doc();
            transaction.set(historyRef, {
                amount: reward,
                type: "quest_reward",
                description: `クエスト報酬: ${userQuestDoc.data()?.title}`,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        });
        res.status(200).json({ success: true, message: 'Quest approved and points awarded.' });

    } else if (action === 'reject') {
        await userQuestRef.update({ status: 'rejected', reviewedAt: admin.firestore.FieldValue.serverTimestamp() });
        res.status(200).json({ success: true, message: 'Quest rejected.' });

    } else {
        res.status(400).json({ error: 'Invalid action.' });
    }

  } catch (error: any) {
    console.error("Quest review failed:", error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}