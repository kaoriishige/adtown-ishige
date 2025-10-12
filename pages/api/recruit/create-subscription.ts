import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import stripe from '../../../lib/stripe';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const userDoc = await adminDb.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found in Firestore' });
    }
    const userData = userDoc.data()!;

    let stripeCustomerId = userData.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: userData.email,
        name: userData.companyName || userData.contactPerson,
        metadata: { firebaseUID: uid },
      });
      stripeCustomerId = customer.id;
      await userDoc.ref.update({ stripeCustomerId });
    }

    // ★★★ ご指示通り、環境変数名を STRIPE_JOB_PRICE_ID に修正しました ★★★
    const priceId = process.env.STRIPE_JOB_PRICE_ID;
    if (!priceId) {
        throw new Error('Stripe Price ID for recruit service is not configured.');
    }

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${req.headers.origin}/recruit/dashboard?status=success`,
      cancel_url: `${req.headers.origin}/recruit/subscribe?status=cancel`,
      metadata: { firebaseUID: uid, service: 'recruit' },
    });

    res.status(200).json({ sessionId: session.id });

  } catch (error: any) {
    console.error('Stripe session creation error:', error);
    res.status(500).json({ error: error.message });
  }
}














