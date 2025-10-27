import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import getStripeAdmin from '@/lib/stripe-admin';
import * as admin from 'firebase-admin';

// 🚨 修正: Netlifyの環境変数(process.env.URL)をフォールバックとして使用
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || process.env.URL || 'http://localhost:3000';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).end('Method Not Allowed');
    }

    // 1. 環境変数マップの定義
    const priceMapEnv = {
        adver_monthly: process.env.STRIPE_AD_PRICE_ID,
        adver_annual: process.env.STRIPE_AD_ANNUAL_PRICE_ID,
        recruit_monthly: process.env.STRIPE_JOB_PRICE_ID,
        recruit_annual: process.env.STRIPE_JOB_ANNUAL_PRICE_ID,
    };

    // サーバーのStripe Secret Keyが不足していないかを確認
    if (!process.env.STRIPE_SECRET_KEY || !process.env.NEXT_PUBLIC_BASE_URL) {
        console.error(`[Subscribe API] サーバー設定エラー: STRIPE_SECRET_KEYまたはNEXT_PUBLIC_BASE_URLが不足しています。`);
        return res.status(500).json({ error: 'サーバー設定が不完全です。主要な環境変数が不足しています。' });
    }
    
    // 2. リクエストボディの展開とPrice IDの決定
    const { email, password, serviceType, billingCycle, address, phoneNumber, trialEndDate, companyName, contactPerson } = req.body ?? {};

    if (!email || !serviceType || !billingCycle) {
        return res.status(400).json({ error: '必須項目(email, serviceType, billingCycle)が不足しています。' });
    }

    const priceKey = `${serviceType}_${billingCycle}` as keyof typeof priceMapEnv;
    const priceId = priceMapEnv[priceKey];

    if (!priceId) {
        console.error(`[Subscribe API] サーバー設定エラー: Price IDが未設定です (${priceKey})`);
        return res.status(500).json({ error: `Price ID が未設定です: ${priceKey}。デプロイ環境のPrice ID設定を確認してください。` });
    }
    
    const stripe = getStripeAdmin();
    
    let user: admin.auth.UserRecord | null = null;
    let customerId: string | null = null;
    let snapshot: admin.firestore.DocumentSnapshot<admin.firestore.DocumentData> | undefined;
    let isNewUser = false;
    
    const isAdverService = serviceType === 'adver';
    const isRecruitService = serviceType === 'recruit';

    try {
        // --- 1. Firebase Authユーザーの作成または取得 (Authに仮登録) ---
        try {
            user = await adminAuth.getUserByEmail(email);
        } catch (err: any) {
            if (err.code === 'auth/user-not-found') {
                isNewUser = true;
                if (!password) throw new Error('新規登録にはパスワードが必要です。');
                // Authに仮登録
                user = await adminAuth.createUser({ email, password, displayName: contactPerson });
            } else {
                throw err;
            }
        }
        
        // --- 2. Stripe顧客の作成または取得 ---
        const userDocRef = adminDb.collection('users').doc(user.uid);
        snapshot = await userDocRef.get();
        customerId = snapshot.data()?.stripeCustomerId;
        
        if (!customerId) {
            const name = companyName || user.displayName || email;
            const newCustomer = await stripe.customers.create({ email, name, metadata: { firebaseUid: user.uid } });
            customerId = newCustomer.id;
        }

        // --- 3. Stripe Checkout Sessionの作成 (アトミック処理の核心) ---
        const successUrl = `${BASE_URL}/partner/login?payment=success&user=${user.uid}`;
        // サービスタイプに基づいてキャンセルURLを動的に変更
        let cancelUrl: string;
        if (serviceType === 'adver') {
            cancelUrl = `${BASE_URL}/partner/signup`; // 広告パートナー
        } else if (serviceType === 'recruit') {
            cancelUrl = `${BASE_URL}/recruit`; // 求人パートナー
        } else {
            cancelUrl = `${BASE_URL}/`;
        }

        const checkoutSession = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'subscription',
            customer: customerId,
            line_items: [{ price: priceId, quantity: 1 }],
            subscription_data: {
                // trial_end: trialEndDate, // 無料期間は削除
                metadata: { firebaseUid: user.uid, serviceType, billingCycle, email, companyName, contactPerson, phoneNumber, address }
            },
            success_url: successUrl,
            cancel_url: cancelUrl, 
            metadata: { firebaseUid: user.uid }
        });
        
        // --- 4. 成功した場合のみ、Firestoreに本登録 ---
        const rolesToAdd: string[] = [];
        const existingRoles = snapshot?.data()?.roles || [];
        if (isAdverService && !existingRoles.includes('adver')) rolesToAdd.push('adver');
        if (isRecruitService && !existingRoles.includes('recruit')) rolesToAdd.push('recruit');

        const dataToStore: { [key: string]: any } = {
            uid: user.uid,
            email,
            displayName: contactPerson,
            companyName: companyName || snapshot?.data()?.companyName || '',
            address: address || snapshot?.data()?.address || '',
            phoneNumber: phoneNumber || snapshot?.data()?.phoneNumber || '',
            stripeCustomerId: customerId,
            roles: rolesToAdd.length > 0 ? admin.firestore.FieldValue.arrayUnion(...rolesToAdd) : existingRoles,
            [`${serviceType}SubscriptionStatus`]: 'pending_checkout', // 決済セッション作成済み
            stripeSubscriptionId: checkoutSession.subscription,
            createdAt: snapshot?.exists ? snapshot.data()!.createdAt : admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        await userDocRef.set(dataToStore, { merge: true });
        
        // --- 5. 決済ページへのリダイレクト情報を返す ---
        res.status(200).json({ sessionId: checkoutSession.id, success: true });

    } catch (e: any) {
        // 🚨 6. エラーが発生した場合、Authの仮ユーザーをクリーンアップ
        if (user && isNewUser && snapshot && !snapshot.exists) { 
            await adminAuth.deleteUser(user.uid).catch(console.error); 
        }
        console.error('[Subscribe API Critical Error]', e);
        res.status(500).json({ error: e.message || '決済処理中にシステムエラーが発生しました。' });
    }
}











