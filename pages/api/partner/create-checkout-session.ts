import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import getAdminStripe from '@/lib/stripe-admin';
import Stripe from 'stripe';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).end('Method Not Allowed');
    }

    const {
        storeName, address, area, contactPerson, phoneNumber,
        qrStandCount, email, password, category
    } = req.body;

    console.log('[API DIAGNOSTIC] 1. Received request body:', req.body);

    const db = getAdminDb();
    const auth = getAdminAuth();
    const stripe = getAdminStripe();

    try {
        console.log(`[API DIAGNOSTIC] 2. Creating user in Firebase Auth for email: ${email}`);
        const userRecord = await auth.createUser({
            email: email,
            password: password,
            displayName: storeName,
        });
        console.log(`[API DIAGNOSTIC] 2-Success. Successfully created auth user with UID: ${userRecord.uid}`);

        const userData = {
            uid: userRecord.uid,
            email,
            storeName,
            address,
            area,
            contactPerson,
            phoneNumber,
            qrStandCount,
            category,
            role: 'partner',
            status: 'pending',
            createdAt: new Date().toISOString(),
        };

        console.log(`[API DIAGNOSTIC] 3. Preparing to write to Firestore with data:`, userData);
        await db.collection('users').doc(userRecord.uid).set(userData);
        console.log(`[API DIAGNOSTIC] 3-Success. Successfully wrote user data to Firestore.`);

        console.log(`[API DIAGNOSTIC] 4. Creating Stripe Customer for email: ${email}`);
        const customer = await stripe.customers.create({
            email: email,
            name: storeName,
            metadata: {
                firebaseUID: userRecord.uid,
            },
        });
        console.log(`[API DIAGNOSTIC] 4-Success. Successfully created Stripe Customer with ID: ${customer.id}`);

        // ▼▼▼ ここが最後の修正箇所です ▼▼▼
        const priceId = process.env.STRIPE_AD_PRICE_ID;"price_1SAz0cJlUiZ4txnKRWvZQy4M"
        if (!priceId) {
            throw new Error('Partner Stripe Price ID (STRIPE_PARTNER_PRICE_ID) is not configured in environment variables.');
        }
        // ▲▲▲ 修正ここまで ▲▲▲

        console.log(`[API DIAGNOSTIC] 5. Creating Stripe Checkout Session with Price ID: ${priceId}`);
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            customer: customer.id,
            line_items: [{
                price: priceId,
                quantity: 1,
            }],
            mode: 'subscription',
            success_url: `${req.headers.origin}/partner/dashboard?payment_success=true`,
            cancel_url: `${req.headers.origin}/partner/signup`,
            metadata: {
                firebaseUID: userRecord.uid,
            }
        });
        console.log(`[API DIAGNOSTIC] 5-Success. Successfully created Stripe Session.`);

        res.status(200).json({ sessionId: session.id });

    } catch (error: any) {
        console.error("!!!!!!!!!! [API ERROR] !!!!!!!!!!");
        console.error("An error occurred during partner signup process:");
        console.error("Error Code:", error.code);
        console.error("Error Message:", error.message);
        console.error("Full Error Object:", error);
        console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        
        res.status(500).json({ error: error.message || 'An unexpected error occurred.' });
    }
}