import type { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '../../lib/firebase-admin';
import Stripe from 'stripe';

// Stripeを初期化。as stringで型アサーションを行う
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-04-10',
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // POSTリクエスト以外は拒否
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    // 1. ユーザーを認証する
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) {
      return res.status(401).json({ error: 'No token provided' });
    }
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const userEmail = decodedToken.email;

    // 2. Firestoreからパートナー情報を取得
    const partnerDocRef = adminDb.collection('partners').doc(uid);
    const partnerDoc = await partnerDocRef.get();
    if (!partnerDoc.exists) {
      return res.status(404).json({ error: 'Partner data not found' });
    }
    const partnerData = partnerDoc.data();
    let stripeAccountId = partnerData?.stripeAccountId;

    // 3. Stripeアカウントがまだなければ作成する
    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: userEmail,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });
      stripeAccountId = account.id;

      // 作成したアカウントIDをFirestoreに保存
      await partnerDocRef.update({
        stripeAccountId: stripeAccountId,
      });
    }

    // 4. Stripeオンボーディング用のURL（アカウントリンク）を生成する
    const returnUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/partner/dashboard`;
    const refreshUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/partner/payout-settings`;

    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });

    // 5. 生成したURLをクライアントに返す
    return res.status(200).json({ url: accountLink.url });

  } catch (error: any) {
    console.error('Stripe Connect account creation failed:', error);
    return res.status(500).json({ error: error.message });
  }
}