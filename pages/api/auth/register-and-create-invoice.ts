import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '../../../lib/firebase-admin';
import getStripeAdmin from '../../../lib/stripe-admin';
import Stripe from 'stripe';
import admin from 'firebase-admin';

// 環境変数からStripeの年間価格IDを取得
const AD_PRICE_ID = process.env.STRIPE_AD_ANNUAL_PRICE_ID;
const JOB_PRICE_ID = process.env.STRIPE_JOB_ANNUAL_PRICE_ID;

// 請求書に記載する振込先情報
const BANK_TRANSFER_DETAILS_JAPANESE = `
-----------------------------------------
【お振込先】
銀行名：栃木銀行
支店名：西那須野支店
口座種別：普通
口座番号：7287311
口座名義：株式会社adtown 代表取締役 石下かをり
          カブシキカイシャアドタウン ダイヒョウトリシマリヤク イシゲカヲリ
-----------------------------------------
※恐れ入りますが、振込手数料はお客様にてご負担ください。
`;

// PDF生成の待機時間用
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * 【共通処理】Firebaseユーザー/Stripe顧客を取得・作成し、IDの有効性を検証します。
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
    const roleToSet = serviceType === 'ad' ? 'adver' : serviceType; 
    const stripe = getStripeAdmin();

    // 1. Firebaseユーザーの取得または作成
    try {
        user = await adminAuth.getUserByEmail(email);
        console.log(`[Invoice] 既存のFirebaseユーザーを検出: ${user.uid}`);
    } catch (err: any) {
        if (err.code === 'auth/user-not-found') {
            if (!password) throw new Error('新規ユーザーにはパスワードが必要です。');
            user = await adminAuth.createUser({ email, password, displayName: contactPerson });
            console.log(`[Invoice] 新規Firebaseユーザーを作成: ${user.uid}`);
        } else { throw err; }
    }

    const userDocRef = adminDb.collection('users').doc(user.uid);
    const snapshot = await userDocRef.get();
    let customerId = snapshot.data()?.stripeCustomerId;

    // 2. Stripe顧客IDの有効性を検証し、必要であれば再作成
    if (customerId) {
        try {
            const customer = await stripe.customers.retrieve(customerId);
            if (customer.deleted) {
                console.warn(`Stripe顧客(${customerId})は削除されています。再作成します。`);
                customerId = null; // 削除済みの顧客は無効
            }
        } catch (error) {
            console.warn(`無効なStripe顧客ID(${customerId})を検出しました。再作成します。`);
            customerId = null; // 無効なIDをリセットして再作成フローへ
        }
    }

    // 3. Stripe顧客が存在しない、または無効だった場合に新規作成
    if (!customerId) {
        const newCustomer = await stripe.customers.create({
            email, 
            name: companyName, 
            address: { 
                country: 'JP', // 国コードを日本に設定
                line1: address 
            }, 
            metadata: { firebaseUid: user.uid },
        });
        customerId = newCustomer.id;
        console.log(`[Invoice] 新規Stripe顧客を作成しました: ${customerId}`);
    } else {
        console.log(`[Invoice] 既存のStripe顧客IDを再利用: ${customerId}`);
    }

    // 4. Firestoreユーザー情報の更新・作成
    const dataToStore = {
        uid: user.uid, email, displayName: contactPerson, companyName, address, phoneNumber,
        stripeCustomerId: customerId,
        roles: admin.firestore.FieldValue.arrayUnion(roleToSet),
    };

    if (!snapshot.exists) {
        await userDocRef.set({ ...dataToStore, createdAt: admin.firestore.FieldValue.serverTimestamp() });
        console.log('[Invoice] Firestoreに新規ユーザーデータを保存しました。');
    } else {
        await userDocRef.update(dataToStore);
        console.log('[Invoice] Firestoreの既存ユーザーデータを更新しました。');
    }

    return { user, customerId };
};


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).end();

    if (!AD_PRICE_ID || !JOB_PRICE_ID) {
        return res.status(500).json({ error: 'サーバー設定エラー: Stripeの料金IDがありません。' });
    }

    const { serviceType, ...rest } = req.body;

    if (!rest.companyName || !rest.address || !rest.contactPerson || !rest.phoneNumber || !rest.email || !rest.password || !serviceType) {
        return res.status(400).json({ error: '必須項目が不足しています。' });
    }

    if (!['recruit', 'ad'].includes(serviceType)) {
        return res.status(400).json({ error: 'サービスタイプが不正です。' });
    }

    const priceId = serviceType === 'recruit' ? JOB_PRICE_ID : AD_PRICE_ID;
    
    try {
        const { user, customerId } = await getOrCreateUserAndStripeCustomer({ ...rest, serviceType });
        
        if (!user || !customerId) {
            throw new Error('ユーザーまたは顧客の作成に失敗しました。');
        }

        const stripe = getStripeAdmin();
        const roleToSet = serviceType === 'ad' ? 'adver' : serviceType;
        const description = serviceType === 'recruit' ? 'AI求人サービス 年間利用料' : '広告パートナー 年間利用料';

        // --- 請求書作成 (銀行振込のみ) ---
        const invoice = await stripe.invoices.create({
            customer: customerId,
            collection_method: 'send_invoice',
            days_until_due: 30,
            description: `${description} (${rest.companyName} 様)`, // 請求書の概要を日本語で設定
            footer: BANK_TRANSFER_DETAILS_JAPANESE,
            auto_advance: false, // PDF生成を確実にするため自動確定しない
        });

        // 請求書にアイテム（商品）を追加
        await stripe.invoiceItems.create({
            customer: customerId,
            price: priceId,
            invoice: invoice.id,
            description: description, // 品目名も日本語で設定
        });

        // 請求書を確定し、メールで送信
        const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);
        const sentInvoice = await stripe.invoices.sendInvoice(finalizedInvoice.id);

        // Firestoreのサブスクリプションステータスを更新
        await adminDb.collection('users').doc(user.uid).set({
            [`${roleToSet}SubscriptionStatus`]: 'pending_invoice',
        }, { merge: true });

        // PDFのURLが即時生成されない場合があるため、少し待機して再取得
        let pdfUrl = sentInvoice.invoice_pdf;
        if (!pdfUrl) {
            await sleep(4000); 
            const retrievedInvoice = await stripe.invoices.retrieve(sentInvoice.id);
            pdfUrl = retrievedInvoice.invoice_pdf;
        }

        if (!pdfUrl) {
            throw new Error('Stripe請求書PDFがまだ生成されていません。時間をおいて再度お試しください。');
        }

        return res.status(200).json({ success: true, pdfUrl });

    } catch (e: any) {
        console.error('Error in register-and-create-invoice:', e);
        if (e.code === 'auth/email-already-exists' && !req.body.password) {
             return res.status(409).json({ error: 'このメールアドレスは既に使用されています。' });
        }
        return res.status(500).json({
            error: `請求書作成中にエラーが発生しました: ${e.message || '不明なエラー'}`,
        });
    }
}


