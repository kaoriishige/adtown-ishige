// pages/api/partner/signup.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, getAdminDb } from '@/lib/firebase-admin';
import getAdminStripe from '@/lib/stripe-admin';

// メールの基本チェック用
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// 対象エリア
const allowedAreas = ['那須塩原市', '大田原市', '那須町'];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  const {
    storeName,
    address,
    area,
    contactPerson,
    phoneNumber,
    qrStandCount,
    email,
    password,
    category,
  } = req.body ?? {};

  // --- 入力バリデーション ---
  if (!storeName || !address || !contactPerson || !phoneNumber || !email || !password || !category) {
    return res.status(400).json({ error: '必須項目が不足しています。' });
  }
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'メールアドレスの形式が正しくありません。' });
  }
  if (typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'パスワードは6文字以上にしてください。' });
  }
  if (!allowedAreas.some(a => area?.includes(a))) {
    return res.status(400).json({ error: '対象エリアは 那須塩原市 / 大田原市 / 那須町 に限定されています。' });
  }
  if (!category.main || !category.sub) {
    return res.status(400).json({ error: '業種カテゴリ（main, sub）は必須です。' });
  }

  const db = getAdminDb();
  const auth = adminAuth();
  const stripe = getAdminStripe();

  try {
    // --- 1. Firebase Authentication ユーザー作成 ---
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: storeName,
    });

    // --- 2. Firestore に店舗情報を保存 ---
    const userData = {
      uid: userRecord.uid,
      email,
      storeName,
      address,
      area,
      contactPerson,
      phoneNumber,
      qrStandCount: Number(qrStandCount) || 0,
      category,
      role: 'partner',
      status: 'pending', // 支払い待ち
      createdAt: new Date().toISOString(),
    };
    await db.collection('users').doc(userRecord.uid).set(userData);

    // --- 3. Stripe 顧客作成 ---
    const customer = await stripe.customers.create({
      email,
      name: storeName,
      metadata: {
        firebaseUID: userRecord.uid,
      },
    });

    // --- 4. Stripe Checkout セッション作成 ---
    const priceId = process.env.STRIPE_PARTNER_PRICE_ID;
    if (!priceId) {
      throw new Error('環境変数 STRIPE_PARTNER_PRICE_ID が設定されていません。');
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer: customer.id,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${req.headers.origin}/partner/dashboard?payment_success=true`,
      cancel_url: `${req.headers.origin}/partner/signup?canceled=true`,
      metadata: {
        firebaseUID: userRecord.uid,
      },
    });

    // --- 5. 成功レスポンス ---
    return res.status(200).json({ sessionId: session.id });

  } catch (error: any) {
    console.error('[API ERROR] Partner Signup Failed:', error);

    // Firebase の典型的なエラー処理
    if (error.code === 'auth/email-already-exists') {
      return res.status(400).json({ error: 'このメールアドレスは既に登録されています。' });
    }

    // Stripe の典型的なエラー処理
    if (error.type === 'StripeCardError') {
      return res.status(400).json({ error: 'カード決済に失敗しました。' });
    }

    return res.status(500).json({ error: error.message || 'サーバーエラーが発生しました。' });
  }
}
