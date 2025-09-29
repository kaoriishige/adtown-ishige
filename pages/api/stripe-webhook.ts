import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

// 環境変数からStripeのシークレットキーとWebhookシークレットを取得
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
});
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

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

  // リクエストボディをBufferとして取得
  const buf = await new Promise<Buffer>((resolve, reject) => {
    let chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });

  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;

  try {
    // Webhookの署名を確認
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret!);
  } catch (err: any) {
    console.error(`⚠️ Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // イベントの種類によって処理を分岐
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      
      console.log('✅ Checkout session completed:', session.id);

      try {
        const firebaseUID = session.metadata?.firebaseUID;
        const customerId = session.customer as string;

        if (firebaseUID) {
          // Firebaseのユーザー情報を更新
          await adminDb.collection('partners').doc(firebaseUID).update({
            stripeCustomerId: customerId,
            status: 'active', // サブスクリプションが開始されたことを示す
            lastPaymentDate: new Date(),
          });
          
          console.log(`✅ Partner status for UID ${firebaseUID} updated to 'active'.`);
        } else {
          console.error('❌ Firebase UID not found in session metadata.');
        }
      } catch (error) {
        console.error('❌ Error updating partner status:', error);
        return res.status(500).json({ error: 'Failed to update partner status.' });
      }
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.status(200).json({ received: true });
};

export default handler;