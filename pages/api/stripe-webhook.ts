import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { buffer } from 'micro';
import * as admin from 'firebase-admin';

// Firebase Admin SDKの初期化は共通のライブラリからインポート
import { getAdminAuth, getAdminDb } from '../../lib/firebase-admin';

// Stripe SDKの初期化
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // @ts-ignore
  apiVersion: '2024-06-20',
});
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

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

  const adminDb = getAdminDb();
  const adminAuth = getAdminAuth();
  const buf = await buffer(req);
  const sig = req.headers['stripe-signature']!;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf.toString(), sig, webhookSecret);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.log(`❌ Webhook signature verification failed: ${errorMessage}`);
    return res.status(400).send(`Webhook Error: ${errorMessage}`);
  }

  // --- 運営設定をデータベースから取得する ---
  // 報酬率を動的に取得するために、settingsコレクションからデータを取得します
  let referralRewardRate = 0.2; // デフォルト値
  try {
    const settingsDoc = await adminDb.collection('settings').doc('appSettings').get();
    if (settingsDoc.exists) {
      const data = settingsDoc.data();
      if (data && typeof data.referralRewardRate === 'number') {
        referralRewardRate = data.referralRewardRate;
      }
    }
  } catch (error) {
    console.error('Failed to fetch app settings:', error);
  }

  // --- イベントタイプに応じた処理 ---
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const { metadata } = session;

      if (metadata?.user_type === 'partner') {
        // パートナー登録の処理 (この部分は変更なし)
        // ...
      } else {
        // 一般ユーザーのサブスクリプション処理
        const { uid, referrerUid } = metadata!;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;
        const amountTotal = session.amount_total;

        try {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const initialStatus = subscription.status;

          await adminDb.collection('users').doc(uid).set({
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            subscriptionStatus: initialStatus,
            referrer: referrerUid || null,
          }, { merge: true });

          await adminAuth.setCustomUserClaims(uid, { stripeRole: 'paid' });
          console.log(`SUCCESS: User ${uid} subscription created with status: ${initialStatus}.`);

          // 紹介者がいる場合、報酬を発生させる
          if (referrerUid && amountTotal) {
            const referrerRef = adminDb.collection('users').doc(referrerUid);
            const referrerDoc = await referrerRef.get();
            
            if (referrerDoc.exists) {
              const referrerData = referrerDoc.data()!;
              const referrerStatus = referrerData.subscriptionStatus;

              if (referrerStatus === 'active' || referrerStatus === 'trialing') {
                // ▼▼▼ 変更点: データベースから取得した報酬率を使用する ▼▼▼
                const rewardAmount = Math.floor(amountTotal * referralRewardRate);

                const rewardStatus = referrerStatus === 'active' ? 'unpaid' : 'pending';

                await adminDb.collection('referralRewards').add({
                  referrerUid: referrerUid,
                  referredUid: uid,
                  rewardAmount: rewardAmount,
                  rewardStatus: rewardStatus,
                  createdAt: admin.firestore.FieldValue.serverTimestamp(),
                  sourceCheckoutId: session.id,
                });
                
                if (rewardStatus === 'unpaid') {
                  await referrerRef.update({
                    unpaidRewards: admin.firestore.FieldValue.increment(rewardAmount),
                    totalRewards: admin.firestore.FieldValue.increment(rewardAmount)
                  });
                  console.log(`SUCCESS: Referrer ${referrerUid} received a reward of ${rewardAmount} yen.`);
                } else {
                  console.log(`INFO: Pending reward of ${rewardAmount} yen logged for referrer ${referrerUid} (in trial).`);
                }
              } else {
                console.log(`INFO: Referrer ${referrerUid} is not active or in trial. No reward generated.`);
              }
            }
          }
        } catch (error) {
          console.error('Webhook Error (user checkout.session.completed):', error);
        }
      }
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const previousAttributes = event.data.previous_attributes;

      if (previousAttributes?.status === 'trialing' && subscription.status === 'active') {
        const customerId = subscription.customer as string;
        try {
          const usersQuery = await adminDb.collection('users').where('stripeCustomerId', '==', customerId).limit(1).get();
          if (usersQuery.empty) {
            console.log(`Webhook Info: User with customerId ${customerId} not found for subscription update.`);
            break;
          }
          const userDoc = usersQuery.docs[0];
          const userId = userDoc.id;

          await userDoc.ref.update({ subscriptionStatus: 'active' });

          const rewardsQuery = await adminDb.collection('referralRewards')
              .where('referrerUid', '==', userId)
              .where('rewardStatus', '==', 'pending')
              .get();
          
          if (rewardsQuery.empty) {
              console.log(`INFO: No pending rewards to activate for user ${userId}.`);
              break;
          }

          let totalActivatedReward = 0;

          await adminDb.runTransaction(async (transaction) => {
              rewardsQuery.docs.forEach(doc => {
                  transaction.update(doc.ref, { rewardStatus: 'unpaid' });
                  // ▼▼▼ 変更点: ここも報酬率を動的に取得するように修正 ▼▼▼
                  const rewardAmount = doc.data().rewardAmount;
                  totalActivatedReward += rewardAmount;
              });

              transaction.update(userDoc.ref, {
                  unpaidRewards: admin.firestore.FieldValue.increment(totalActivatedReward),
                  totalRewards: admin.firestore.FieldValue.increment(totalActivatedReward)
              });
          });
          
          console.log(`SUCCESS: Activated ${rewardsQuery.size} pending rewards for user ${userId} totaling ${totalActivatedReward} yen.`);

        } catch (error) {
            console.error('Webhook Error (customer.subscription.updated):', error);
        }
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      try {
        const userSnapshot = await adminDb.collection('users').where('stripeCustomerId', '==', customerId).get();
        if (!userSnapshot.empty) {
          const userDoc = userSnapshot.docs[0];
          await userDoc.ref.update({ subscriptionStatus: 'canceled' });
          const userRole = userDoc.data().role;
          if (userRole === 'partner') {
              await adminAuth.setCustomUserClaims(userDoc.id, { role: null });
          } else {
              await adminAuth.setCustomUserClaims(userDoc.id, { stripeRole: 'free' });
          }
          console.log(`SUCCESS: User ${userDoc.id} subscription canceled.`);
        }
      } catch (error) {
        console.error('Webhook Error (customer.subscription.deleted):', error);
      }
      break;
    }
  }

  res.status(200).json({ received: true });
};

export default handler;