import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '../../../lib/firebase-admin';
import nookies from 'nookies';
import * as admin from 'firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  try {
    // 認証：このAPIを呼び出すのがパートナー（店舗）であることを確認
    const cookies = nookies.get({ req });
    const token = await adminAuth().verifySessionCookie(cookies.token, true);
    const partnerId = token.uid;

    const partnerDoc = await adminDb().collection('users').doc(partnerId).get();
    if (!partnerDoc.exists || partnerDoc.data()?.role !== 'partner') {
      return res.status(403).json({ error: 'Unauthorized: Not a partner account' });
    }

    // リクエストからユーザーIDとチケットIDを取得
    const { userId, purchasedDealId } = req.body;
    if (!userId || !purchasedDealId) {
      return res.status(400).json({ error: 'User ID and Purchased Deal ID are required' });
    }

    const db = adminDb();
    const purchasedDealRef = db.collection('users').doc(userId).collection('purchasedDeals').doc(purchasedDealId);

    await db.runTransaction(async (transaction) => {
      const purchasedDealDoc = await transaction.get(purchasedDealRef);

      if (!purchasedDealDoc.exists) {
        throw new Error('Purchased ticket not found.');
      }
      
      const dealData = purchasedDealDoc.data();
      if (dealData?.used) {
        throw new Error('This ticket has already been redeemed.');
      }

      // チケットがこのパートナーのものであることを確認
      if (dealData?.partnerId !== partnerId) {
        throw new Error('This ticket does not belong to your store.');
      }

      // チケットを「使用済み」に更新し、店舗の未払い収益に残高を移動
      transaction.update(purchasedDealRef, {
        used: true,
        redeemedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      const partnerRef = db.collection('users').doc(partnerId);
      transaction.update(partnerRef, {
        "payouts.pendingBalance": admin.firestore.FieldValue.increment(dealData?.price || 0)
      });
    });

    res.status(200).json({ success: true, message: 'Ticket successfully redeemed.' });

  } catch (error: any) {
    console.error("Ticket redemption failed:", error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}