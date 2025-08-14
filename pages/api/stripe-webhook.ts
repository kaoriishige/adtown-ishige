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
        // --- パートナー登録の処理 ---
        const { uid, storeName, contactPerson, email } = metadata;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;
        
        try {
          await adminDb.collection('users').doc(uid).set({
            email: email,
            role: 'partner',
            partnerInfo: {
              storeName: storeName,
              contactPerson: contactPerson,
              address: '',
            },
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            subscriptionStatus: 'active',
            totalRewards: 0,
            unpaidRewards: 0,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          await adminAuth.setCustomUserClaims(uid, { role: 'partner' });
          console.log(`SUCCESS: Partner ${uid} created and subscription activated.`);
        } catch (error) {
          console.error('Failed to save partner info after checkout:', error);
        }
      } else {
        // --- 一般ユーザーのサブスクリプション処理 ---
        const { uid, referrerUid } = metadata!;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;
        const amountTotal = session.amount_total;

        try {
          await adminDb.collection('users').doc(uid).set({
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            subscriptionStatus: 'active',
            referrer: referrerUid || null,
          }, { merge: true });
          await adminAuth.setCustomUserClaims(uid, { stripeRole: 'paid' });
          console.log(`SUCCESS: User ${uid} subscription activated.`);

          // 紹介者がいる場合、報酬を発生させる
          if (referrerUid && amountTotal) {
            // --- ここから変更 ---
            const referrerRef = adminDb.collection('users').doc(referrerUid);
            const referrerDoc = await referrerRef.get();
            let rewardRate = 0.2; // デフォルトは20%

            if (referrerDoc.exists) {
              const referrerData = referrerDoc.data()!;
              const firstReferralDate = referrerData.firstReferralDate?.toDate();
              
              // 報酬率の切り替え日を設定 (2025年10月1日 00:00:00 UTC)
              const cutoffDate = new Date('2025-10-01T00:00:00Z');

              if (firstReferralDate) {
                // 既に初回紹介日が記録されている場合
                if (firstReferralDate < cutoffDate) {
                  rewardRate = 0.3; // 記録されている初回紹介日が10月1日より前なら30%
                } else {
                  rewardRate = 0.2; // 10月1日以降なら20%
                }
              } else {
                // 今回が初めての紹介の場合
                const now = new Date();
                if (now < cutoffDate) {
                  rewardRate = 0.3; // 今回の紹介が10月1日より前なら30%
                } else {
                  rewardRate = 0.2; // 10月1日以降なら20%
                }
                // 初回紹介日を記録して、今後の報酬率を固定する
                await referrerRef.update({ firstReferralDate: admin.firestore.FieldValue.serverTimestamp() });
              }
            }
            // --- ここまで変更 ---

            const rewardAmount = Math.floor(amountTotal * rewardRate);

            await adminDb.collection('referralRewards').add({
              referrerUid: referrerUid,
              referredUid: uid,
              rewardAmount: rewardAmount,
              rewardStatus: 'unpaid',
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              sourceCheckoutId: session.id,
            });
            
            await referrerRef.update({
              unpaidRewards: admin.firestore.FieldValue.increment(rewardAmount),
              totalRewards: admin.firestore.FieldValue.increment(rewardAmount)
            });

            console.log(`SUCCESS: Referrer ${referrerUid} received a reward of ${rewardAmount} yen with rate ${rewardRate}.`);
          }
        } catch (error) {
          console.error('Webhook Error (user checkout.session.completed):', error);
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
      console.log(`Unhandled event type ${event.type}`);
  }

  res.status(200).json({ received: true });
};

export default handler;