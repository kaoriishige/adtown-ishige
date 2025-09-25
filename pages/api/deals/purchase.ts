import { NextApiRequest, NextApiResponse } from 'next';
import { getAdminAuth, getAdminDb } from '../../../lib/firebase-admin';
import nookies from 'nookies';
import * as admin from 'firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  try {
    const cookies = nookies.get({ req });
    const token = await getAdminAuth().verifySessionCookie(cookies.token, true);
    const { uid } = token;
    const { dealId } = req.body;

    if (!dealId) {
      return res.status(400).json({ error: 'Deal ID is required' });
    }

    const db = getAdminDb();
    const userRef = db.collection('users').doc(uid);
    const dealRef = db.collection('deals').doc(dealId);

    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      const dealDoc = await transaction.get(dealRef);

      if (!userDoc.exists) { throw new Error('User not found'); }
      if (!dealDoc.exists) { throw new Error('Deal not found'); }

      const userData = userDoc.data();
      const dealData = dealDoc.data();
      const price = dealData?.price;

      if (!userData || !dealData || !price) { throw new Error('Invalid data'); }
      if (userData.points.usableBalance < price) { throw new Error('Insufficient points'); }

      // 1. ユーザーのポイントを減算し、最終利用日を更新
      transaction.update(userRef, {
        "points.usableBalance": admin.firestore.FieldValue.increment(-price),
        "lastTransactionAt": admin.firestore.FieldValue.serverTimestamp()
      });

      // 2. ユーザーの購入済みチケットとして記録
      const purchasedDealRef = userRef.collection('purchasedDeals').doc(dealId);
      transaction.set(purchasedDealRef, {
        ...dealData,
        purchasedAt: admin.firestore.FieldValue.serverTimestamp(),
        used: false,
      });

      // 3. 取引履歴を記録
      const transactionRef = db.collection('transactions').doc();
      transaction.set(transactionRef, {
        userId: uid,
        storeId: dealData.partnerId,
        amount: price,
        type: 'deal_purchase',
        dealId: dealId,
        dealTitle: dealData.title,
        status: 'completed',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    res.status(200).json({ success: true, message: 'Purchase successful' });

  } catch (error: any) {
    console.error("Deal purchase failed:", error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}