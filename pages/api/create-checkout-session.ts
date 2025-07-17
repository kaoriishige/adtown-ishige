import { NextApiRequest, NextApiResponse } from 'next';

// Stripeライブラリを初期化
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      // ▼▼ フロントエンドから渡されたuidを取得 ▼▼
      const { uid } = req.body;

      // uidがない場合はエラーを返す
      if (!uid) {
        return res.status(400).json({ error: 'User ID is missing' });
      }
      // ▲▲ ここまで追加 ▲▲

      const session = await stripe.checkout.sessions.create({
        // ▼▼ 誰の決済かをStripeに伝えるために、client_reference_idを追加 ▼▼
        client_reference_id: uid,
        // ▲▲ ここまで追加 ▲▲
        
        line_items: [
          {
            price: 'price_1P5T2kDEQaro21m0j4kK9dBU', // あなたのStripeの商品価格IDに置き換えてください
            quantity: 1,
          },
        ],
        mode: 'subscription',
        subscription_data: {
          trial_period_days: 7,
        },
        success_url: `${req.headers.origin}/mypage?new-registration=true`,
        cancel_url: `${req.headers.origin}/?canceled=true`,
      });
      res.status(200).json({ sessionId: session.id });
    } catch (err: any) {
      console.error('Stripe session creation failed:', err);
      res.status(err.statusCode || 500).json(err.message);
    }
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
}
