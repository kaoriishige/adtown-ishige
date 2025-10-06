import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '../../../lib/firebase-admin'; 
import getStripeAdmin from '../../../lib/stripe-admin'; 

// クレジットカード決済（月払い）用の料金ID
const AD_PRICE_ID = process.env.STRIPE_AD_PRICE_ID;
const JOB_PRICE_ID = process.env.STRIPE_JOB_PRICE_ID;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).end();
    }

    if (!AD_PRICE_ID || !JOB_PRICE_ID) {
        console.error("Stripe Price ID is missing from .env.local for monthly subscription.");
        return res.status(500).json({ error: 'サーバー設定エラー: 月額料金IDが設定されていません。' });
    }

    const { 
        companyName, address, contactPerson, phoneNumber, email, password, 
        serviceType
    } = req.body;
    
    let user;
    let cleanupUser = false; 
    let priceId = serviceType === 'recruit' ? JOB_PRICE_ID : AD_PRICE_ID;

    try {
        try {
            user = await adminAuth.getUserByEmail(email);
        } catch (error: any) {
            if (error.code === 'auth/user-not-found') {
                user = await adminAuth.createUser({ email, password, displayName: contactPerson });
                cleanupUser = true;
            } else { throw error; }
        }

        const userDocRef = adminDb.collection('users').doc(user.uid);
        if (!(await userDocRef.get()).exists) {
            await userDocRef.set({ email, displayName: contactPerson, companyName, address, phoneNumber, stripeCustomerId: null, roles: ['partner'], createdAt: new Date() });
        }

        const userData = (await userDocRef.get()).data();
        let customerId = userData?.stripeCustomerId;
        const stripe = getStripeAdmin();

        if (!customerId) {
            const customer = await stripe.customers.create({ email: user.email, name: companyName, address: { line1: address }, metadata: { firebaseUid: user.uid } });
            customerId = customer.id;
            await userDocRef.update({ stripeCustomerId: customerId });
        }

        // ★★★【最終修正】URLを環境変数に依存しない固定値に変更しました ★★★
        const success_url = 'https://minna-no-nasu-app.netlify.app/partner/login';
        const cancel_url = 'https://minna-no-nasu-app.netlify.app/partner/signup';

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            customer: customerId,
            line_items: [{ price: priceId, quantity: 1 }],
            mode: 'subscription',
            success_url,
            cancel_url,
            subscription_data: { metadata: { firebaseUid: user.uid, serviceType } }
        });

        res.status(200).json({ sessionId: session.id });

    } catch (e: any) {
        console.error('Subscription creation error:', e);
        if (cleanupUser && user) {
            await adminAuth.deleteUser(user.uid).catch(err => console.error("Cleanup user failed:", err));
        }
        res.status(500).json({ error: `決済処理に失敗しました: ${e.message}` });
    }
}