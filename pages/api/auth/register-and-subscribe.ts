import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import getStripeAdmin from '../../../lib/stripe-admin';
import * as admin from 'firebase-admin'; // FirestoreのFieldValueのためにインポート

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

    const { companyName, email, password, serviceType, billingCycle, address, phoneNumber } = req.body ?? {};

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
        let firebaseUid: string;
        let sessionMetadata: { [key: string]: string } = { serviceType };
        let successUrl: string;
        let isNewUser = false;
        let isAdverService = serviceType === 'adver';
        let isRecruitService = serviceType === 'recruit';

        try {
            // 既存ユーザーの確認
            const user = await adminAuth.getUserByEmail(email);
            firebaseUid = user.uid;
            console.log(`[Subscribe API] 既存ユーザーを検出: ${firebaseUid}`);
            const userDoc = await adminDb.collection('users').doc(firebaseUid).get();
            stripeCustomerId = userDoc.data()?.stripeCustomerId;
            const existingRoles: string[] = userDoc.data()?.roles || []; // 既存のロールを取得

            // Stripe Customer IDがない場合、作成
            if (!stripeCustomerId) {
                const newCustomer = await stripe.customers.create({ email, name: companyName || user.displayName, metadata: { firebaseUid } });
                stripeCustomerId = newCustomer.id;
                // Firestoreを更新
                await adminDb.collection('users').doc(firebaseUid).set({ stripeCustomerId, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
            }
            sessionMetadata.firebaseUid = firebaseUid;
            
            // 【★修正点★】既存ユーザーが追加サービスに申し込む場合、rolesに追記
            const rolesToAdd: string[] = [];
            if (isAdverService && !existingRoles.includes('adver')) {
                rolesToAdd.push('adver');
            }
            if (isRecruitService && !existingRoles.includes('recruit')) {
                rolesToAdd.push('recruit');
            }
            
            if (rolesToAdd.length > 0) {
                 // arrayUnionで新しいロールのみを効率的に追記
                 await adminDb.collection('users').doc(firebaseUid).update({
                    roles: admin.firestore.FieldValue.arrayUnion(...rolesToAdd),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                 });
                 console.log(`[Subscribe API] 既存ユーザー ${firebaseUid} にロール [${rolesToAdd.join(', ')}] を追加しました。`);
            }
            
        } catch (error: any) {
            if (error.code === 'auth/user-not-found') {
                isNewUser = true;
                console.log('[Subscribe API] 新規ユーザーとして処理します。');
                if (!password) {
                    return res.status(400).json({ error: '新規ユーザーの登録にはパスワードが必要です。' });
                }
                
                // 1. 新規ユーザーをFirebase Authに登録
                const authUser = await adminAuth.createUser({ email, password, displayName: companyName });
                firebaseUid = authUser.uid;

                // 2. Stripe Customerを作成
                const newCustomer = await stripe.customers.create({ email, name: companyName, metadata: { firebaseUid } });
                stripeCustomerId = newCustomer.id;
                
                // 3. 【新規ユーザーのロール設定】Firestoreに初期データと roles を書き込む
                let initialRoles: string[] = [];
                if (isAdverService) initialRoles.push('adver');
                if (isRecruitService) initialRoles.push('recruit');
                
                await adminDb.collection('users').doc(firebaseUid).set({
                    uid: firebaseUid,
                    email: email,
                    companyName: companyName || '',
                    address: address || '',
                    phoneNumber: phoneNumber || '',
                    stripeCustomerId: stripeCustomerId,
                    // ★ roles を初期サービスタイプに基づいて設定
                    roles: initialRoles.length > 0 ? initialRoles : admin.firestore.FieldValue.arrayUnion(), 
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    // statusはStripe Webhookで更新されるが、初期値を設定
                    // recruitSubscriptionStatus: 'trialing' (Webhookが担当)
                }, { merge: true });
                
                sessionMetadata = { 
                    ...req.body, 
                    is_new_user: 'true', 
                    serviceType, 
                    firebaseUid,
                    // companyName, address, phoneNumber などの追加情報をメタデータに含める
                    companyName: companyName,
                    address: address,
                    phoneNumber: phoneNumber,
                };

            } else {
                throw error;
            }
        }
        
        // Determine the correct dashboard URL
        if (isNewUser) {
            // 新規登録成功後、ユーザーにダッシュボードへのアクセスを促すウェルカムページへリダイレクト
            successUrl = `${NEXT_PUBLIC_BASE_URL}/partner/welcome?serviceType=${serviceType}&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password || '')}`;
        } else {
            successUrl = serviceType === 'recruit'
                ? `${NEXT_PUBLIC_BASE_URL}/recruit/dashboard`
                : `${NEXT_PUBLIC_BASE_URL}/partner/dashboard`;
        }

        // Stripe Checkout Sessionを作成し、決済へ誘導
        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            customer: stripeCustomerId,
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: successUrl,
            cancel_url: req.headers.referer || `${NEXT_PUBLIC_BASE_URL}/`,
            metadata: sessionMetadata,
            // setup_future_usage: 'off_session', // 必要に応じて
        });
        
        return res.status(200).json({ sessionId: session.id, url: session.url });

    } catch (e: any) {
        console.error('[Subscribe API] エラー:', e);
        // 新規ユーザー登録がAuthで成功し、Firestoreで失敗した場合、Authユーザーを削除するリカバリロジックを検討する必要があるが、ここでは省略
        return res.status(500).json({ error: e.message || 'サーバー内部エラー' });
    }
}





