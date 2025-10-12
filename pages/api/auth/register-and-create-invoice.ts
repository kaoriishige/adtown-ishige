import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from'@/lib/firebase-admin';
import getStripeAdmin from '../../../lib/stripe-admin';
import Stripe from 'stripe';
import admin from 'firebase-admin';

// --- 定数 ---
const BANK_TRANSFER_DETAILS_JAPANESE = `
【お振込先】
銀行名：栃木銀行
支店名：西那須野支店
口座種別：普通
口座番号：7287311
口座名義：株式会社adtown 代表取締役 石下かをり
          (カブシキガイシャアドタウン ダイヒョウトリシマリヤク イシゲカヲリ)

インボイスNo.T7060001012602

※振込手数料はお客様にてご負担をお願い申し上げます。
`;

// --- ヘルパー関数 ---
const formatPhoneNumberForFirebase = (phoneNumber: string) => {
    if (!phoneNumber) return undefined;
    if (phoneNumber.startsWith('0')) {
        return `+81${phoneNumber.substring(1)}`;
    }
    if (phoneNumber.startsWith('+')) {
        return phoneNumber;
    }
    return phoneNumber;
};

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
    
    // serviceTypeは呼び出し元で'adver' or 'recruit'に検証済みのため、そのままroleとして使用
    const roleToSet = serviceType;
    const stripe = getStripeAdmin();

    try {
        user = await adminAuth.getUserByEmail(email);
        console.log(`[Invoice] 既存のFirebaseユーザーを検出: ${user.uid}`);
    } catch (err: any) {
        if (err.code === 'auth/user-not-found') {
            if (!password) throw new Error('新規ユーザーの登録にはパスワードが必要です。');
            const formattedPhoneNumber = formatPhoneNumberForFirebase(phoneNumber);
            user = await adminAuth.createUser({ email, password, displayName: contactPerson, phoneNumber: formattedPhoneNumber });
            console.log(`[Invoice] 新規Firebaseユーザーを作成: ${user.uid}`);
        } else {
            throw err;
        }
    }

    const userDocRef = adminDb.collection('users').doc(user.uid);
    const snapshot = await userDocRef.get();
    let customerId = snapshot.data()?.stripeCustomerId;

    if (customerId) {
        try {
            const customer = await stripe.customers.retrieve(customerId);
            if ((customer as Stripe.Customer).deleted) {
                console.warn(`Stripe顧客(${customerId})は削除済みのため再作成します。`);
                customerId = null;
            }
        } catch (error) {
            console.warn(`無効なStripe顧客ID(${customerId})を検出したため再作成します。`);
            customerId = null;
        }
    }

    if (!customerId) {
        const newCustomer = await stripe.customers.create({
            email,
            name: companyName,
            phone: phoneNumber,
            address: {
                country: 'JP',
                line1: address
            },
            metadata: { firebaseUid: user.uid },
        });
        customerId = newCustomer.id;
        console.log(`[Invoice] 新規Stripe顧客を作成しました: ${customerId}`);
    } else {
        console.log(`[Invoice] 既存のStripe顧客IDを再利用: ${customerId}`);
    }

    const dataToStore: { [key: string]: any } = {
        uid: user.uid,
        email,
        displayName: contactPerson,
        companyName,
        address,
        phoneNumber,
        stripeCustomerId: customerId,
        roles: admin.firestore.FieldValue.arrayUnion(roleToSet),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    if (!snapshot.exists) {
        dataToStore.createdAt = admin.firestore.FieldValue.serverTimestamp();
    }

    await userDocRef.set(dataToStore, { merge: true });
    console.log('[Invoice] Firestoreのユーザーデータを保存/更新しました。');

    return { user, customerId };
};

// --- APIメインハンドラー ---
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).end('Method Not Allowed');
    }

    // 両方の年間プランのPrice IDを環境変数から取得
    const adAnnualPriceId = process.env.STRIPE_AD_ANNUAL_PRICE_ID;
    const jobAnnualPriceId = process.env.STRIPE_JOB_ANNUAL_PRICE_ID;

    if (!adAnnualPriceId || !jobAnnualPriceId) {
        console.error('[Invoice API] サーバー設定エラー: 年間プランのPrice IDが設定されていません。');
        return res.status(500).json({ error: 'サーバー設定が不完全です。' });
    }

    try {
        const {
            serviceType,
            companyName,
            address,
            contactPerson,
            phoneNumber,
            email,
            password
        } = req.body;
        
        // serviceTypeのバリデーション
        if (!['adver', 'recruit'].includes(serviceType)) {
            return res.status(400).json({ error: `無効なサービスタイプです: ${serviceType}` });
        }

        const requiredFields = { serviceType, companyName, address, contactPerson, phoneNumber, email };
        const missingFields = Object.entries(requiredFields).filter(([_, value]) => !value).map(([key]) => key);

        try {
            await adminAuth.getUserByEmail(email);
        } catch (error: any) {
            if (error.code === 'auth/user-not-found' && !password) {
                missingFields.push('password');
            }
        }

        if (missingFields.length > 0) {
            const errorMsg = `必須項目が不足しています: ${missingFields.join(', ')}`;
            console.error(`[Invoice API] 検証失敗。不足項目: ${missingFields.join(', ')}`);
            return res.status(400).json({ error: errorMsg });
        }
        
        // serviceTypeに応じてPrice IDと請求書の商品名を動的に設定
        let priceId: string;
        let productName: string;

        if (serviceType === 'adver') {
            priceId = adAnnualPriceId;
            productName = '広告パートナー 年間利用料';
        } else { // serviceType === 'recruit'
            priceId = jobAnnualPriceId;
            productName = 'AI求人パートナー 年間利用料';
        }

        const { user, customerId } = await getOrCreateUserAndStripeCustomer({ companyName, address, contactPerson, phoneNumber, email, password, serviceType });

        if (!user || !customerId) {
            throw new Error('ユーザーまたはStripe顧客の作成に失敗しました。');
        }

        const stripe = getStripeAdmin();

        const invoice = await stripe.invoices.create({
            customer: customerId,
            collection_method: 'send_invoice',
            days_until_due: 30,
            description: `${productName} (${companyName} 様)`,
            footer: BANK_TRANSFER_DETAILS_JAPANESE,
            auto_advance: false, // PDFダウンロードのために手動で確定させる
        });

        await stripe.invoiceItems.create({
            customer: customerId,
            price: priceId, // 動的に設定したPrice IDを使用
            invoice: invoice.id,
            description: productName, // 動的に設定した商品名を使用
        });

        const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);

        await adminDb.collection('users').doc(user.uid).set({
            [`${serviceType}SubscriptionStatus`]: 'pending_invoice', // serviceTypeを直接使用
        }, { merge: true });

        let pdfUrl = finalizedInvoice.invoice_pdf;
        // Stripe側でPDF生成に時間がかかる場合があるため、少し待ってから再取得
        if (!pdfUrl) {
            await new Promise(resolve => setTimeout(resolve, 4000));
            const retrievedInvoice = await stripe.invoices.retrieve(finalizedInvoice.id);
            pdfUrl = retrievedInvoice.invoice_pdf;
        }

        if (!pdfUrl) {
            console.error(`[Invoice API] PDFの生成に失敗しました。Invoice ID: ${finalizedInvoice.id}`);
            throw new Error('Stripe請求書PDFが生成されませんでした。時間をおいて再度お試しください。');
        }

        return res.status(200).json({ success: true, pdfUrl });

    } catch (e: any) {
        console.error('[Invoice API] エラー:', e);
        if (e.code === 'auth/email-already-exists') {
            return res.status(409).json({ error: 'このメールアドレスは既に使用されています。' });
        }
        if (e.code === 'auth/invalid-phone-number') {
            return res.status(400).json({ error: '電話番号の形式が正しくありません。' });
        }
        return res.status(500).json({
            error: `登録処理中にサーバーエラーが発生しました: ${e.message || '不明なエラー'}`,
        });
    }
}





