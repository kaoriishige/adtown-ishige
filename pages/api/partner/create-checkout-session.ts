// ファイル1: pages/api/partner/create-checkout-session.ts (修正済みの完全版)

import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '../../../lib/firebase-admin'; // firebase-adminのパスを確認してください
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10', // お使いのStripeライブラリのバージョンに合わせてください
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  // フロントエンドから送られてくる情報を取得
  const { storeName, address, area, contactPerson, phoneNumber, email, password } = req.body;

  // 必須項目の入力チェック
  if (!email || !password || !storeName || !contactPerson || !address || !area) {
    return res.status(400).json({ error: '必須項目が不足しています。' });
  }

  try {
    // 1. Firebase Authenticationで新しいユーザーを作成
    const userRecord = await adminAuth.createUser({
      email: email,
      password: password,
      displayName: contactPerson,
    });
    const uid = userRecord.uid;

    // 2. Firestoreデータベースにパートナー情報を保存
    await adminDb.collection('partners').doc(uid).set({
      storeName: storeName,
      contactPerson: contactPerson,
      address: address,
      area: area,
      phoneNumber: phoneNumber,
      email: email,
      createdAt: new Date(),
      roles: ['partner'], 
    });

    // 3. Stripeで新しい顧客を作成
    const customer = await stripe.customers.create({
      email: email,
      name: storeName,
      metadata: {
        firebaseUid: uid,
      },
    });

    // 4. 作成したStripe顧客IDをFirestoreにも保存
    await adminDb.collection('partners').doc(uid).update({
      stripeCustomerId: customer.id,
    });

    // 5. Stripe決済ページを作成
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription', // 月額課金モード
      customer: customer.id,
      line_items: [
        {
          // Netlifyの環境変数 STRIPE_AD_PRICE_ID を使用します
          price: process.env.STRIPE_AD_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${req.headers.origin}/partner/dashboard?status=success`, // 成功時の戻り先
      cancel_url: `${req.headers.origin}/partner/signup`,      // キャンセル時の戻り先
    });

    if (!session.id) {
      throw new Error('Stripeセッションの作成に失敗しました。');
    }

    // 6. 成功：決済ページのIDをフロントエンドに返す
    res.status(200).json({ sessionId: session.id });

  } catch (error: any) {
    console.error('API (create-checkout-session) エラー:', error);
    if (error.code === 'auth/email-already-exists') {
      return res.status(409).json({ error: 'このメールアドレスは既に使用されています。' });
    }
    res.status(500).json({ error: error.message || 'サーバー内部でエラーが発生しました。' });
  }
}