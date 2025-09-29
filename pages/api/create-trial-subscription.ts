import { NextApiRequest, NextApiResponse } from 'next';
import stripe from '@/lib/stripe';
// ★ 修正点: adminDb関数をインポートするように変更
import { adminDb } from '@/lib/firebase-admin';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).setHeader('Allow', 'POST').json({ error: 'Method Not Allowed' });
  }

  // ★ 修正点: adminDb関数を呼び出してdbインスタンスを取得
  const db = adminDb();

  const { name, furigana, email, uid, paymentMethodId, referrerId } = req.body;

  if (!name || !email || !uid || !paymentMethodId) {
    return res.status(400).json({ error: '必須パラメータが不足しています。' });
  }

  try {
    let isValidReferrer = false;
    let referrerType: 'user' | 'partner' | null = null;
    
    // 紹介IDの検証ロジック
    if (referrerId) {
      // 1. usersコレクションを検索
      const userRef = db.collection('users').doc(referrerId);
      const userDoc = await userRef.get();
      if (userDoc.exists) {
        isValidReferrer = true;
        referrerType = 'user';
      } else {
        // 2. partnersコレクションを検索 (ご自身のコレクション名に合わせてください)
        const partnerRef = db.collection('partners').doc(referrerId); 
        const partnerDoc = await partnerRef.get();
        if (partnerDoc.exists) {
          isValidReferrer = true;
          referrerType = 'partner';
        }
      }
    }

    // Stripe顧客を作成
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: { uid },
      payment_method: paymentMethodId,
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    // トライアル付きサブスクリプションを作成
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: process.env.STRIPE_PRICE_ID }],
      trial_period_days: 7,
      metadata: { uid },
    });

    // Firestoreにユーザー情報を保存
    const userDocData = {
      name,
      furigana,
      email,
      stripeCustomerId: customer.id,
      subscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
      createdAt: new Date(),
      ...(isValidReferrer && { 
          referrer: {
            id: referrerId,
            type: referrerType
          }
      })
    };
    await db.collection('users').doc(uid).set(userDocData);

    res.status(200).json({ success: true, subscriptionId: subscription.id });

  } catch (error: any) {
    console.error("APIエラー:", error);
    res.status(500).json({ error: error.message || 'サーバーエラーが発生しました。' });
  }
};

export default handler;


