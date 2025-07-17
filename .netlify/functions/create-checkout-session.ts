/// <reference types="stripe" />
import { Handler } from '@netlify/functions';
import Stripe from 'stripe';

// ✅ StripeConfigの型を明示（赤波線防止）
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as Stripe.LatestApiVersion,
});

export default stripe;
// ← これでstrict: trueでも型エラーなし

const handler: Handler = async (event, context) => {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID!,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cancel`,
      subscription_data: {
        trial_period_days: 7,
      },
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Unknown error' }),
    };
  }
};

export { handler };



