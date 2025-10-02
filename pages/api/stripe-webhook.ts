// pages/api/stripe-webhook.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { buffer } from 'micro';
import Stripe from 'stripe';
import { adminDb } from '../../lib/firebase-admin'; // Firebase Adminをインポート

// Stripeの初期化
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10', // お使いのバージョンに合わせる
});

// Webhookの署名検証に使うシークレットキー
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Next.jsのデフォルトのBody Parserを無効にする
export const config = {
  api: {
    bodyParser: false,
  },
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature']!;

  let event: Stripe.Event;

  try {
    // Stripeからのリクエストであることを署名で検証
    event = stripe.webhooks.constructEvent(buf.toString(), sig, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // --- イベントの種類に応じて処理を分岐 ---
  try {
    switch (event.type) {
      // 例：決済が成功したときの処理
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        // メタデータからFirebaseのUIDを取得
        const firebaseUid = session.metadata?.firebase_uid;
        if (firebaseUid) {
          // ここでデータベースを更新するなどの処理を行う
          // 例: usersコレクションのステータスを 'active' に更新
          await adminDb.collection('users').doc(firebaseUid).update({
            subscriptionStatus: 'active',
          });
          console.log(`User ${firebaseUid} subscription is now active.`);
        }
        break;
      }
      
      // 例：サブスクリプションが更新されたときの処理
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const firebaseUid = subscription.metadata?.firebaseUID;
        if (firebaseUid) {
          // データベースのサブスクリプションステータスを更新
          await adminDb.collection('users').doc(firebaseUid).update({
            subscriptionStatus: subscription.status,
          });
          console.log(`User ${firebaseUid} subscription was updated to ${subscription.status}.`);
        }
        break;
      }

      // 他のイベントタイプもここに追加できます
      // case 'customer.subscription.deleted':
      //   // ...
      //   break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  } catch (error) {
    console.error('Webhook handler error:', error);
    return res.status(500).json({ error: 'Webhook handler failed.' });
  }

  // Stripeに「正常に受け取りました」と返事をする
  res.status(200).json({ received: true });
};

export default handler;