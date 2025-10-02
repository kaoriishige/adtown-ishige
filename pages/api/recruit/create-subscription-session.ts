import type { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import getAdminStripe from '@/lib/stripe-admin';
import Stripe from 'stripe';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const {
      email,
      companyName,
      address,
      contactPerson,
      phoneNumber,
      trialEndDate,
    } = req.body;
    
    // 保存するすべての情報をまとめる
    const recruiterData = {
        uid,
        email,
        displayName: companyName, // usersコレクション用にdisplayNameも追加
        companyName,
        address,
        contactPerson,
        phoneNumber,
        roles: ['recruit'],
        createdAt: new Date().toISOString(),
    };

    // 'users' コレクションにすべての情報を保存
    await adminDb.collection('users').doc(uid).set(recruiterData, { merge: true });

    // 'recruiters' コレクションにも詳細情報を保存
    await adminDb.collection('recruiters').doc(uid).set(recruiterData, { merge: true });

    // Stripeの顧客を作成
    const stripe = getAdminStripe();
    const customer = await stripe.customers.create({
      email,
      name: companyName,
      metadata: { firebaseUID: uid },
    });

    // 作成したStripeの顧客IDをusersドキュメントに保存
    await adminDb.collection('users').doc(uid).update({
        stripeCustomerId: customer.id
    });

    const trialEndTimestamp = Math.floor(new Date(trialEndDate).getTime() / 1000);

    const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        // ★★★ 修正点: 正しい環境変数名に変更 ★★★
        items: [{ price: process.env.STRIPE_JOB_PRICE_ID }],
        trial_end: trialEndTimestamp,
        metadata: { firebaseUID: uid },
    });

    await adminDb.collection('users').doc(uid).update({
        subscriptionId: subscription.id,
        subscriptionStatus: 'trialing',
    });

    // 決済方法登録のためのセットアップセッションを作成
    const setupSession = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'setup',
        customer: customer.id,
        setup_intent_data: {
            metadata: {
                subscription_id: subscription.id,
                firebaseUID: uid,
            },
        },
        success_url: `${req.headers.origin}/recruit/dashboard?payment=success`,
        cancel_url: `${req.headers.origin}/recruit`,
    });

    res.status(200).json({ sessionId: setupSession.id });

  } catch (error: any) {
    console.error('Subscription session creation failed:', error);
    res.status(500).json({ error: { message: error.message } });
  }
}














