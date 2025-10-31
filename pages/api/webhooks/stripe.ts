import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import getStripeAdmin from '@/lib/stripe-admin';
import Stripe from 'stripe';
import * as admin from 'firebase-admin';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
const stripe = getStripeAdmin();

// Stripe Webhook用: Raw Bodyを扱う設定
export const config = { api: { bodyParser: false } };

// --- リクエストBodyをBufferで取得 ---
async function buffer(readable: NextApiRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

// --- 共通 Firestore + Auth 更新ロジック ---
async function handleSubscriptionUpdate(
  uid: string,
  subscriptionId: string | null,
  customerId: string | null,
  status: 'active' | 'canceled' | 'pending_invoice',
  serviceType: string
) {
  if (!uid || !serviceType) return;

  const userDocRef = adminDb.collection('users').doc(uid);
  const serviceRole = serviceType === 'adver' ? 'adver' : 'recruit';
  const isActive = status === 'active';

  // --- Firestore 更新 ---
  await userDocRef.set(
    {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      isPaid: isActive,
      [`${serviceType}SubscriptionStatus`]: status,
      roles: admin.firestore.FieldValue.arrayUnion(serviceRole),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  // --- Auth カスタムクレーム更新 ---
  const user = await adminAuth.getUser(uid);
  const currentClaims = user.customClaims || {};
  let roles = Array.isArray(currentClaims.roles) ? [...currentClaims.roles] : [];

  if (isActive) {
    if (!roles.includes(serviceRole)) roles.push(serviceRole);
  } else if (status === 'canceled') {
    roles = roles.filter((r) => r !== serviceRole);
    await adminAuth.revokeRefreshTokens(uid);
  }

  await adminAuth.setCustomUserClaims(uid, {
    ...currentClaims,
    roles,
    isPaid: isActive,
    [`${serviceType}Status`]: status,
  });

  console.log(`✅ Firestore & Auth 更新完了: ${uid}, 状態=${status}`);
}

// --- メイン Webhook ハンドラー ---
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  let event: Stripe.Event;
  try {
    const buf = await buffer(req);
    const sig = req.headers['stripe-signature'];
    if (!webhookSecret) throw new Error('STRIPE_WEBHOOK_SECRET not configured');

    event = stripe.webhooks.constructEvent(buf.toString(), sig!, webhookSecret);
  } catch (err: any) {
    console.error('❌ Webhook 検証エラー:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    const data = event.data.object as any;
    let firebaseUid =
      data.metadata?.firebaseUid ||
      data.subscription_metadata?.firebaseUid ||
      data.customer_metadata?.firebaseUid;

    let serviceType =
      data.metadata?.serviceType ||
      data.subscription_metadata?.serviceType ||
      'adver';

    const subscriptionId: string | null = data.subscription || null;
    let customerId: string | null = data.customer || null;

    // metadata がない場合、Subscription から再取得
    if (subscriptionId && !firebaseUid) {
      const sub = await stripe.subscriptions.retrieve(subscriptionId);
      firebaseUid = sub.metadata.firebaseUid || firebaseUid;
      serviceType = sub.metadata.serviceType || serviceType;
      customerId = sub.customer as string;
    }

    // customerId から UID を特定（metadataが欠けているケースに対応）
    if (!firebaseUid && customerId) {
      const userQuery = await adminDb
        .collection('users')
        .where('stripeCustomerId', '==', customerId)
        .limit(1)
        .get();
      if (!userQuery.empty) {
        firebaseUid = userQuery.docs[0].id;
      }
    }

    if (!firebaseUid) {
      console.warn('⚠ firebaseUid 特定不可。イベント:', event.type);
      return res.status(200).json({ received: true });
    }

    // --- イベントごとの処理 ---
    switch (event.type) {
      case 'checkout.session.completed':
      case 'invoice.payment_succeeded':
      case 'payment_intent.succeeded':
      case 'customer.subscription.updated': {
        await handleSubscriptionUpdate(firebaseUid, subscriptionId, customerId, 'active', serviceType);
        console.log(`💰 決済成功イベント: ${event.type} → UID=${firebaseUid}`);
        break;
      }
      case 'invoice.paid': {
        await handleSubscriptionUpdate(firebaseUid, subscriptionId, customerId, 'active', serviceType);
        console.log(`🧾 請求書支払い完了: UID=${firebaseUid}`);
        break;
      }
      case 'customer.subscription.deleted': {
        await handleSubscriptionUpdate(firebaseUid, subscriptionId, customerId, 'canceled', serviceType);
        console.log(`🟥 サブスクリプション解約: UID=${firebaseUid}`);
        break;
      }
      default:
        console.log(`ℹ 未対応イベント: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (err: any) {
    console.error('Webhook処理中のエラー:', err);
    return res.status(500).json({ error: err.message });
  }
}






















