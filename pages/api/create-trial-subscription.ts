import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { getAdminAuth, getAdminDb } from '../../lib/firebase-admin';

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables.');
}
const stripe = new Stripe(secretKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const { name, furigana, email, uid } = req.body;
    if (!name || !furigana || !email || !uid) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const adminDb = getAdminDb();
    const adminAuth = getAdminAuth();
    
    const user = await adminAuth.getUser(uid);
    let stripeCustomerId = user.customClaims?.stripeCustomerId as string | undefined;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        name: name,
        email: email,
        metadata: { firebaseUID: uid },
      });
      stripeCustomerId = customer.id;
      await adminAuth.setCustomUserClaims(uid, { stripeCustomerId });
    }
    
    const standardPriceId = process.env.STRIPE_STANDARD_PRICE_ID;
    if (!standardPriceId) throw new Error('STRIPE_STANDARD_PRICE_ID is not set');

    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [{ price: standardPriceId }],
      trial_period_days: 7,
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
      collection_method: 'charge_automatically', 
    });

    await adminDb.collection('users').doc(uid).set({
        name,
        furigana,
        email,
        createdAt: new Date().toISOString(),
        stripeCustomerId: stripeCustomerId,
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: 'trialing',
        role: 'user',
    }, { merge: true });

    // ▼▼▼ ここからが修正箇所です ▼▼▼
    const latestInvoice = subscription.latest_invoice;

    // latest_invoiceが取得できたか、またそれがオブジェクトであるかを確認
    if (!latestInvoice || typeof latestInvoice === 'string') {
      throw new Error('The latest_invoice was not expanded correctly or is missing.');
    }

    const paymentIntent = latestInvoice.payment_intent;

    // payment_intentが取得できたかを確認
    if (!paymentIntent) {
      throw new Error('Could not find Payment Intent on the invoice.');
    }
    
    // payment_intentからIDを取得（文字列でもオブジェクトでも対応）
    const paymentIntentId = typeof paymentIntent === 'string' ? paymentIntent : paymentIntent.id;

    const retrievedPaymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    res.status(200).json({
      subscriptionId: subscription.id,
      clientSecret: retrievedPaymentIntent.client_secret,
    });
    // ▲▲▲ ここまでが修正箇所です ▲▲▲

  } catch (error: any) {
    console.error('Subscription creation error:', error);
    res.status(500).json({ error: error.message });
  }
}