import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import getStripeAdmin from '../../../lib/stripe-admin';

const NEXT_PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || '';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).end('Method Not Allowed');
    }

    const priceMapEnv = {
        adver_monthly: process.env.STRIPE_AD_PRICE_ID,
        adver_annual: process.env.STRIPE_AD_ANNUAL_PRICE_ID,
        recruit_monthly: process.env.STRIPE_JOB_PRICE_ID,
        recruit_annual: process.env.STRIPE_JOB_ANNUAL_PRICE_ID,
    };

    if (!process.env.NEXT_PUBLIC_BASE_URL || Object.values(priceMapEnv).some(v => !v)) {
        console.error('[Subscribe API] サーバー設定エラー: 環境変数が不足しています。');
        return res.status(500).json({ error: 'サーバー設定が不完全です。' });
    }

    const { companyName, email, password, serviceType, billingCycle } = req.body ?? {};

    if (!email || !serviceType || !billingCycle) {
        return res.status(400).json({ error: '必須項目(email, serviceType, billingCycle)が不足しています。' });
    }

    const priceKey = `${serviceType}_${billingCycle}` as keyof typeof priceMapEnv;
    const priceId = priceMapEnv[priceKey];

    if (!priceId) {
        return res.status(500).json({ error: `Price ID が未設定です: ${priceKey}` });
    }

    try {
        const stripe = getStripeAdmin();
        let stripeCustomerId: string;
        let sessionMetadata: { [key: string]: string } = { serviceType };
        let successUrl: string;
        let isNewUser = false;

        try {
            const user = await adminAuth.getUserByEmail(email);
            const firebaseUid = user.uid;
            console.log(`[Subscribe API] 既存ユーザーを検出: ${firebaseUid}`);
            const userDoc = await adminDb.collection('users').doc(firebaseUid).get();
            stripeCustomerId = userDoc.data()?.stripeCustomerId;

            if (!stripeCustomerId) {
                const newCustomer = await stripe.customers.create({ email, name: companyName || user.displayName, metadata: { firebaseUid } });
                stripeCustomerId = newCustomer.id;
                await adminDb.collection('users').doc(firebaseUid).set({ stripeCustomerId }, { merge: true });
            }
            sessionMetadata.firebaseUid = firebaseUid;

        } catch (error: any) {
            if (error.code === 'auth/user-not-found') {
                isNewUser = true;
                console.log('[Subscribe API] 新規ユーザーとして処理します。');
                if (!password) {
                     return res.status(400).json({ error: '新規ユーザーの登録にはパスワードが必要です。' });
                }
                // For new users, create customer without metadata first
                const newCustomer = await stripe.customers.create({ email, name: companyName });
                stripeCustomerId = newCustomer.id;
                
                // Pass all registration info in session metadata
                sessionMetadata = { ...req.body, is_new_user: 'true', serviceType };

            } else {
                throw error;
            }
        }
        
        // Determine the correct dashboard URL
        if (isNewUser) {
            successUrl = `${NEXT_PUBLIC_BASE_URL}/partner/welcome?serviceType=${serviceType}&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password || '')}`;
        } else {
            successUrl = serviceType === 'recruit'
                ? `${NEXT_PUBLIC_BASE_URL}/recruit/dashboard`
                : `${NEXT_PUBLIC_BASE_URL}/partner/dashboard`;
        }

        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            customer: stripeCustomerId,
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: successUrl,
            cancel_url: req.headers.referer || `${NEXT_PUBLIC_BASE_URL}/`,
            metadata: sessionMetadata,
        });
        return res.status(200).json({ sessionId: session.id, url: session.url });

    } catch (e: any) {
        console.error('[Subscribe API] エラー:', e);
        return res.status(500).json({ error: e.message || 'サーバー内部エラー' });
    }
}





