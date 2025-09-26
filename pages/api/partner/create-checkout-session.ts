import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import getAdminStripe from '@/lib/stripe-admin';
import Stripe from 'stripe';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // POSTリクエスト以外は許可しない
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).end('Method Not Allowed');
    }

    const {
        storeName, address, area, contactPerson, phoneNumber,
        qrStandCount, email, password, category
    } = req.body;

    // --- 診断ログ 1 ---
    // APIが受け取ったデータが正しいかを確認
    console.log('[API DIAGNOSTIC] 1. Received request body:', req.body);

    const db = getAdminDb();
    const auth = getAdminAuth();
    const stripe = getAdminStripe();

    try {
        // --- 1. Firebase Authenticationにユーザーを作成 ---
        console.log(`[API DIAGNOSTIC] 2. Creating user in Firebase Auth for email: ${email}`);
        const userRecord = await auth.createUser({
            email: email,
            password: password,
            displayName: storeName,
        });
        console.log(`[API DIAGNOSTIC] 2-Success. Successfully created auth user with UID: ${userRecord.uid}`);

        // --- 2. Firestoreに保存するデータを準備 ---
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
            status: 'pending', // 支払い待ち状態
            createdAt: new Date().toISOString(),
        };

        // --- 診断ログ 2 ---
        // Firestoreに書き込む直前のデータを確認
        console.log(`[API DIAGNOSTIC] 3. Preparing to write to Firestore with data:`, userData);
        
        // --- 3. Firestoreに店舗情報を保存 ---
        await db.collection('users').doc(userRecord.uid).set(userData);
        
        console.log(`[API DIAGNOSTIC] 3-Success. Successfully wrote user data to Firestore.`);

        // --- 4. Stripeの顧客を作成 ---
        console.log(`[API DIAGNOSTIC] 4. Creating Stripe Customer for email: ${email}`);
        const customer = await stripe.customers.create({
            email: email,
            name: storeName,
            metadata: {
                firebaseUID: userRecord.uid,
            },
        });
        console.log(`[API DIAGNOSTIC] 4-Success. Successfully created Stripe Customer with ID: ${customer.id}`);

        // --- 5. Stripeの決済セッションを作成 ---
        const priceId = process.env.STRIPE_PRICE_ID;"price_1SAz0cJlUiZ4txnKRWvZQy4M"
        if (!priceId) {
            throw new Error('Stripe Price ID is not configured in environment variables.');
        }

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

        // --- 6. 決済ページのURLを返す ---
        res.status(200).json({ sessionId: session.id });

    } catch (error: any) {
        // --- 診断ログ 3 (最重要) ---
        // エラーが発生した場合、その詳細をすべて記録
        console.error("!!!!!!!!!! [API ERROR] !!!!!!!!!!");
        console.error("An error occurred during partner signup process:");
        console.error("Error Code:", error.code);
        console.error("Error Message:", error.message);
        console.error("Full Error Object:", error);
        console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        
        res.status(500).json({ error: error.message || 'An unexpected error occurred.' });
    }
}