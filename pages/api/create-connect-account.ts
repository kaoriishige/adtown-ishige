import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { admin } from '../../lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  
  if (req.method !== 'POST') {
    return res.status(405).setHeader('Allow', 'POST').end('Method Not Allowed');
  }

  try {
    const { token } = req.body;
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const decodedToken = await getAuth().verifyIdToken(token);
    const uid = decodedToken.uid;

    const userDocRef = admin.firestore().collection('users').doc(uid);
    const userDoc = await userDocRef.get();
    const userData = userDoc.data();

    if (!userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    let stripeConnectId = userData.stripeConnectId;

    if (!stripeConnectId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: userData.email,
      });
      stripeConnectId = account.id;
      await userDocRef.update({ stripeConnectId: stripeConnectId });
    }

    const accountLink = await stripe.accountLinks.create({
      account: stripeConnectId,
      refresh_url: `${req.headers.origin}/mypage`,
      return_url: `${req.headers.origin}/mypage?stripe-return=true`,
      type: 'account_onboarding',
    });

    res.status(200).json({ url: accountLink.url });

  } catch (error: any) {
    console.error("Stripe Connect API error:", error);
    res.status(500).json({ error: error.message });
  }
}