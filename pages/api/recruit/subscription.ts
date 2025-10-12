import type { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
});

type Data = {
  newStatus?: 'active' | 'paused';
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { authorization } = req.headers;
    if (!authorization?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing token' });
    }
    const idToken = authorization.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const { action }: { action: 'pause' | 'resume' } = req.body;
    if (!['pause', 'resume'].includes(action)) {
        return res.status(400).json({ error: 'Invalid action specified.' });
    }
    
    const userRef = adminDb.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
        return res.status(404).json({ error: 'User not found.' });
    }

    const userData = userDoc.data()!;
    const paymentMethod = userData.paymentMethod; // 'credit_card' or 'invoice'
    const subscriptionId = userData.stripeSubscriptionId;
    const currentStatus = userData.recruitSubscriptionStatus;

    // 請求書払いの場合
    if (paymentMethod === 'invoice') {
        const newStatus = action === 'pause' ? 'paused' : 'active';
        await userRef.update({ recruitSubscriptionStatus: newStatus });
        return res.status(200).json({ newStatus });
    }

    // クレジットカード払いの場合
    if (!subscriptionId) {
        return res.status(400).json({ error: 'Subscription ID not found.' });
    }

    if (action === 'pause') {
        if (currentStatus === 'paused') {
            return res.status(400).json({ error: 'Subscription is already paused.' });
        }
        await stripe.subscriptions.update(subscriptionId, {
            pause_collection: { behavior: 'mark_uncollectible' },
        });
        await userRef.update({ recruitSubscriptionStatus: 'paused' });
        return res.status(200).json({ newStatus: 'paused' });

    } else { // resume
        if (currentStatus === 'active') {
            return res.status(400).json({ error: 'Subscription is already active.' });
        }
        await stripe.subscriptions.update(subscriptionId, {
            pause_collection: null,
        });
        await userRef.update({ recruitSubscriptionStatus: 'active' });
        return res.status(200).json({ newStatus: 'active' });
    }

  } catch (error: any) {
    console.error('Subscription API Error:', error);
    if (error.code === 'auth/id-token-expired') {
        return res.status(401).json({ error: 'Unauthorized: Token expired' });
    }
    return res.status(500).json({ error: error.message || 'An internal server error occurred.' });
  }
}
