// /pages/api/stripe/create-checkout-session.ts
import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

// --- Stripe初期化 ---
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-06-20' as any,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end('Method not allowed');

  try {
    const {
      firebaseUid,
      email,
      companyName,
      contactPerson,
      phoneNumber,
      address,
      serviceType, // "recruit" or "adver"
      billingCycle = 'monthly',
    } = req.body;

    // --- バリデーション ---
    if (!firebaseUid || !email || !serviceType) {
      return res.status(400).json({
        error: 'firebaseUid, email, and serviceType are required.',
      });
    }

    // --- Stripeの価格IDを決定 ---
    const priceId =
      serviceType === 'adver'
        ? process.env.STRIPE_PRICE_ID_ADVER
        : process.env.STRIPE_PRICE_ID_RECRUIT;

    if (!priceId) {
      return res.status(400).json({
        error: `Stripe price ID for ${serviceType} is not set in environment variables.`,
      });
    }

    // --- 顧客検索または新規作成 ---
    let customer;
    const existingCustomers = await stripe.customers.list({ email, limit: 1 });
    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
      console.log(`✅ 既存Stripe顧客を使用: ${email}`);
    } else {
      customer = await stripe.customers.create({
        email,
        name: companyName || contactPerson || email,
        phone: phoneNumber || undefined,
        address: address ? { line1: address } : undefined,
        metadata: {
          firebaseUid,
          serviceType,
          billingCycle,
        },
      });
      console.log(`✅ 新規Stripe顧客作成: ${email}`);
    }

    // --- Checkoutセッション作成 ---
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer: customer.id,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        // ✅ サブスクリプションのメタデータにも情報をコピー（Webhookで確実に取得できる）
        metadata: {
          firebaseUid,
          email,
          companyName: companyName || '',
          contactPerson: contactPerson || '',
          phoneNumber: phoneNumber || '',
          address: address || '',
          serviceType,
          billingCycle,
        },
      },
      metadata: {
        // ✅ セッション側にも残す（デバッグ・トラッキング用）
        firebaseUid,
        serviceType,
        billingCycle,
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/partner/dashboard?stripe=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/partner/dashboard?stripe=cancel`,
    });

    // --- フロントへURL返却 ---
    return res.status(200).json({ url: session.url });
  } catch (error: any) {
    console.error('❌ Stripeセッション作成エラー:', error);
    return res.status(500).json({ error: error.message });
  }
}
