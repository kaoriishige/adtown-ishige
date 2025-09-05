// pages/api/create-trial-subscription.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { getAdminAuth, getAdminDb } from '../../lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables.');
}

// apiVersion を削除（自動で最新を使用）
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

    // Firebase Auth ユーザーを取得
    const user = await adminAuth.getUser(uid);
    let stripeCustomerId = user.customClaims?.stripeCustomerId as string | undefined;

    // Stripe カスタマー作成（未登録なら）
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        name,
        email,
        metadata: { firebaseUID: uid },
      });
      stripeCustomerId = customer.id;
      await adminAuth.setCustomUserClaims(uid, { stripeCustomerId });
    }

    // プランIDを環境変数から取得
    const standardPriceId = process.env.STRIPE_STANDARD_PRICE_ID;
    if (!standardPriceId) throw new Error('STRIPE_STANDARD_PRICE_ID is not set');

    // サブスクリプション作成
    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [{ price: standardPriceId }],
      trial_period_days: 7,
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
      collection_method: 'charge_automatically',
    });

    // Firestore に保存
    await adminDb.collection('users').doc(uid).set(
      {
        name,
        furigana,
        email,
        createdAt: Timestamp.now(), // Firestore の Timestamp 型を利用
        stripeCustomerId,
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: 'trialing',
        role: 'user',
      },
      { merge: true }
    );

    // PaymentIntent の取得
    const latestInvoice = subscription.latest_invoice;
    if (!latestInvoice || typeof latestInvoice === 'string') {
      throw new Error('The latest_invoice was not expanded correctly or is missing.');
    }

    const paymentIntent = latestInvoice.payment_intent;
    if (!paymentIntent) {
      throw new Error('Could not find Payment Intent on the invoice.');
    }

    let paymentIntentId: string;
    if (typeof paymentIntent === 'string') {
      paymentIntentId = paymentIntent;
    } else if ('id' in paymentIntent) {
      paymentIntentId = paymentIntent.id;
    } else {
      throw new Error('Payment Intent ID is not in the expected format.');
    }

    const retrievedPaymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (!retrievedPaymentIntent.client_secret) {
      throw new Error('Could not find client_secret in the Payment Intent.');
    }

    // 成功レスポンス
    res.status(200).json({
      subscriptionId: subscription.id,
      clientSecret: retrievedPaymentIntent.client_secret,
    });
  } catch (error: any) {
    console.error('Subscription creation error:', error);
    res.status(500).json({ error: error.message });
  }
}


