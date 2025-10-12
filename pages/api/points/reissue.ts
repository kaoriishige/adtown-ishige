import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import nookies from 'nookies';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const cookies = nookies.get({ req });
    // トークンがない、または無効な場合はエラーを返す
    if (!cookies.token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const token = await adminAuth.verifySessionCookie(cookies.token, true);
    const { uid } = token;

    const userDoc = await adminDb.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const expiredAmount = userDoc.data()?.points?.expiredAmount || 0;
    if (expiredAmount <= 0) {
      return res.status(400).json({ error: 'No expired points to reissue' });
    }

    // 手数料を計算 (5%、最低1円)
    const feeAmount = Math.max(1, Math.floor(expiredAmount * 0.05));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'jpy',
          product_data: {
            name: '失効ポイント再発行手数料',
            description: `${expiredAmount.toLocaleString()}ポイント分の再発行`,
          },
          unit_amount: feeAmount,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${req.headers.origin}/mypage?reissue=success`,
      cancel_url: `${req.headers.origin}/mypage?reissue=cancel`,
      metadata: {
        userId: uid,
        reissueAmount: expiredAmount,
        type: 'point_reissue'
      }
    });

    res.status(200).json({ sessionId: session.id });

  } catch (error: any) {
    console.error("Reissue API error:", error);
    // ▼▼▼【修正点】一般的なエラーレスポンスに変更 ▼▼▼
    if (error.code === 'auth/session-cookie-expired' || error.code === 'auth/session-cookie-revoked') {
        return res.status(401).json({ error: 'Session expired, please log in again.' });
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
}