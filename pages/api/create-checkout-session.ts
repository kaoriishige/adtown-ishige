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
    const { uid } = req.body;
    if (!uid) {
      return res.status(400).json({ error: 'User ID is missing' });
    }

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      subscription_data: {
        trial_period_days: 7,
      },
      metadata: {
        uid: uid,
      },
      // ▼▼▼ ここを修正しました ▼▼▼
      // 決済完了後に、セッションID付きで新しい「ようこそ」ページへ移動させる
      success_url: `${req.headers.origin}/welcome?session_id={CHECKOUT_SESSION_ID}`,
      // ▲▲▲ ここまで ▲▲▲
      cancel_url: `${req.headers.origin}/signup?canceled=true`,
    });

    res.status(200).json({ sessionId: session.id });

  } catch (err: any) {
    console.error('Stripe session creation failed:', err);
    res.status(err.statusCode || 500).json({ error: err.message });
  }
}
