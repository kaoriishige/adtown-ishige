import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2023-10-16' as Stripe.LatestApiVersion, // 型を明示
});



export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: 'price_xxxxxxxx480', // ← あなたの初月¥480のPrice IDに置き換え
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 7,
      },
      success_url: `${req.headers.origin}/success`,
      cancel_url: `${req.headers.origin}/cancel`,
    });

    res.status(200).json({ url: session.url });
  } catch (err: any) {
    console.error('❌ Stripe Checkout error:', err);
    res.status(500).json({ error: '内部エラー' });
  }
}
