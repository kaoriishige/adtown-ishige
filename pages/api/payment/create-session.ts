import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import * as admin from 'firebase-admin';

// Firebase Admin 初期化
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

const db = admin.firestore();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2023-10-16' as any,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { partnerId, plan, amount, successUrl, cancelUrl } = req.body;

    // バリデーション
    if (!partnerId || !plan || !amount || !successUrl || !cancelUrl) {
      return res.status(400).json({
        error: '必須項目が不足しています: partnerId, plan, amount, successUrl, cancelUrl',
      });
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: '不正な金額です' });
    }

    // ステップ1: Firestore からパートナー データを取得（メールアドレス確認）
    const partnerRef = db.collection('users').doc(partnerId);
    const partnerDoc = await partnerRef.get();

    if (!partnerDoc.exists) {
      return res.status(404).json({ error: 'パートナーが見つかりません' });
    }

    const partnerData = partnerDoc.data();
    const email = partnerData?.email;
    const companyName = partnerData?.companyName;

    if (!email) {
      return res.status(400).json({ error: 'パートナーのメールアドレスが見つかりません' });
    }

    // ステップ2: Stripe Checkout Session を作成（一括払い）
    const session = await stripe.checkout.sessions.create({
      mode: 'payment', // 一括払いモード
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'jpy',
            product_data: {
              name: `${plan} - ${companyName || 'AI採用マッチング'}`,
              description: 'AI採用マッチングシステム 月額プラン',
            },
            unit_amount: amount * 100, // Stripe は 1/100 円単位
          },
          quantity: 1,
        },
      ],
      customer_email: email,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        partnerId: partnerId,
        plan: plan,
      },
    });

    // ステップ3: Firestore にセッション情報を保存（追跡用）
    await partnerRef.update({
      stripeSessionId: session.id,
      paymentStatus: 'session_created',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({
      success: true,
      url: session.url,
      sessionId: session.id,
    });
  } catch (error: any) {
    console.error('Payment Session Creation Error:', error);

    // Stripe エラーの詳細ログ
    if (error.type === 'StripeInvalidRequestError') {
      return res.status(400).json({ error: `決済設定エラー: ${error.message}` });
    }

    return res.status(500).json({
      error: '決済セッションの作成に失敗しました: ' + error.message,
    });
  }
}
