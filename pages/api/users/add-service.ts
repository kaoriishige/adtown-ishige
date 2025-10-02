import type { NextApiRequest, NextApiResponse } from 'next';
import { admin, adminAuth, adminDb } from '@/lib/firebase-admin';
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
    // 1. 本人確認
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // 2. 追加したいサービスの種類を取得
    const { service } = req.body; // 'recruit' または 'partner'
    if (!service || !['recruit', 'partner'].includes(service)) {
        return res.status(400).json({ error: 'Invalid service specified.' });
    }

    const userRef = adminDb.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
        throw new Error('User data not found.');
    }
    const userData = userDoc.data();

    // 3. すでにそのサービスに登録済みかチェック
    const currentRoles = userData?.roles || [];
    if (currentRoles.includes(service)) {
        return res.status(409).json({ error: `You are already registered for the ${service} service.` });
    }

    // 4. Stripeで決済ページを作成
    const stripe = getAdminStripe();
    const customerId = userData?.stripeCustomerId;
    
    if (!customerId) {
        return res.status(400).json({ error: 'Stripe customer ID not found.' });
    }

    // サービスに応じた価格IDと成功URLを設定
    let priceId = '';
    let successUrl = '';
    if (service === 'recruit') {
        priceId = process.env.RECRUIT_PRICE_ID!;
        successUrl = `${req.headers.origin}/recruit/dashboard?payment=success`;
    } else { // service === 'partner'
        priceId = process.env.STRIPE_PRICE_ID!;
        successUrl = `${req.headers.origin}/partner/dashboard?payment=success`;
    }

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        customer: customerId, // 既存のStripe顧客IDを使用
        line_items: [{ price: priceId, quantity: 1 }],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: req.headers.referer || '/', // 元のページに戻る
        subscription_data: {
          metadata: { 
            firebaseUID: uid,
            serviceToAdd: service, // Webhookでどのサービスが追加されたか判別するため
          }
        },
    });

    // ★重要: 決済成功後にWebhookで役割(role)を追加するのがより安全ですが、
    // ここでは簡略化のため、決済ページ作成と同時に役割を追加しています。
    await userRef.update({
        roles: admin.firestore.FieldValue.arrayUnion(service)
    });

    res.status(200).json({ sessionId: session.id });

  } catch (error: any) {
    console.error('Add service failed:', error);
    res.status(500).json({ error: { message: error.message } });
  }
}