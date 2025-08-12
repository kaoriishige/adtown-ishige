/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // ★★★ ここからが追加するコード ★★★
  env: {
    STRIPE_PRICE_ID: process.env.STRIPE_PRICE_ID,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
  },
  // ★★★ ここまで ★★★
};

module.exports = nextConfig;




















































