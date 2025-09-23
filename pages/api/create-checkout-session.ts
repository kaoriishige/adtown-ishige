import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { getAdminAuth } from '../../lib/firebase-admin';
import nookies from 'nookies'; // nookies をインポート

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) {
  throw new Error('The Stripe secret key is not set in environment variables.');
}
const stripe = new Stripe(secretKey);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    // ▼▼▼ ここからが修正箇所です ▼▼▼
    // ヘッダーではなく、Cookieからセッション情報を取得・検証します
    const cookies = nookies.get({ req });
    if (!cookies.token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const decodedToken = await getAdminAuth().verifySessionCookie(cookies.token, true);
    const { uid, email } = decodedToken;
    // ▲▲▲ ここまでが修正箇所です ▲▲▲

    const priceId = process.env.STRIPE_480_PRICE_ID;
    if (!priceId) {
        throw new Error('Stripe Price ID for 480 JPY plan is not set.');
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        metadata: {
            firebaseUID: uid,
        }
      },
      success_url: `${req.headers.origin}/subscribe-success`,
      cancel_url: `${req.headers.origin}/subscribe`,
    });

    res.status(200).json({ sessionId: session.id });

  } catch (err) {
    console.error('Stripe Checkout Session Error:', err);
    if (err instanceof Stripe.errors.StripeError) {
      res.status(err.statusCode || 500).json({ message: err.message });
    } else if (err instanceof Error) {
        res.status(500).json({ message: err.message });
    } else {
      res.status(500).json({ message: 'An unexpected error occurred.' });
    }
  }
}