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
    // ▼▼▼ 【重要】エラー箇所をsubscriptionSchedulesを使用するロジックに修正 ▼▼▼
    case 'customer.subscription.trial_will_end': {
      const subscription = event.data.object as Stripe.Subscription;
      
      const initialPriceId = process.env.STRIPE_CAMPAIGN_PRICE_ID!;
      const standardPriceId = process.env.STRIPE_STANDARD_PRICE_ID!; // 通常プランのIDも必要
      
      if (!initialPriceId || !standardPriceId) {
        console.error('Stripe Price ID is not set in environment variables.');
        break;
      }

      try {
        // 既存のサブスクリプションからスケジュールを作成する
        const schedule = await stripe.subscriptionSchedules.create({
          from_subscription: subscription.id,
        });

        // 作成したスケジュールを更新して、トライアル後の料金プランを定義する
        await stripe.subscriptionSchedules.update(schedule.id, {
          end_behavior: 'release', // スケジュール完了後は、最後のフェーズの設定でサブスクリプションを継続
          proration_behavior: 'none',
          // トライアル後に追加するフェーズを定義
          phases: [
            // フェーズ1: トライアル終了後の最初の1ヶ月間は480円プラン
            {
              items: [{ price: initialPriceId }],
              iterations: 1, // このフェーズは1回（1ヶ月）で終了
            },
            // フェーズ2: その後は980円プランで無期限に継続
            {
              items: [{ price: standardPriceId }],
            },
          ],
        });
        
        console.log(`SUCCESS: Subscription ${subscription.id} scheduled to transition to initial price plan after trial.`);
      } catch (error) {
        console.error('Webhook Error (customer.subscription.trial_will_end):', error);
      }
      break;
    }
    // ▲▲▲ ここまで ▲▲▲

    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const { metadata } = session;

      if (metadata?.user_type === 'partner') {
        // パートナー登録の処理
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

          if (referrerUid && amountTotal) {
            const referrerRef = adminDb.collection('users').doc(referrerUid);
            const referrerDoc = await referrerRef.get();
            
            if (referrerDoc.exists) {
              const referrerData = referrerDoc.data()!;
              const referrerStatus = referrerData.subscriptionStatus;

              if (referrerStatus === 'active' || referrerStatus === 'trialing') {
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

      // Firestoreのステータスを更新する汎用ロジック
      const customerId = subscription.customer as string;
      try {
          const usersQuery = await getAdminDb().collection('users').where('stripeCustomerId', '==', customerId).limit(1).get();
          if (!usersQuery.empty) {
              const userDoc = usersQuery.docs[0];
              await userDoc.ref.update({ subscriptionStatus: subscription.status });
              console.log(`SUCCESS: Updated subscription status for user ${userDoc.id} to ${subscription.status}.`);
          }
      } catch (error) {
          console.error('Webhook Error (customer.subscription.updated - status sync):', error);
      }
      
      // トライアルから本課金に移行した際の報酬アクティベート処理
      if (previousAttributes?.status === 'trialing' && subscription.status === 'active') {
        try {
          const usersQuery = await adminDb.collection('users').where('stripeCustomerId', '==', customerId).limit(1).get();
          if (usersQuery.empty) {
            console.log(`Webhook Info: User with customerId ${customerId} not found for subscription update.`);
            break;
          }
          const userDoc = usersQuery.docs[0];
          const userId = userDoc.id;

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
            console.error('Webhook Error (customer.subscription.updated - reward activation):', error);
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

    default:
        console.log(`Unhandled event type: ${event.type}`);
  }

  res.status(200).json({ received: true });
};

export default handler;