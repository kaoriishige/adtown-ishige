import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '../../../lib/firebase-admin';
import getStripeAdmin from '../../../lib/stripe-admin';
import admin from 'firebase-admin';

// 環境変数からStripeの価格IDを取得
const AD_PRICE_ID = process.env.STRIPE_AD_MONTHLY_PRICE_ID;
const JOB_PRICE_ID = process.env.STRIPE_RECRUIT_MONTHLY_PRICE_ID;

/**
 * 【共通処理】Firebaseユーザーを作成または取得し、Stripe顧客を作成または更新します。
 * @param data - ユーザーと企業の情報
 * @returns { user: admin.auth.UserRecord, customerId: string }
 */
const getOrCreateUserAndStripeCustomer = async (data: {
    email: string;
    password?: string;
    companyName: string;
    address: string;
    contactPerson: string;
    phoneNumber: string;
    serviceType: string;
}): Promise<{ user: admin.auth.UserRecord, customerId: string }> => {
    
    const { email, password, companyName, address, contactPerson, phoneNumber, serviceType } = data;
    let user: admin.auth.UserRecord;
    const roleToSet = serviceType === 'recruit' ? 'recruit' : 'adver';

    // 1. Firebaseユーザーの取得または作成
    try {
        user = await adminAuth.getUserByEmail(email);
        console.log(`[Stripe Subscription] 既存のFirebaseユーザーを検出: ${user.uid}`);
    } catch (err: any) {
        if (err.code === 'auth/user-not-found') {
            if (!password) throw new Error('新規ユーザーにはパスワードが必要です。');
            user = await adminAuth.createUser({ email, password, displayName: contactPerson });
            console.log(`[Stripe Subscription] 新規Firebaseユーザーを作成: ${user.uid}`);
        } else {
            throw err;
        }
    }

    // 2. Firestoreユーザー情報の取得
    const userDocRef = adminDb.collection('users').doc(user.uid);
    const snapshot = await userDocRef.get();
    let userData = snapshot.data();
    let customerId = userData?.stripeCustomerId;

    // 3. Stripe顧客の取得または作成
    const stripe = getStripeAdmin();
    if (!customerId) {
        console.log('[Stripe Subscription] Stripe顧客IDが見つからないため、新規作成します。');
        const customer = await stripe.customers.create({
            email: user.email,
            name: companyName,
            address: { line1: address },
            metadata: { firebaseUid: user.uid },
        });
        customerId = customer.id;
    } else {
        console.log(`[Stripe Subscription] 既存のStripe顧客IDを再利用: ${customerId}`);
    }

    // 4. Firestoreユーザー情報の更新・作成
    const dataToStore = {
        uid: user.uid,
        email,
        displayName: contactPerson,
        companyName,
        address,
        phoneNumber,
        stripeCustomerId: customerId,
        roles: admin.firestore.FieldValue.arrayUnion(roleToSet),
    };

    if (!snapshot.exists) {
        console.log('[Stripe Subscription] Firestoreに新規ユーザーデータを保存します。');
        await userDocRef.set({
            ...dataToStore,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    } else {
        console.log('[Stripe Subscription] Firestoreの既存ユーザーデータを更新します。');
        await userDocRef.update(dataToStore);
    }

    return { user, customerId };
};


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).end();

    if (!AD_PRICE_ID || !JOB_PRICE_ID) {
        return res.status(500).json({ error: 'サーバー設定エラー: Stripeの料金IDがありません。' });
    }
    
    const { serviceType, trialEndDate, ...rest } = req.body;

    if (!rest.email || !rest.password || !rest.companyName || !serviceType) {
        return res.status(400).json({ error: '必須項目が不足しています。' });
    }

    if (!['recruit', 'ad'].includes(serviceType)) {
        return res.status(400).json({ error: 'サービスタイプが不正です。' });
    }

    const priceId = serviceType === 'recruit' ? JOB_PRICE_ID : AD_PRICE_ID;

    try {
        // ユーザーとStripe顧客を（存在確認しつつ）取得または作成
        const { user, customerId } = await getOrCreateUserAndStripeCustomer({ ...rest, serviceType });

        const stripe = getStripeAdmin();

        // Stripe Checkoutセッションを作成
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            payment_method_types: ['card'],
            line_items: [{ price: priceId, quantity: 1 }],
            mode: 'subscription',
            success_url: `${req.headers.origin}/partner/dashboard?status=success`,
            cancel_url: `${req.headers.origin}/${serviceType === 'recruit' ? 'recruit/apply' : 'partner/ad-subscribe'}?status=cancelled`,
            subscription_data: {
                trial_end: trialEndDate, // 先行予約の場合、課金開始日を設定
                metadata: {
                    firebaseUID: user.uid,
                    serviceType: serviceType,
                }
            },
            metadata: {
                firebaseUID: user.uid,
            }
        });

        if (!session.id) {
            throw new Error('Stripeセッションの作成に失敗しました。');
        }

        return res.status(200).json({ sessionId: session.id });

    } catch (e: any) {
        console.error('Error in register-and-subscribe:', e);
        if (e.code === 'auth/email-already-exists' && !req.body.password) {
             return res.status(409).json({ error: 'このメールアドレスは既に使用されています。' });
        }
        return res.status(500).json({
            error: `決済セッションの作成中にエラーが発生しました: ${e.message || '不明なエラー'}`,
        });
    }
}
