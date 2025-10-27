import { NextApiRequest, NextApiResponse } from 'next';
import getStripeAdmin from '@/lib/stripe-admin';

// ✅ デプロイ環境に応じたBASE_URL検出ロジック
const BASE_URL =
process.env.NEXT_PUBLIC_BASE_URL || // 手動設定があれば優先
process.env.URL || // ✅ Netlify本番で自動注入される
process.env.DEPLOY_URL || // Netlifyプレビュー用
(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
'http://localhost:3000'; // 最後のフォールバック

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

// --- 必須チェック ---
const missingFields = ['email', 'serviceType', 'billingCycle'].filter(
f => !req.body?.[f]
);
if (missingFields.length > 0) {
return res.status(400).json({ error: `Missing fields: ${missingFields.join(', ')}` });
}

const stripe = getStripeAdmin();

try {
// ✅ Stripeに一時顧客を作成（Firebase登録はまだしない）
const customer = await stripe.customers.create({
email,
name: companyName || contactPerson || email,
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

// 🚨 修正箇所: serviceTypeに基づいてキャンセルURLを動的に決定
let cancel_url: string;
if (serviceType === 'adver') {
cancel_url = `${BASE_URL}/partner/signup`; // 広告パートナーの申込ページ
} else if (serviceType === 'recruit') {
cancel_url = `${BASE_URL}/recruit`; // 求人パートナーの申込ページ
} else {
cancel_url = `${BASE_URL}/`; // 不明な場合はトップページ
}

// ✅ Checkoutセッション作成
const session = await stripe.checkout.sessions.create({
mode: 'subscription',
payment_method_types: ['card'],
customer: customer.id,
line_items: [{ price: priceId, quantity: 1 }],
// 決済成功時 → ログインページ
success_url: `${BASE_URL}/partner/login?payment=success`,
// 戻る（キャンセル）時 → 修正したURLを使用
cancel_url: cancel_url,
subscription_data: {
metadata: customer.metadata,
},
locale: 'ja', // StripeのUIを日本語化
});

return res.status(200).json({ sessionId: session.id });
} catch (err: any) {
console.error('[register-and-subscribe ERROR]', err);
return res.status(500).json({
error: err.message || 'Stripe checkout session creation failed.',
hint: 'BASE_URL might be misconfigured on Netlify.',
});
}
}










