import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
// ★★★ 修正点(1): getAdminAuth をインポート ★★★
import { getAdminAuth } from '../../../lib/firebase-admin';

// Stripeの初期化
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // @ts-ignore
  apiVersion: '2024-06-20',
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  const { storeName, contactPerson, email, password } = req.body;
  const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID; 

  if (!priceId) {
    return res.status(500).json({ error: 'Stripeの料金IDが設定されていません。' });
  }

  try {
    // ★★★ 修正点(2): getAdminAuth() を関数として呼び出す ★★★
    const adminAuth = getAdminAuth();

    // 先にFirebase Authenticationにユーザーを仮作成し、UIDを取得する
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: contactPerson,
    });
    const uid = userRecord.uid;

    // Stripeの決済セッションを作成
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${req.headers.origin}/login?signup=success`, // 成功したらログインページへ
      cancel_url: `${req.headers.origin}/partner/signup?status=cancel`,     
      metadata: {
        user_type: 'partner',
        uid: uid,
        storeName: storeName,
        contactPerson: contactPerson,
        email: email,
      },
    });

    res.status(200).json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error('Stripe session creation failed:', error);
    res.status(500).json({ error: '決済セッションの作成に失敗しました。' });
  }
}