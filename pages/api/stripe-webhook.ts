import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import getStripeAdmin from '@/lib/stripe-admin';
import Stripe from 'stripe';
import * as admin from 'firebase-admin';

// 環境変数チェック
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
const stripe = getStripeAdmin();

export const config = { api: { bodyParser: false } };

/**
 * StripeのリクエストボディをBufferで取得
 */
async function buffer(readable: NextApiRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

/**
 * 有料プラン更新・紹介報酬計算ロジック
 */
async function handleSubscriptionUpdate(
  uid: string,
  subscriptionId: string | null,
  customerId: string | null,
  status: 'active' | 'canceled' | 'pending_invoice',
  serviceType: string
) {
  if (!uid || !serviceType) {
    console.error('❌ UIDまたはServiceTypeが欠如しています');
    return;
  }

  const userDocRef = adminDb.collection('users').doc(uid);
  const isActive = status === 'active';

  // --- 1. Firestore 基本情報更新 ---
  const updateData: any = {
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    isPaid: isActive,
    [`${serviceType}SubscriptionStatus`]: status,
    subscriptionStatus: status,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  // 480円プランの場合、専用のplanフィールドを更新
  if (serviceType === 'paid_480' && isActive) {
    updateData.plan = 'paid_480';
  }

  await userDocRef.set(updateData, { merge: true });

  // --- 2. 紹介報酬(20%)の計算と付与ロジック ---
  // 決済成功時のみ実行
  if (isActive) {
    try {
      const userDoc = await userDocRef.get();
      const userData = userDoc.data();
      const referredBy = userData?.referredBy; // 紹介者のUID

      if (referredBy) {
        let commission = 0;
        let statKey = '';

        // プランごとの報酬計算
        if (serviceType === 'paid_480') {
          commission = 480 * 0.2; // 96円
          statKey = 'stats_user';
        } else if (serviceType === 'adver') {
          // 広告パートナー決済（例: 月額料金の20%）
          // 仮に5000円なら1000円など。ここでは金額に応じた20%を計算。
          const subscription = await stripe.subscriptions.retrieve(subscriptionId!);
          const amount = subscription.items.data[0].plan.amount || 0;
          commission = amount * 0.2;
          statKey = 'stats_adver';
        } else if (serviceType === 'recruit') {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId!);
          const amount = subscription.items.data[0].plan.amount || 0;
          commission = amount * 0.2;
          statKey = 'stats_recruit';
        }

        if (commission > 0) {
          const referrerRef = adminDb.collection('users').doc(referredBy);
          await referrerRef.update({
            earned: admin.firestore.FieldValue.increment(commission),
            [`${statKey}.conversions`]: admin.firestore.FieldValue.increment(1),
            [`${statKey}.earned`]: admin.firestore.FieldValue.increment(commission),
            lastCommissionAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          console.log(`✅ 報酬付与完了: 紹介者 ${referredBy} へ ${commission}円 (${serviceType})`);
        }
      }
    } catch (refErr) {
      console.error(`❌ 報酬加算エラー:`, refErr);
    }
  }

  // --- 3. Firebase Auth CustomClaims (権限) 更新 ---
  try {
    const user = await adminAuth.getUser(uid);
    const currentClaims = user.customClaims || {};

    if (serviceType === 'adver' || serviceType === 'recruit') {
      const serviceRole = serviceType === 'adver' ? 'adver' : 'recruit';
      let roles = Array.isArray(currentClaims.roles) ? [...currentClaims.roles] : [];
      if (isActive) {
        if (!roles.includes(serviceRole)) roles.push(serviceRole);
      } else if (status === 'canceled') {
        roles = roles.filter((r) => r !== serviceRole);
      }
      await adminAuth.setCustomUserClaims(uid, { ...currentClaims, roles, isPaid: isActive });
    } else if (serviceType === 'paid_480') {
      await adminAuth.setCustomUserClaims(uid, {
        ...currentClaims,
        isPremium: isActive,
        plan: isActive ? 'paid_480' : 'free'
      });
    }
  } catch (authErr) {
    console.error(`❌ Auth Claims更新失敗:`, authErr);
  }
}

/**
 * Webhookメインハンドラ
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  let event: Stripe.Event;
  try {
    const buf = await buffer(req);
    const sig = req.headers['stripe-signature']!;
    event = stripe.webhooks.constructEvent(buf.toString(), sig, webhookSecret);
  } catch (err: any) {
    console.error(`❌ Webhook Signature Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const data = event.data.object as any;

  // メタデータからUIDとサービスタイプを抽出
  let firebaseUid = data.client_reference_id || data.metadata?.firebaseUid || data.subscription_details?.metadata?.firebaseUid;
  let serviceType = data.metadata?.serviceType || data.subscription_details?.metadata?.serviceType;

  const subscriptionId = data.subscription || (event.type.startsWith('customer.subscription.') ? data.id : null);
  const customerId = data.customer || null;

  // UIDが欠落している場合の補完
  if (!firebaseUid && customerId) {
    const userQuery = await adminDb.collection('users').where('stripeCustomerId', '==', customerId).limit(1).get();
    if (!userQuery.empty) firebaseUid = userQuery.docs[0].id;
  }

  // 480円プランの場合はデフォルト値を設定
  if (!serviceType && (data.amount_total === 480 || data.amount === 480)) {
    serviceType = 'paid_480';
  }

  if (!firebaseUid) return res.status(200).json({ received: true });

  try {
    switch (event.type) {
      case 'checkout.session.completed':
      case 'invoice.payment_succeeded':
        // 支払い成功・購読開始
        await handleSubscriptionUpdate(firebaseUid, subscriptionId, customerId, 'active', serviceType || 'paid_480');
        break;
      case 'customer.subscription.deleted':
        // 解約
        await handleSubscriptionUpdate(firebaseUid, subscriptionId, customerId, 'canceled', serviceType || 'paid_480');
        break;
      case 'invoice.payment_failed':
        // 支払い失敗
        await handleSubscriptionUpdate(firebaseUid, subscriptionId, customerId, 'pending_invoice', serviceType || 'paid_480');
        break;
    }
  } catch (err: any) {
    console.error('❌ Webhook Execution Error:', err.message);
    return res.status(500).json({ error: 'Internal Processing Error' });
  }

  return res.status(200).json({ received: true });
}