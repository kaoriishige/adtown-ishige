// Next.js Modules
import { NextApiRequest, NextApiResponse } from 'next';
// Firebase Admin SDK
import { adminDb, adminAuth } from '@/lib/firebase-admin';
// Stripe SDK
import getStripeAdmin from '@/lib/stripe-admin';
import Stripe from 'stripe';
import * as admin from 'firebase-admin';

// StripeのWebhook Secret（環境変数から取得）
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
const stripe = getStripeAdmin();

// Stripeの仕様上、リクエストボディをRaw形式で扱う必要あり
export const config = {
  api: {
    bodyParser: false,
  },
};

// --- リクエストBodyをBufferとして取得 ---
async function buffer(readable: NextApiRequest & { buffer?: Buffer }): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  readable.buffer = Buffer.concat(chunks);
  return readable.buffer;
}

// --- メイン Webhook ハンドラー ---
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  // 🔹 Stripeから送られた生のイベントを受け取る
  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];
  let event: Stripe.Event;

  // 🔸 Webhookの署名検証
  try {
    event = stripe.webhooks.constructEvent(buf.toString(), sig!, webhookSecret);
  } catch (err: any) {
    console.error('🔴 Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // 🔸 イベント処理
  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      const customerId = session.customer as string;
      const customer = (await stripe.customers.retrieve(customerId)) as Stripe.Customer;

      const meta = customer.metadata;
      const {
        email,
        companyName,
        contactPerson,
        phoneNumber,
        address,
        serviceType,
        billingCycle,
      } = meta;

      // ✅ Firebase Authに登録（まだ存在しない場合のみ）
      let user;
      try {
        user = await adminAuth.getUserByEmail(email);
      } catch {
        user = await adminAuth.createUser({
          email,
          password: Math.random().toString(36).slice(-8),
          displayName: contactPerson || companyName || email,
        });
      }

     // ✅ Firestoreに企業情報を登録
await adminDb.collection('users').doc(user.uid).set(
  {
    uid: user.uid,
    email,
    companyName,
    contactPerson,
    phoneNumber,
    address,
    stripeCustomerId: customerId,
    stripeSubscriptionId: session.subscription,
    subscriptionStatus: ["adver", "recruit"],
    serviceType,
    billingCycle,
    roles: [serviceType], // ← ★ここを追加！（配列で登録）
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  },
  { merge: true }
);


      console.log(`✅ Firestore 登録完了: ${email}`);
    }

    // ✅ 毎月課金成功イベントでもステータスを更新
    else if (event.type === 'invoice.paid') {
      const data = event.data.object as Stripe.Invoice;
      const customerId = data.customer as string;
      const customer = (await stripe.customers.retrieve(customerId)) as Stripe.Customer;
      const firebaseEmail = customer.email;

      if (!firebaseEmail) return res.status(200).json({ received: true });

      const userRecord = await adminAuth.getUserByEmail(firebaseEmail).catch(() => null);
      if (userRecord) {
        await adminDb.collection('users').doc(userRecord.uid).set(
          {
            subscriptionStatus: 'active',
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
        console.log(`💰 Monthly invoice paid for: ${firebaseEmail}`);
      }
    }

    // ❌ 解約処理
    else if (event.type === 'customer.subscription.deleted') {
      const data = event.data.object as Stripe.Subscription;
      const customerId = data.customer as string;
      const customer = (await stripe.customers.retrieve(customerId)) as Stripe.Customer;
      const firebaseEmail = customer.email;

      if (!firebaseEmail) return res.status(200).json({ received: true });

      const userRecord = await adminAuth.getUserByEmail(firebaseEmail).catch(() => null);
      if (userRecord) {
        await adminDb.collection('users').doc(userRecord.uid).set(
          {
            subscriptionStatus: 'canceled',
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
        console.log(`🟥 Subscription canceled: ${firebaseEmail}`);
      }
    }

    // 未処理イベント
    else {
      console.log(`ℹ Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook processing error:', err);
    res.status(500).json({ error: 'Webhook failed' });
  }
}



















