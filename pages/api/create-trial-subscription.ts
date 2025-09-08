import { NextApiRequest, NextApiResponse } from 'next';
import stripe from '@/lib/stripe'; // { }を削除
import { getAdminDb } from '@/lib/firebase-admin'; // 仮の関数名。実際のexportに合わせてください。

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).setHeader('Allow', 'POST').json({ error: 'Method Not Allowed' });
  }
  
  const db = getAdminDb(); // DBインスタンスを取得

  const { name, furigana, email, uid, paymentMethodId, referrerId } = req.body;

  if (!name || !email || !uid || !paymentMethodId) {
    return res.status(400).json({ error: '必須パラメータが不足しています。' });
  }

  try {
    let isValidReferrer = false;
    let referrerType: 'user' | 'partner' | null = null;
    
    if (referrerId) {
      const userRef = db.collection('users').doc(referrerId);
      const userDoc = await userRef.get();
      if (userDoc.exists) {
        isValidReferrer = true;
        referrerType = 'user';
      } else {
        const partnerRef = db.collection('partners').doc(referrerId); 
        const partnerDoc = await partnerRef.get();
        if (partnerDoc.exists) {
          isValidReferrer = true;
          referrerType = 'partner';
        }
      }
    }

    const customer = await stripe.customers.create({
      email,
      name,
      metadata: { uid },
      payment_method: paymentMethodId,
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: process.env.STRIPE_PRICE_ID }],
      trial_period_days: 7,
      metadata: { uid },
    });

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



