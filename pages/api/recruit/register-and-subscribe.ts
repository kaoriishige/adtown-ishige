// pages/api/recruit/register-and-subscribe.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // ★★★ ここのバージョンを修正しました ★★★
  apiVersion: '2023-08-16',
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  const { companyName, address, contactPerson, phoneNumber, email, password } = req.body;

  if (!email || !password || !companyName || !contactPerson) {
    return res.status(400).json({ error: '必須項目が不足しています。' });
  }

  try {
    const userRecord = await adminAuth.createUser({
      email: email,
      password: password,
      displayName: contactPerson,
    });
    const uid = userRecord.uid;

    await adminDb.collection('partners').doc(uid).set({
      storeName: companyName,
      contactPerson: contactPerson,
      address: address,
      phoneNumber: phoneNumber,
      email: email,
      createdAt: new Date(),
    });

    const customer = await stripe.customers.create({
      email: email,
      name: companyName,
      metadata: {
        firebaseUid: uid,
      },
    });

    await adminDb.collection('partners').doc(uid).update({
      stripeCustomerId: customer.id,
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer: customer.id,
      line_items: [
        {
          price: process.env.STRIPE_JOB_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${req.headers.origin}/recruit/success`,
      cancel_url: `${req.headers.origin}/recruit`,
    });

    if (!session.id) {
      throw new Error('Stripeセッションの作成に失敗しました。');
    }

    res.status(200).json({ sessionId: session.id });

  } catch (error: any) {
    console.error('API (register-and-subscribe) エラー:', error);
    if (error.code === 'auth/email-already-exists') {
      return res.status(409).json({ error: 'このメールアドレスは既に使用されています。' });
    }
    res.status(500).json({ error: error.message || 'サーバー内部でエラーが発生しました。' });
  }
}