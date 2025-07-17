import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2023-10-16' as Stripe.LatestApiVersion, // ✅ 型に適合していればこれでもOK
});

export default stripe;
