// pages/api/stripe-webhook.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { buffer } from 'micro';
import Stripe from 'stripe';
import { admin } from '@/lib/firebase-admin';

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
  const sig = req.headers['stripe-signature']!;

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
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const firebaseUid = session.client_reference_id!;
        const stripeCustomerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        await db.collection('users').doc(firebaseUid).update({
          stripeCustomerId: stripeCustomerId,
          subscriptionId: subscriptionId,
          subscriptionStatus: 'active',
        });
        console.log(`✅ [${firebaseUid}] checkout.session.completed: User status updated.`);
        break;
      }

      // ▼▼▼ 報酬率のロジックを更新 ▼▼▼
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const stripeCustomerId = invoice.customer as string;
        
        const userQuery = await db.collection('users').where('stripeCustomerId', '==', stripeCustomerId).limit(1).get();
        if (userQuery.empty) break; 
        
        const referredUserDoc = userQuery.docs[0];
        const referredUserData = referredUserDoc.data();
        const referrerId = referredUserData.referrerId;

        if (referrerId) {
          // 紹介者の情報を取得
          const referrerDocRef = db.collection('users').doc(referrerId);
          const referrerDoc = await referrerDocRef.get();
          if (!referrerDoc.exists) break;

          let rewardRate = referrerDoc.data()?.referralRate;

          // もし報酬率が未設定なら（＝最初の紹介）、日付で判定して設定
          if (!rewardRate) {
            const campaignEndDate = new Date('2025-08-31T23:59:59+09:00'); // JST
            const now = new Date();
            
            rewardRate = now <= campaignEndDate ? 0.30 : 0.20; // 30% or 20%
            
            // 決定した報酬率をユーザー情報に保存
            await referrerDocRef.update({ referralRate: rewardRate });
            console.log(`[${referrerId}] First referral! Set rewardRate to ${rewardRate}.`);
          }
          
          const paymentAmount = invoice.amount_paid;
          const rewardAmount = Math.floor(paymentAmount * rewardRate);

          await db.collection('referralRewards').add({
            referrerUid: referrerId,
            referredUid: referredUserDoc.id,
            referredUserEmail: referredUserData.email,
            invoiceId: invoice.id,
            paymentAmount: paymentAmount,
            rewardAmount: rewardAmount,
            rewardRate: rewardRate, // どの率で計算したか記録
            rewardStatus: 'pending',
            paymentDate: admin.firestore.Timestamp.fromMillis(invoice.created * 1000),
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          console.log(`🎉 [${referrerId}] received a reward of ${rewardAmount} (rate: ${rewardRate})`);
        }
        break;
      }
      // ▲▲▲ ここまで更新 ▲▲▲

      case 'customer.subscription.updated': {
        // ... (省略)
        break;
      }

      case 'customer.subscription.deleted': {
        // ... (省略)
        break;
      }

      default:
        console.log(`🤷‍♀️ Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });

  } catch (error) {
    console.error('🔥 Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed.' });
  }
};

export default handler;



