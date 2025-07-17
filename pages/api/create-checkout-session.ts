import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      // ★★★ 修正箇所 ★★★
      // リクエストボディからuidを受け取る
      const { uid } = req.body;

      if (!uid) {
        return res.status(400).json({ error: 'User ID is missing' });
      }

      const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            price: process.env.STRIPE_PRICE_ID, // 環境変数から価格IDを読み込む
            quantity: 1,
          },
        ],
        mode: 'subscription',
        subscription_data: {
          trial_period_days: 7,
        },
        // ★★★ 修正箇所 ★★★
        // StripeにFirebaseのUIDを渡す
        client_reference_id: uid,
        success_url: `${req.headers.origin}/mypage?new-registration=true`,
        cancel_url: `${req.headers.origin}/?canceled=true`,
      });
      res.status(200).json({ sessionId: session.id });
    } catch (err: any) {
      console.error('Stripe session creation failed:', err);
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
}
