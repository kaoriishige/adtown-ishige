// lib/stripe-admin.ts
import Stripe from 'stripe';

let stripe: Stripe;

const getAdminStripe = () => {
  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
      apiVersion: '2024-04-10',
      typescript: true,
    });
  }
  return stripe;
};

export default getAdminStripe;

