/**
 * ============================================================
 * [FILE] /pages/api/stripe/connect.ts
 * [ROLE] Stripe Connect URL発行（エラー特定デバッグ版）
 * ============================================================
 */

import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import nookies from 'nookies';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2023-10-16' as any,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    console.log('🚀 Connect API: Request Received');

    try {
        // 1. セッションクッキーの取得
        const cookies = nookies.get({ req });
        const session = cookies.session;

        if (!session) {
            console.error('❌ Error: No session cookie found');
            return res.status(401).json({ error: 'ログインセッションが見つかりません。再ログインしてください。' });
        }

        // 2. Firebase AuthでUIDを取得
        let uid: string;
        try {
            const decodedToken = await adminAuth.verifySessionCookie(session);
            uid = decodedToken.uid;
            console.log('✅ Auth Success: UID =', uid);
        } catch (authError) {
            console.error('❌ Auth Error: Invalid session cookie');
            return res.status(401).json({ error: '認証に失敗しました。' });
        }

        // 3. FirestoreからStripeIDを確認
        const userRef = adminDb.collection('users').doc(uid);
        const userDoc = await userRef.get();
        let stripeAccountId = userDoc.data()?.stripeConnectId;

        // 4. アカウント作成または取得
        if (!stripeAccountId) {
            console.log('ℹ️ Creating new Stripe Account...');
            const account = await stripe.accounts.create({
                type: 'express',
                country: 'JP',
                capabilities: {
                    card_payments: { requested: true },
                    transfers: { requested: true },
                },
                business_type: 'individual',
            });
            stripeAccountId = account.id;
            await userRef.update({ stripeConnectId: stripeAccountId });
            console.log('✅ New Account Created:', stripeAccountId);
        }

        // 5. リダイレクトURLの生成 (http/httpsを確実に付与)
        const host = req.headers.host || 'localhost:3000';
        const protocol = host.includes('localhost') ? 'http' : 'https';
        const origin = `${protocol}://${host}`;
        console.log('🌐 Origin for Redirect:', origin);

        // 6. Stripe Onboarding Linkの発行
        const accountLink = await stripe.accountLinks.create({
            account: stripeAccountId,
            refresh_url: `${origin}/premium/dashboard`,
            return_url: `${origin}/premium/dashboard`,
            type: 'account_onboarding',
        });

        console.log('🎉 Success! URL Generated');
        return res.status(200).json({ url: accountLink.url });

    } catch (err: any) {
        console.error('💥 Critical Stripe Error:', err.message);
        return res.status(500).json({ error: err.message });
    }
}