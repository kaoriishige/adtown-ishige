import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-06-20' as any,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end('Method not allowed');

  try {
    const { firebaseUid, email, serviceType } = req.body;

    if (!firebaseUid || !email || !serviceType) {
      return res.status(400).json({ error: '必須情報が不足しています' });
    }

    let priceId = '';
    let successUrlPath = '/partner/dashboard?stripe=success'; // デフォルト（ビジネス用）

    // サービスタイプに応じたPrice IDとリダイレクト先の設定
    if (serviceType === 'paid_480') {
      priceId = process.env.STRIPE_PRICE_ID!;
      // 【重要】決済完了後は専用ダッシュボードへ直行。これで無料ホーム送りを防ぐ
      successUrlPath = '/premium/dashboard?stripe=success';
    } else if (serviceType === 'adver') {
      priceId = process.env.STRIPE_AD_PRICE_ID!;
    } else if (serviceType === 'job') {
      priceId = process.env.STRIPE_JOB_PRICE_ID!;
    }

    if (!priceId) {
      return res.status(400).json({ error: `Price IDが設定されていません: ${serviceType}` });
    }

    // 既存のStripe顧客を探すか、新規作成（メールアドレスで紐付け）
    let customer;
    const existingCustomers = await stripe.customers.list({ email, limit: 1 });
    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      customer = await stripe.customers.create({
        email,
        metadata: { firebaseUid, serviceType },
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer: customer.id,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { firebaseUid, serviceType },
      // 決済成功時の戻り先を、ログイン維持したままの専用URLに固定
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || req.headers.origin}${successUrlPath}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || req.headers.origin}/premium`,
    });

    return res.status(200).json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe Error:', error);
    return res.status(500).json({ error: error.message });
  }
}