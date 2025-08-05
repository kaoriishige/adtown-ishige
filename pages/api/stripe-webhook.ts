import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { buffer } from 'micro';
import * as admin from 'firebase-admin';

// --- Firebase初期化コード ---
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


// Stripe SDKを初期化
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // @ts-ignore
  apiVersion: '2024-06-20',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Next.jsのBody-parserを無効化
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

  // イベントタイプに応じて処理を分岐
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const { uid } = session.metadata!;
      const customerId = session.customer as string;
      const subscriptionId = session.subscription as string;

      try {
        await adminDb.collection('users').doc(uid).update({
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          subscriptionStatus: 'active',
        });
        await adminAuth.setCustomUserClaims(uid, { stripeRole: 'paid' });
        console.log(`User ${uid} subscription activated.`);
      } catch (error) {
        console.error('Failed to update user after checkout:', error);
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
          await adminAuth.setCustomUserClaims(userDoc.id, { stripeRole: 'free' });
          console.log(`User ${userDoc.id} subscription canceled.`);
        }
      } catch (error) {
        console.error('Failed to update user after cancellation:', error);
      }
      break;
    }
    
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.status(200).json({ received: true });
};

export default handler;