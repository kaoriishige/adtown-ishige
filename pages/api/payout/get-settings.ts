import type { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-04-10',
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    // パートナー本人を認証
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) throw new Error('No token provided');
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // FirestoreからパートナーのStripeアカウントIDを取得
    const partnerDoc = await adminDb.collection('partners').doc(uid).get();
    if (!partnerDoc.exists) {
      return res.status(404).json({ error: 'Partner not found.' });
    }
    const stripeAccountId = partnerDoc.data()?.stripeAccountId;

    if (!stripeAccountId) {
      return res.status(404).json({ error: 'Stripe account not connected.' });
    }

    // Stripe APIからアカウント情報を取得
    const account = await stripe.accounts.retrieve(stripeAccountId);

    return res.status(200).json({
      stripeAccountId: account.id,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      email: account.email,
    });

  } catch (error: any) {
    console.error('Failed to get payout settings:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}