import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { buffer } from 'micro';
import * as admin from 'firebase-admin';
import { getAdminAuth, getAdminDb } from '../../lib/firebase-admin';

// Stripe SDKの初期化
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
apiVersion: '2024-04-10',// 固定したバージョンに合わせた正しいAPIバージョン
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
      
      const subscriptionId = session.subscription as string;
      if (!subscriptionId) {
        console.error('❌ Webhook Error: Subscription ID not found in session.');
        break;
      }
      
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const firebaseUID = subscription.metadata?.firebaseUID;

      const customerId = session.customer as string;
      const referrerUid = session.metadata?.referrerUid;

      if (!firebaseUID) {
        console.error('❌ Webhook Error: Firebase UID not found in subscription metadata.');
        break;
      }

      try {
        await adminDb.collection('users').doc(firebaseUID).set({
          plan: 'paid_480',
          subscriptionStatus: 'active',
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          referrer: referrerUid || null,
        }, { merge: true });
        
        const userRecord = await adminAuth.getUser(firebaseUID);
        const claims = userRecord.customClaims || {};
        await adminAuth.setCustomUserClaims(firebaseUID, {
          ...claims,
          plan: 'paid_480',
        });
        
        console.log(`✅ User ${firebaseUID} successfully upgraded to paid_480 plan.`);

        if (referrerUid) {
          const referrerRef = adminDb.collection('users').doc(referrerUid);
          const rewardAmount = 480 * 0.2;
          
          await referrerRef.update({
            unpaidRewards: admin.firestore.FieldValue.increment(rewardAmount),
            totalRewards: admin.firestore.FieldValue.increment(rewardAmount)
          });

          await adminDb.collection('referralRewards').add({
            referrerUid: referrerUid,
            referredUid: firebaseUID,
            rewardAmount: rewardAmount,
            rewardStatus: 'unpaid',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            sourceCheckoutId: session.id,
          });
          console.log(`✅ Referrer ${referrerUid} received a reward of ${rewardAmount} yen.`);
        }

      } catch (error) {
        console.error('Webhook Error (checkout.session.completed):', error);
      }
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      try {
          const usersQuery = await adminDb.collection('users').where('stripeCustomerId', '==', customerId).limit(1).get();
          if (!usersQuery.empty) {
              const userDoc = usersQuery.docs[0];
              await userDoc.ref.update({ subscriptionStatus: subscription.status });
              console.log(`✅ Updated subscription status for user ${userDoc.id} to ${subscription.status}.`);
          }
      } catch (error) {
          console.error('Webhook Error (customer.subscription.updated):', error);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      try {
        const userSnapshot = await adminDb.collection('users').where('stripeCustomerId', '==', customerId).limit(1).get();
        if (!userSnapshot.empty) {
          const userDoc = userSnapshot.docs[0];
          const uid = userDoc.id;

          await userDoc.ref.update({
             subscriptionStatus: 'canceled',
             plan: 'free'
          });
          
          const userRecord = await adminAuth.getUser(uid);
          const claims = userRecord.customClaims || {};
          await adminAuth.setCustomUserClaims(uid, {
            ...claims,
            plan: 'free',
          });
          console.log(`✅ User ${uid} subscription canceled.`);
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