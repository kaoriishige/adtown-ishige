/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  env: {
    STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
    STRIPE_AD_PRICE_ID: process.env.STRIPE_AD_PRICE_ID,
    STRIPE_AD_ANNUALCR_PRICE_ID: process.env.STRIPE_AD_ANNUALCR_PRICE_ID,
    STRIPE_AD_ANNUAL_PRICE_ID: process.env.STRIPE_AD_ANNUAL_PRICE_ID,
    STRIPE_AD_ANNUAL_INVOICE_PRICE_ID: process.env.STRIPE_AD_ANNUAL_INVOICE_PRICE_ID,
  }
};

module.exports = nextConfig;

























































