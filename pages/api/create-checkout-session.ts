import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) {
  throw new Error('The Stripe secret key is not set in environment variables.');
}
const stripe = new Stripe(secretKey);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    try {
      const initialPriceId = process.env.STRIPE_CAMPAIGN_PRICE_ID; // 480円（一括払い）のID
      const recurringPriceId = process.env.STRIPE_STANDARD_PRICE_ID; // 980円（継続）のID

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [
          {
            price: initialPriceId, // ←「一括払い」なので即時課金
            quantity: 1,
          },
          {
            price: recurringPriceId, // ←「継続」なのでサブスクリプション対象
            quantity: 1,
          },
        ],
        // 「継続」価格にのみ7日間のトライアルが適用される
        subscription_data: {
          trial_period_days: 7,
        },
        success_url: `${req.headers.origin}/subscribe-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.origin}/`,
      });

      res.status(200).json({ sessionId: session.id });

    } catch (err) {
      if (err instanceof Stripe.errors.StripeError) {
        res.status(err.statusCode || 500).json({ message: err.message });
      } else {
        res.status(500).json({ message: 'An unexpected error occurred.' });
      }
    }
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
}