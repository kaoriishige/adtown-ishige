import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

// Stripe SDKを初期化
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    // @ts-ignore
    apiVersion: '2024-06-20',
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const { uid, referrerUid } = req.body;
    if (!uid) {
      return res.status(400).json({ error: 'User ID is missing' });
    }

    // コードに直接IDを書き込む
    const priceId = "price_1RjUSHJlUiZ4txnKk6ftUqUS";

    // Stripeの決済セッションを作成
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      subscription_data: { trial_period_days: 7 },
      metadata: { uid: uid, referrerUid: referrerUid },
      success_url: `${req.headers.origin}/login?signup=success`,
      cancel_url: `${req.headers.origin}/signup?canceled=true`,
    });

    res.status(200).json({ sessionId: session.id });

  } catch (err: any) {
    console.error('Stripe session creation failed:', err);
    res.status(err.statusCode || 500).json({ error: err.message });
  }
}