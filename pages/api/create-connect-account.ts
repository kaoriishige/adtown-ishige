// pages/api/create-connect-account.ts

import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { admin } from '../../lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  try {
    // ユーザーの認証情報を確認
    const { token } = req.body;
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const decodedToken = await getAuth().verifyIdToken(token);
    const uid = decodedToken.uid;

    const userDocRef = admin.firestore().collection('users').doc(uid);
    const userDoc = await userDocRef.get();
    let stripeConnectId = userDoc.data()?.stripeConnectId;

    // まだStripe ConnectアカウントIDがなければ、新しく作成する
    if (!stripeConnectId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: userDoc.data()?.email,
      });
      stripeConnectId = account.id;
      // 作成したIDをユーザー情報に保存
      await userDocRef.update({ stripeConnectId: stripeConnectId });
    }

    // ユーザーをStripeの登録ページにリダイレクトさせるためのURLを生成
    const accountLink = await stripe.accountLinks.create({
      account: stripeConnectId,
      refresh_url: `${req.headers.origin}/mypage`,
      return_url: `${req.headers.origin}/mypage?stripe-return=true`,
      type: 'account_onboarding',
    });

    res.status(200).json({ url: accountLink.url });

  } catch (error: any) {
    console.error("Stripe Connect error:", error);
    res.status(500).json({ error: error.message });
  }
}