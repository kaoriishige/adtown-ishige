import { NextApiRequest, NextApiResponse } from 'next';
import { buffer } from 'micro';
import Stripe from 'stripe';
import admin from '../../lib/firebase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
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

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];

  if (!sig || !webhookSecret) {
    return res.status(400).send('Webhook secret not configured');
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err: any) {
    console.error(`❌ Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const db = admin.firestore();

  try {
    switch (event.type) {
      // 最初の支払い・登録が完了したとき
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // ★★★ ここでUIDを受け取る ★★★
        const firebaseUid = session.client_reference_id;
        const stripeCustomerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (!firebaseUid) {
            console.error('Webhook Error: Firebase UID (client_reference_id) not found in session.');
            break; 
        }

        await db.collection('users').doc(firebaseUid).update({
          stripeCustomerId: stripeCustomerId,
          subscriptionId: subscriptionId,
          subscriptionStatus: 'active', // トライアル中でもactiveとして扱う
        });
        console.log(`✅ [${firebaseUid}] checkout.session.completed: User status updated.`);
        break;
      }

      // 2回目以降の支払いが成功したとき（紹介報酬の計算）
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        
        // 初回登録時の請求は無視する（checkout.session.completedで処理するため）
        if (invoice.billing_reason === 'subscription_create') {
            break;
        }

        const stripeCustomerId = invoice.customer as string;
        if (!stripeCustomerId) break;

        const userQuery = await db.collection('users').where('stripeCustomerId', '==', stripeCustomerId).limit(1).get();
        if (userQuery.empty) break; 
        
        const referredUserDoc = userQuery.docs[0];
        const referredUserData = referredUserDoc.data();
        const referrerId = referredUserData.referrerId;

        if (referrerId) {
          const referrerDocRef = db.collection('users').doc(referrerId);
          const referrerDoc = await referrerDocRef.get();
          if (!referrerDoc.exists) break;

          let rewardRate = referrerDoc.data()?.referralRate;

          if (typeof rewardRate !== 'number') {
            const campaignEndDate = new Date('2025-08-31T23:59:59+09:00');
            const now = new Date();
            rewardRate = now <= campaignEndDate ? 0.30 : 0.20;
            await referrerDocRef.update({ referralRate: rewardRate });
            console.log(`[${referrerId}] First referral! Set rewardRate to ${rewardRate}.`);
          }
          
          const paymentAmount = invoice.amount_paid;
          const rewardAmount = Math.floor(paymentAmount * rewardRate);

          if (rewardAmount > 0) {
            await db.collection('referralRewards').add({
              referrerUid: referrerId,
              referredUid: referredUserDoc.id,
              referredUserEmail: referredUserData.email,
              invoiceId: invoice.id,
              paymentAmount: paymentAmount,
              rewardAmount: rewardAmount,
              rewardRate: rewardRate,
              rewardStatus: 'pending',
              paymentDate: admin.firestore.Timestamp.fromMillis(invoice.created * 1000),
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            console.log(`🎉 [${referrerId}] received a reward of ${rewardAmount} (rate: ${rewardRate})`);
          }
        }
        break;
      }

      // サブスクリプションがキャンセルされたとき
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const stripeCustomerId = subscription.customer as string;

        const userQuery = await db.collection('users').where('stripeCustomerId', '==', stripeCustomerId).limit(1).get();
        if (userQuery.empty) break;

        const userDoc = userQuery.docs[0];
        await db.collection('users').doc(userDoc.id).update({
          subscriptionStatus: 'canceled',
        });
        console.log(`[${userDoc.id}] Subscription canceled.`);
        break;
      }

      default:
        // console.log(`🤷‍♀️ Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });

  } catch (error) {
    console.error('🔥 Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed.' });
  }
};

export default handler;



