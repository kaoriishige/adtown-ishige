// lib/stripe-config.ts

export const stripeConfig = {
  secretKey: process.env.STRIPE_SECRET_KEY!,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
  priceId: process.env.STRIPE_PRICE_ID!,
  partnerPriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID!,
};