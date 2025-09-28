import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
    return;
  }

  try {
    const { email, companyName, trialEndDate } = req.body;

    // 環境変数が設定されているか確認し、なければエラーを投げる
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (!baseUrl) {
      throw new Error('環境変数 .env.local に NEXT_PUBLIC_BASE_URL が設定されていません。');
    }

    let customer;
    const existingCustomers = await stripe.customers.list({ email: email, limit: 1 });
    
    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: email,
        name: companyName,
      });
    }

    const trialEndTimestamp = Math.floor(new Date(trialEndDate).getTime() / 1000);

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: process.env.STRIPE_JOB_PRICE_ID, 
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_end: trialEndTimestamp,
      },
      success_url: `${baseUrl}/recruit/dashboard?payment_success=true`,
      cancel_url: `${baseUrl}/recruit`,
    });

    res.status(200).json({ sessionId: session.id });

  } catch (err: any) {
    console.error('Stripe API Error:', err.message);
    // エラーメッセージをクライアントに正しく返す
    res.status(500).json({ error: { message: err.message } });
  }
}