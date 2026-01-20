import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import nookies from 'nookies';
import { getAuth } from 'firebase-admin/auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: '2023-10-16' as any });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const cookies = nookies.get({ req });
    let token = cookies.token;

    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: No token' });
    }

    const auth = getAuth();
    let decodedClaims;
    try {
      decodedClaims = await auth.verifySessionCookie(token, true);
    } catch {
      decodedClaims = await auth.verifyIdToken(token, true);
    }

    const user = await auth.getUser(decodedClaims.uid);

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID as string,
          quantity: 1,
        },
      ],
      customer_email: user.email || undefined,
      // 成功時はまずdashboardへ、失敗時はLPへ
      success_url: `${req.headers.origin}/premium/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/premium`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe Checkout Session Error:', err);
    return res.status(500).json({ error: 'Stripe Checkout Session failed' });
  }
}








