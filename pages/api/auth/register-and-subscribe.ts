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

        // ✅ prefer-const エラー修正
        const isAdverService = serviceType === 'adver';
        const isRecruitService = serviceType === 'recruit';

        try {
            // 既存ユーザー確認
            const user = await adminAuth.getUserByEmail(email);
            firebaseUid = user.uid;
            console.log(`[Subscribe API] 既存ユーザーを検出: ${firebaseUid}`);

            const userDocRef = adminDb.collection('users').doc(firebaseUid);
            const userDoc = await userDocRef.get();
            const userData = userDoc.data();
            stripeCustomerId = userData?.stripeCustomerId;
            const existingRoles: string[] = userData?.roles || [];

            // --- Stripe顧客確認 ---
            if (stripeCustomerId) {
                try {
                    const customer = await stripe.customers.retrieve(stripeCustomerId);
                    if ((customer as any).deleted) {
                        throw new Error('Stripe customer is deleted');
                    }
                    console.log(`[Subscribe API] 既存Stripe顧客ID (${stripeCustomerId}) は有効です。`);
                } catch {
                    console.warn(`[Subscribe API] 既存Stripe顧客ID (${stripeCustomerId}) が無効または削除済み。再作成します。`);
                    const newCustomer = await stripe.customers.create({
                        email,
                        name: companyName || user.displayName,
                        metadata: { firebaseUid },
                    });
                    stripeCustomerId = newCustomer.id;
                    await userDocRef.update({
                        stripeCustomerId,
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    });
                }
            } else {
                const newCustomer = await stripe.customers.create({
                    email,
                    name: companyName || user.displayName,
                    metadata: { firebaseUid },
                });
                stripeCustomerId = newCustomer.id;
                await userDocRef.set(
                    {
                        stripeCustomerId,
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    },
                    { merge: true }
                );
            }

            sessionMetadata.firebaseUid = firebaseUid;

            const rolesToAdd: string[] = [];
            if (isAdverService && !existingRoles.includes('adver')) rolesToAdd.push('adver');
            if (isRecruitService && !existingRoles.includes('recruit')) rolesToAdd.push('recruit');

            if (rolesToAdd.length > 0) {
                await userDocRef.update({
                    roles: admin.firestore.FieldValue.arrayUnion(...rolesToAdd),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
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

                const authUser = await adminAuth.createUser({
                    email,
                    password,
                    displayName: companyName,
                });
                firebaseUid = authUser.uid;

                const newCustomer = await stripe.customers.create({
                    email,
                    name: companyName,
                    metadata: { firebaseUid },
                });
                stripeCustomerId = newCustomer.id;

                const initialRoles: string[] = [];
                if (isAdverService) initialRoles.push('adver');
                if (isRecruitService) initialRoles.push('recruit');

                await adminDb
                    .collection('users')
                    .doc(firebaseUid)
                    .set(
                        {
                            uid: firebaseUid,
                            email,
                            companyName: companyName || '',
                            address: address || '',
                            phoneNumber: phoneNumber || '',
                            stripeCustomerId,
                            roles: initialRoles,
                            createdAt: admin.firestore.FieldValue.serverTimestamp(),
                        },
                        { merge: true }
                    );

                sessionMetadata = {
                    ...req.body,
                    is_new_user: 'true',
                    serviceType,
                    firebaseUid,
                    companyName,
                    address,
                    phoneNumber,
                };
            } else {
                throw error;
            }
        }

        // ✅ 成功時URL修正：「partner/login」へ遷移
        if (isNewUser) {
            successUrl = `${NEXT_PUBLIC_BASE_URL}/partner/login?new=1`;
        } else {
            successUrl = `${NEXT_PUBLIC_BASE_URL}/partner/login`;
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






