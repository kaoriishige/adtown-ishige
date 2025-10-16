import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '../../../lib/firebase-admin';
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
            const userDocRef = adminDb.collection('users').doc(firebaseUid);
            const userDoc = await userDocRef.get();
            const userData = userDoc.data();
            stripeCustomerId = userData?.stripeCustomerId;
            const existingRoles: string[] = userData?.roles || [];

            // ★★★ ここからがエラー修正の核心部分です ★★★
            // 顧客IDが存在する場合、Stripe側で本当に有効か、削除済みでないかを確認します。
            if (stripeCustomerId) {
                try {
                    const customer = await stripe.customers.retrieve(stripeCustomerId);
                    // Stripeから取得した顧客情報が「削除済み」の場合、エラーを発生させて再作成フローに進ませる
                    if (customer.deleted) {
                        throw new Error('Stripe customer is deleted');
                    }
                    console.log(`[Subscribe API] 既存のStripe顧客ID (${stripeCustomerId}) は有効です。`);
                } catch (error: any) {
                    // 「顧客が存在しない」エラーまたは「削除済み」エラーの場合、新しい顧客を作成する
                    console.warn(`[Subscribe API] 警告: 既存のStripe顧客ID (${stripeCustomerId}) が無効か削除済みでした。新しい顧客を再作成します。`);
                    const newCustomer = await stripe.customers.create({ email, name: companyName || user.displayName, metadata: { firebaseUid } });
                    stripeCustomerId = newCustomer.id;
                    // Firestoreの顧客IDを新しいものに更新
                    await userDocRef.update({ stripeCustomerId, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
                    console.log(`[Subscribe API] 新しいStripe顧客ID (${stripeCustomerId}) を作成し、Firestoreを更新しました。`);
                }
            } else {
                // Stripe Customer IDがFirestoreにない場合、新規作成
                const newCustomer = await stripe.customers.create({ email, name: companyName || user.displayName, metadata: { firebaseUid } });
                stripeCustomerId = newCustomer.id;
                await userDocRef.set({ stripeCustomerId, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
                 console.log(`[Subscribe API] 新規Stripe顧客ID (${stripeCustomerId}) を作成し、Firestoreを更新しました。`);
            }
            // ★★★ ここまでがエラー修正の核心部分です ★★★
            
            sessionMetadata.firebaseUid = firebaseUid;
            
            const rolesToAdd: string[] = [];
            if (isAdverService && !existingRoles.includes('adver')) {
                rolesToAdd.push('adver');
            }
            if (isRecruitService && !existingRoles.includes('recruit')) {
                rolesToAdd.push('recruit');
            }
            
            if (rolesToAdd.length > 0) {
                 await userDocRef.update({
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
                
                const authUser = await adminAuth.createUser({ email, password, displayName: companyName });
                firebaseUid = authUser.uid;

                const newCustomer = await stripe.customers.create({ email, name: companyName, metadata: { firebaseUid } });
                stripeCustomerId = newCustomer.id;
                
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
                    roles: initialRoles, 
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                }, { merge: true });
                
                sessionMetadata = { 
                    ...req.body, 
                    is_new_user: 'true', 
                    serviceType, 
                    firebaseUid,
                    companyName: companyName,
                    address: address,
                    phoneNumber: phoneNumber,
                };

            } else {
                throw error;
            }
        }
        
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





