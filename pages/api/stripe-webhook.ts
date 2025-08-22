import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { buffer } from 'micro';
import * as admin from 'firebase-admin';

// --- Firebase Admin SDKの初期化 ---
// この部分は、ご自身の環境に合わせて lib/firebase-admin.ts などからインポートしてください
let app: admin.app.App | null = null;
function initializeFirebaseAdmin(): admin.app.App {
  if (admin.apps.length > 0) {
    app = admin.app();
    return app;
  }
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  };
  if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
    throw new Error('Firebaseの環境変数（PROJECT_ID, CLIENT_EMAIL, PRIVATE_KEY）が設定されていません。');
  }
  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  return app;
}
function getAdminDb(): admin.firestore.Firestore {
  if (!app) initializeFirebaseAdmin();
  return admin.firestore(app!);
}
function getAdminAuth(): admin.auth.Auth {
  if (!app) initializeFirebaseAdmin();
  return admin.auth(app!);
}
// --- ここまでFirebase初期化コード ---

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

  // --- イベントタイプに応じた処理 ---
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const { metadata } = session;

      if (metadata?.user_type === 'partner') {
        // --- パートナー登録の処理 (変更なし) ---
        // (省略)
      } else {
        // --- 一般ユーザーのサブスクリプション処理 ---
        const { uid, referrerUid } = metadata!;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;
        const amountTotal = session.amount_total;

        try {
          // ▼▼▼ 変更点 1: Stripeから最新の契約状況を取得して保存 ▼▼▼
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const initialStatus = subscription.status; // 'active' または 'trialing'

          await adminDb.collection('users').doc(uid).set({
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            subscriptionStatus: initialStatus, // 実際のステータスを保存
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

              // ▼▼▼ 変更点 2: 紹介者が有効な状態（有料 or トライアル）か確認 ▼▼▼
              if (referrerStatus === 'active' || referrerStatus === 'trialing') {
                // 報酬率の計算ロジック (変更なし)
                let rewardRate = 0.2;
                // (省略) ... 既存の報酬率計算ロジック ...

                const rewardAmount = Math.floor(amountTotal * rewardRate);

                // ▼▼▼ 変更点 3: 紹介者の状態に応じて報酬ステータスを決定 ▼▼▼
                const rewardStatus = referrerStatus === 'active' ? 'unpaid' : 'pending';

                await adminDb.collection('referralRewards').add({
                  referrerUid: referrerUid,
                  referredUid: uid,
                  rewardAmount: rewardAmount,
                  rewardStatus: rewardStatus, // 'unpaid' または 'pending'
                  createdAt: admin.firestore.FieldValue.serverTimestamp(),
                  sourceCheckoutId: session.id,
                });
                
                // 紹介者が有料会員の場合のみ、即座に報酬額を更新
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

    // ▼▼▼ 変更点 4: トライアルから有料プランへの移行を検知する処理を追加 ▼▼▼
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const previousAttributes = event.data.previous_attributes;

      // トライアル期間が終了し、有料プランに移行したことを確認
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

          // ユーザー自身の契約ステータスを 'active' に更新
          await userDoc.ref.update({ subscriptionStatus: 'active' });

          // このユーザーが紹介者となっている「保留中」の報酬を検索
          const rewardsQuery = await adminDb.collection('referralRewards')
              .where('referrerUid', '==', userId)
              .where('rewardStatus', '==', 'pending')
              .get();
          
          if (rewardsQuery.empty) {
              console.log(`INFO: No pending rewards to activate for user ${userId}.`);
              break;
          }

          // ▼▼▼ エラー修正 ▼▼▼
          // 変数をトランザクションの外側で宣言
          let totalActivatedReward = 0;

          // トランザクションを使い、保留中の報酬を有効化し、報酬額をアトミックに加算
          await adminDb.runTransaction(async (transaction) => {
              rewardsQuery.docs.forEach(doc => {
                  transaction.update(doc.ref, { rewardStatus: 'unpaid' });
                  totalActivatedReward += doc.data().rewardAmount; // 外側の変数を更新
              });

              transaction.update(userDoc.ref, {
                  unpaidRewards: admin.firestore.FieldValue.increment(totalActivatedReward),
                  totalRewards: admin.firestore.FieldValue.increment(totalActivatedReward)
              });
          });
          
          // これで変数がスコープ内にあるため、エラーは発生しない
          console.log(`SUCCESS: Activated ${rewardsQuery.size} pending rewards for user ${userId} totaling ${totalActivatedReward} yen.`);

        } catch (error) {
            console.error('Webhook Error (customer.subscription.updated):', error);
        }
      }
      break;
    }

    case 'customer.subscription.deleted': {
      // (この部分は変更ありません)
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