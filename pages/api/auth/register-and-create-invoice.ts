import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import getStripeAdmin from '@/lib/stripe-admin';
import admin from 'firebase-admin';

// --- 発行元情報 ---
const ISSUER_TIN = process.env.ISSUER_TIN || 'T7060001012602'; // インボイス番号
const ISSUER_ADDRESS = '栃木県那須塩原市石林698-35';

const BANK_TRANSFER_DETAILS_JAPANESE = `
【お振込先】
銀行名：栃木銀行
支店名：西那須野支店
口座種別：普通
口座番号：7287311
口座名義：株式会社adtown 代表取締役 石下かをり
(カブシキガイシャアドタウン ダイヒョウトリシマリヤク イシゲカヲリ)

発行元: 株式会社adtown
登録番号: ${ISSUER_TIN}
住所: ${ISSUER_ADDRESS}
※振込手数料はお客様にてご負担をお願い申し上げます。
`;

const formatPhoneNumberForFirebase = (phoneNumber: string): string | undefined => {
    if (!phoneNumber) return undefined;
    if (phoneNumber.startsWith('0')) return `+81${phoneNumber.substring(1)}`;
    if (phoneNumber.startsWith('+')) return phoneNumber;
    return phoneNumber;
};

/**
 * Stripe顧客IDが無効な場合に再作成するフォールバックロジックを含む。
 */
const getOrCreateUserAndStripeCustomer = async (data: {
    email: string;
    password?: string;
    companyName: string;
    address: string;
    contactPerson: string;
    phoneNumber: string;
    serviceType: string;
}): Promise<{ user: admin.auth.UserRecord; customerId: string }> => {
    const { email, password, companyName, address, contactPerson, phoneNumber, serviceType } = data;
    const stripe = getStripeAdmin();
    let user: admin.auth.UserRecord;

    // 1. Firebase Authユーザーの作成または取得
    try {
        user = await adminAuth.getUserByEmail(email);
    } catch (err: any) {
        if (err.code === 'auth/user-not-found') {
            if (!password) throw new Error('新規ユーザーの登録にはパスワードが必要です。');
            user = await adminAuth.createUser({
                email,
                password,
                displayName: contactPerson,
                phoneNumber: formatPhoneNumberForFirebase(phoneNumber),
            });
        } else {
            throw err;
        }
    }

    const userDocRef = adminDb.collection('users').doc(user.uid);
    const snapshot = await userDocRef.get();
    let customerId = snapshot.data()?.stripeCustomerId;
    let shouldUpdateFirestore = !customerId;

    // 2. Stripe顧客IDの検証と再作成（★修正点: StripeIDが無効だった場合のフォールバック）
    if (customerId) {
        try {
            // 顧客IDが存在するかStripeに確認
            await stripe.customers.retrieve(customerId); 
        } catch (e: any) {
            // "No such customer" エラーの場合
            if (e.type === 'StripeInvalidRequestError' && e.code === 'resource_missing') {
                console.warn(`Stripe customer ${customerId} not found. Recreating customer for user ${user.uid}.`);
                customerId = null; // IDを無効にし、再作成をトリガー
            } else {
                // その他のStripeエラーは再スロー
                throw e; 
            }
        }
    }

    // 3. 顧客IDが存在しない場合は新規作成
    if (!customerId) {
        const newCustomer = await stripe.customers.create({
            email,
            name: companyName,
            phone: phoneNumber,
            address: { country: 'JP', line1: address },
            metadata: { firebaseUid: user.uid },
        });
        customerId = newCustomer.id;
        shouldUpdateFirestore = true;
    }

    // 4. Firestoreのユーザーデータ更新
    const dataToStore: { [key: string]: any } = {
        uid: user.uid,
        email,
        displayName: contactPerson,
        companyName,
        address,
        phoneNumber,
        stripeCustomerId: customerId,
        roles: admin.firestore.FieldValue.arrayUnion(serviceType),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    if (!snapshot.exists) {
        dataToStore.createdAt = admin.firestore.FieldValue.serverTimestamp();
    }
    if (shouldUpdateFirestore) {
        await userDocRef.set(dataToStore, { merge: true });
    }


    return { user, customerId };
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
): Promise<void> {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        res.status(405).end('Method Not Allowed');
        return;
    }

    const adAnnualPriceId = process.env.STRIPE_AD_ANNUAL_PRICE_ID;
    const jobAnnualPriceId = process.env.STRIPE_JOB_ANNUAL_PRICE_ID;
    if (!adAnnualPriceId || !jobAnnualPriceId) {
        res.status(500).json({ error: 'サーバー設定が不完全です。' });
        return;
    }

    try {
        const { serviceType, companyName, address, contactPerson, phoneNumber, email, password } = req.body;

        if (!['adver', 'recruit'].includes(serviceType)) {
            res.status(400).json({ error: `無効なサービスタイプです: ${serviceType}` });
            return;
        }

        const missingFields = ['serviceType', 'companyName', 'address', 'contactPerson', 'phoneNumber', 'email']
            .filter(f => !req.body[f]);
        
        // 既存ユーザーか新規ユーザーかを判定し、新規ならpasswordを必須に追加
        if (!password) {
            try {
                await adminAuth.getUserByEmail(email);
            } catch (e: any) {
                if (e.code === 'auth/user-not-found') {
                     missingFields.push('password');
                }
            }
        }

        if (missingFields.length > 0) {
            res.status(400).json({ error: `必須項目が不足しています: ${missingFields.join(', ')}` });
            return;
        }

        const priceId = serviceType === 'adver' ? adAnnualPriceId : jobAnnualPriceId;
        const productName = serviceType === 'adver' ? '広告パートナー 年間利用料' : 'AI求人パートナー 年間利用料';

        const { user, customerId } = await getOrCreateUserAndStripeCustomer({
            companyName,
            address,
            contactPerson,
            phoneNumber,
            email,
            password,
            serviceType,
        });

        const stripe = getStripeAdmin();

        // 🧾 銀行振込付き請求書作成
        const invoice = await stripe.invoices.create({
            customer: customerId,
            collection_method: 'send_invoice',
            days_until_due: 30,
            footer: BANK_TRANSFER_DETAILS_JAPANESE,
            auto_advance: false,
        });

        await stripe.invoiceItems.create({
            customer: customerId,
            price: priceId,
            invoice: invoice.id,
            description: productName,
        });

        const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);

        await adminDb.collection('users').doc(user.uid).set({
            [`${serviceType}SubscriptionStatus`]: 'pending_invoice',
            stripeInvoiceId: finalizedInvoice.id,
        }, { merge: true });

        // ✅ Stripe PDF URL生成待ち (4秒)
        const wait = (ms: number): Promise<void> =>
            new Promise<void>((resolve): void => {
                setTimeout(resolve, ms);
            });

        let pdfUrl = finalizedInvoice.invoice_pdf;
        if (!pdfUrl) {
            await wait(4000);
            pdfUrl = (await stripe.invoices.retrieve(finalizedInvoice.id)).invoice_pdf;
        }

        if (!pdfUrl) throw new Error('Stripe請求書PDFが生成されませんでした。');

        res.status(200).json({ success: true, pdfUrl });

    } catch (e: any) {
        console.error('[Invoice API Error]', e);
        // Stripeエラーの場合、ユーザーフレンドリーなメッセージを返す
        const errorMessage = e.type === 'StripeInvalidRequestError' && e.message.includes('No such customer') 
            ? 'Stripe顧客情報に問題が発生しました。再度お試しください。' 
            : e.message || '不明なエラー';
            
        res.status(500).json({ error: errorMessage });
    }
}

























