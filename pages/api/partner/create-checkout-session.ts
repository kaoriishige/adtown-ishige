import type { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import getAdminStripe from '@/lib/stripe-admin';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    // サーバー側で受け取ったデータをターミナルに表示して確認します
    console.log('Received data on server:', req.body);

    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const {
      email,
      storeName,
      address,
      area,
      contactPerson,
      phoneNumber,
      qrStandCount,
      category
    } = req.body;

    // 保存するすべての情報をまとめる
    const partnerData = {
      uid,
      email,
      displayName: storeName, // usersコレクション用の表示名
      roles: ['partner'],
      storeName,
      address,
      area,
      contactPerson,
      phoneNumber,
      qrStandCount,
      category,
      createdAt: new Date().toISOString(),
    };

    // 'users' コレクションにすべての情報を保存
    await adminDb.collection('users').doc(uid).set(partnerData, { merge: true });
    
    // 'partners' コレクションにもすべての情報を保存
    await adminDb.collection('partners').doc(uid).set(partnerData, { merge: true });

    // Stripeの顧客を作成
    const stripe = getAdminStripe();
    const customer = await stripe.customers.create({
      email,
      name: storeName,
      metadata: { firebaseUID: uid },
    });
    
    // 作成したStripeの顧客IDをusersドキュメントに保存
    await adminDb.collection('users').doc(uid).update({
        stripeCustomerId: customer.id
    });

    // Stripe Checkoutセッションを作成
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer: customer.id,
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.origin}/partner/dashboard?payment=success`,
      cancel_url: `${req.headers.origin}/partner/signup`,
      subscription_data: {
        metadata: { firebaseUID: uid },
      },
    });

    res.status(200).json({ sessionId: session.id });

  } catch (error: any) {
    console.error('Checkout session creation failed:', error);
    res.status(500).json({ error: { message: error.message } });
  }
}