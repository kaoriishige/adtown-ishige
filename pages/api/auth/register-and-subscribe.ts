import { NextApiRequest, NextApiResponse } from 'next';
import getStripeAdmin from '@/lib/stripe-admin';

const NEXT_PUBLIC_BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ||
  `https://${process.env.VERCEL_URL}` ||
  'http://localhost:3000';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const {
    email,
    companyName,
    contactPerson,
    phoneNumber,
    address,
    serviceType,
    billingCycle,
  } = req.body ?? {};

  const stripe = getStripeAdmin();

  try {
    // ✅ Stripe上に仮顧客を作成（Firebaseには登録しない）
    const customer = await stripe.customers.create({
      email,
      name: companyName || contactPerson,
      metadata: {
        email,
        companyName: companyName || '',
        contactPerson: contactPerson || '',
        phoneNumber: phoneNumber || '',
        address: address || '',
        serviceType,
        billingCycle,
      },
    });

    // ✅ Price ID 判定
    const priceKey = `${serviceType}_${billingCycle}`;
    const priceMap: Record<string, string | undefined> = {
      adver_monthly: process.env.STRIPE_AD_PRICE_ID,
      adver_annual: process.env.STRIPE_AD_ANNUAL_PRICE_ID,
      recruit_monthly: process.env.STRIPE_JOB_PRICE_ID,
      recruit_annual: process.env.STRIPE_JOB_ANNUAL_PRICE_ID,
    };
    const priceId = priceMap[priceKey];
    if (!priceId) throw new Error(`Price ID not found: ${priceKey}`);

    // ✅ Checkoutセッション作成（まだ登録はしない）
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer: customer.id,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${NEXT_PUBLIC_BASE_URL}/partner/login?payment=success`,
      cancel_url: `${NEXT_PUBLIC_BASE_URL}/recruit`,
      subscription_data: {
        metadata: customer.metadata,
      },
    });

    return res.status(200).json({ sessionId: session.id });
  } catch (err: any) {
    console.error('[register-and-subscribe ERROR]', err);
    return res.status(500).json({ error: err.message });
  }
}









