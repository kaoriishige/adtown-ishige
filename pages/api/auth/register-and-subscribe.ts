import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import getStripeAdmin from '@/lib/stripe-admin';
import * as admin from 'firebase-admin';

// 💡 外部URLを参照するための環境変数（Next.js側で設定されていることを想定）
const NEXT_PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || `https://${process.env.VERCEL_URL}` || 'http://localhost:3000';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).end('Method Not Allowed');
    }

    // 1. サーバー設定チェック (エラーの原因箇所を明確化)
    const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
    const RECRUIT_MONTHLY_PRICE_ID = process.env.STRIPE_JOB_PRICE_ID;
    const RECRUIT_ANNUAL_PRICE_ID = process.env.STRIPE_JOB_ANNUAL_PRICE_ID;
    
    const priceMapEnv = {
        adver_monthly: process.env.STRIPE_AD_PRICE_ID,
        adver_annual: process.env.STRIPE_AD_ANNUAL_PRICE_ID,
        recruit_monthly: RECRUIT_MONTHLY_PRICE_ID,
        recruit_annual: RECRUIT_ANNUAL_PRICE_ID,
    };

    const missingKeys: string[] = [];
    if (!STRIPE_SECRET_KEY) missingKeys.push('STRIPE_SECRET_KEY');
    if (!priceMapEnv.recruit_monthly) missingKeys.push('STRIPE_JOB_PRICE_ID');
    if (!priceMapEnv.recruit_annual) missingKeys.push('STRIPE_JOB_ANNUAL_PRICE_ID');

    if (missingKeys.length > 0) {
        console.error(`[Subscribe API] サーバー設定エラー: 環境変数が不足しています: ${missingKeys.join(', ')}`);
        return res.status(500).json({ error: `サーバー設定エラー: 必要な決済環境変数が不足しています (${missingKeys.join(', ')})` });
    }
    
    const { email, password, serviceType, billingCycle, address, contactPerson, phoneNumber, trialEndDate, companyName } = req.body ?? {};
    const stripe = getStripeAdmin();
    
    let user: admin.auth.UserRecord | null = null;
    let customerId: string | null = null;
    let snapshot: admin.firestore.DocumentSnapshot<admin.firestore.DocumentData> | undefined;
    let isNewUser = false;

    // Price IDの決定
    const priceKey = `${serviceType}_${billingCycle}` as keyof typeof priceMapEnv;
    const priceId = priceMapEnv[priceKey];

    if (!priceId) {
        return res.status(500).json({ error: `Price ID が未設定です: ${priceKey}` });
    }
    
    const isAdverService = serviceType === 'adver';
    const isRecruitService = serviceType === 'recruit';

    try {
        // --- 1. Firebase Authユーザーの作成または取得 (Authに仮登録) ---
        try {
            // 既存ユーザーを検索
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
        const successUrl = `${NEXT_PUBLIC_BASE_URL}/partner/login?payment=success&user=${user.uid}`;
        const cancelUrl = `${NEXT_PUBLIC_BASE_URL}/cancel`;

        const checkoutSession = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'subscription',
            customer: customerId,
            line_items: [{ price: priceId, quantity: 1 }],
            
            // 無料期間を無効化
            subscription_data: {
                // trial_end: trialEndDate, // クライアント側で削除済
                metadata: { firebaseUid: user.uid, serviceType, billingCycle }
            },
            success_url: successUrl, // 決済完了後、ログインページへリダイレクト
            cancel_url: cancelUrl,
            metadata: { firebaseUid: user.uid }
        });
        
        // --- 4. 成功した場合のみ、Firestoreに本登録 ---
        // 決済セッション作成が成功したため、Firestoreに永続化する
        const rolesToAdd: string[] = [];
        if (isAdverService && !(snapshot?.data()?.roles || []).includes('adver')) rolesToAdd.push('adver');
        if (isRecruitService && !(snapshot?.data()?.roles || []).includes('recruit')) rolesToAdd.push('recruit');

        const dataToStore: { [key: string]: any } = {
            uid: user.uid,
            email,
            displayName: contactPerson,
            companyName: companyName || snapshot?.data()?.companyName || '',
            address: address || snapshot?.data()?.address || '',
            phoneNumber: phoneNumber || snapshot?.data()?.phoneNumber || '',
            stripeCustomerId: customerId,
            roles: rolesToAdd.length > 0 ? admin.firestore.FieldValue.arrayUnion(...rolesToAdd) : snapshot?.data()?.roles,
            [`${serviceType}SubscriptionStatus`]: 'pending_checkout', // 決済セッション作成済み
            stripeSubscriptionId: checkoutSession.subscription, // サブスクリプションIDを記録 (後でWebhookで更新)
            createdAt: snapshot?.exists ? snapshot.data()!.createdAt : admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        // 既存ユーザーの場合は merge:true
        await userDocRef.set(dataToStore, { merge: true });
        
        // --- 5. 決済ページへのリダイレクト情報を返す ---
        res.status(200).json({ sessionId: checkoutSession.id, success: true });

    } catch (e: any) {
        // 🚨 6. エラーが発生した場合、Authの仮ユーザーをクリーンアップする (重要)
        // isNewUserがtrue、かつFirestoreにドキュメントがない場合（仮登録の状態）のみ削除
        if (user && isNewUser && snapshot && !snapshot.exists) { 
            await adminAuth.deleteUser(user.uid).catch(console.error); 
        }

        console.error('[Subscribe API Critical Error]', e);
        res.status(500).json({ error: e.message || '決済処理中にシステムエラーが発生しました。' });
    }
}







