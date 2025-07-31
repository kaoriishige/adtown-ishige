import type { NextApiRequest, NextApiResponse } from 'next';
import { buffer } from 'micro';
import Stripe from 'stripe';
import admin from '../../lib/firebase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export const config = {
  api: {
    bodyParser: false, // Stripeの署名検証のために必須
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature']!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf.toString(), sig, webhookSecret);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return res.status(400).send(`Webhook Error: ${errorMessage}`);
  }

  // イベントタイプに応じて処理を分岐
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      const uid = session.client_reference_id!;
      const stripeCustomerId = session.customer as string;
      const subscriptionId = session.subscription as string;
      
      // Firestoreのユーザー情報を更新
      await admin.firestore().collection('users').doc(uid).set({
        stripeCustomerId,
        subscriptionId,
        subscriptionStatus: 'active',
      }, { merge: true });
      break;

    case 'customer.subscription.deleted':
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      // 顧客IDからユーザーを検索してステータスを更新
      const query = admin.firestore().collection('users').where('stripeCustomerId', '==', customerId);
      const userSnapshot = await query.get();
      if (!userSnapshot.empty) {
        const userDoc = userSnapshot.docs[0];
        await userDoc.ref.update({ subscriptionStatus: 'canceled' });
      }
      break;

    default:
      console.warn(`Unhandled event type: ${event.type}`);
  }

  res.status(200).json({ received: true });
}


