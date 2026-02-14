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

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

    if (!sig || !webhookSecret) {
      return res.status(400).json({ error: 'Missing Stripe signature or webhook secret' });
    }

    // リクエストボディをバッファから文字列に変換（Node.js ビルトイン stream）
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const body = Buffer.concat(chunks).toString('utf8');

    // Webhook 署名を検証
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).json({ error: 'Webhook signature verification failed' });
    }

    // チェックアウトセッション完了イベント処理
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const partnerId = session.metadata?.partnerId as string;
      const plan = session.metadata?.plan as string;

      if (!partnerId) {
        console.error('No partnerId in session metadata');
        return res.status(400).json({ error: 'No partnerId in session metadata' });
      }

      // Firestore でパートナー情報を更新
      const partnerRef = db.collection('users').doc(partnerId);

      await partnerRef.update({
        paymentStatus: 'completed',
        stripeSessionId: session.id,
        stripeCustomerId: session.customer as string,
        plan: plan || 'recruit-6600',
        planStartDate: admin.firestore.FieldValue.serverTimestamp(),
        planEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30日後
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`Payment completed for partner: ${partnerId}, session: ${session.id}`);
    }

    // payment_intent.succeeded の場合(念のため)
    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object as Stripe.PaymentIntent;
      console.log(`Payment intent succeeded: ${intent.id}`);
    }

    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('Webhook Handler Error:', error);
    return res.status(500).json({ error: 'Webhook processing failed: ' + error.message });
  }
}
