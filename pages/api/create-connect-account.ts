import type { NextApiRequest, NextApiResponse } from 'next';
import { admin } from '../../lib/firebase-admin';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  try {
    const { authorization } = req.headers;
    if (!authorization) return res.status(401).json({ error: 'Unauthorized' });
    const token = authorization.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    const { uid, email } = decodedToken;
    const db = admin.firestore();
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();
    let stripeConnectAccountId = userDoc.data()?.stripeConnectAccountId;
    if (!stripeConnectAccountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });
      stripeConnectAccountId = account.id;
      await userRef.set({ stripeConnectAccountId }, { merge: true });
    }
    const accountLink = await stripe.accountLinks.create({
      account: stripeConnectAccountId,
      refresh_url: `${req.headers.origin}/mypage`,
      return_url: `${req.headers.origin}/mypage`,
      type: 'account_onboarding',
    });
    res.status(200).json({ url: accountLink.url });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
}