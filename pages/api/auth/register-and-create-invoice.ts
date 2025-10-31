import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import getStripeAdmin from '@/lib/stripe-admin';
import * as admin from 'firebase-admin';

// --- 定数設定 ---
const ISSUER_TIN = process.env.ISSUER_TIN || 'T7060001012602';
const ISSUER_ADDRESS = '栃木県那須塩原市石林698-35';
const BANK_TRANSFER_DETAILS_JAPANESE = `
【お振込先】
銀行名：栃木銀行
支店名：西那須野支店
口座種別：普通
口座番号：7287311
口座名名義：株式会社adtown 代表取締役 石下かをり
(カブシキガイシャアドタウン ダイヒョウトリシマリヤク イシゲカヲリ)

発行元: 株式会社adtown
インボイス登録番号: ${ISSUER_TIN}
住所: ${ISSUER_ADDRESS}
※振込手数料はお客様にてご負担をお願い申し上げます。
※ご入金の確認が取れましたら、ログイン情報をお送りします。
`;

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || process.env.URL || 'http://localhost:3000';

// --- 電話番号をFirebase形式に変換 ---
const formatPhoneNumberForFirebase = (phoneNumber: string): string | undefined => {
    if (!phoneNumber) return undefined;
    if (phoneNumber.startsWith('0')) return `+81${phoneNumber.substring(1)}`;
    if (phoneNumber.startsWith('+')) return phoneNumber;
    return phoneNumber;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        res.status(405).end('Method Not Allowed');
        return;
    }

    const { firebaseUid, email, paymentMethod, priceId, serviceType, billingCycle } = req.body;

    // --- 必須チェック ---
    if (!firebaseUid || !email || !paymentMethod || !priceId || !serviceType) {
        return res.status(400).json({ error: '認証情報 (UID/Email) またはプラン情報が不足しています。' });
    }

    if (billingCycle && !['monthly', 'annual', 'annual_invoice'].includes(billingCycle)) {
        return res.status(400).json({ error: '無効な支払いサイクルが指定されました。' });
    }

    const stripe = getStripeAdmin();
    let user: admin.auth.UserRecord;
    let userData: admin.firestore.DocumentData;

    try {
        // --- 1. Firestoreユーザー情報取得 ---
        user = await adminAuth.getUser(firebaseUid);
        const userRef = adminDb.collection('users').doc(firebaseUid);
        const snapshot = await userRef.get();
        if (!snapshot.exists) {
            return res.status(404).json({ error: 'Firestoreにユーザー情報が見つかりません。' });
        }

        userData = snapshot.data()!;
        const companyName = userData.companyName || userData.storeName || 'Nasu Partner';
        const address = userData.address || ISSUER_ADDRESS;
        const contactPerson = userData.contactPerson || user.displayName || '担当者様';
        const phoneNumber = formatPhoneNumberForFirebase(userData.phoneNumber || user.phoneNumber || '');
        const userEmail = user.email || email;

        const productName =
            serviceType === 'adver'
                ? billingCycle === 'monthly'
                    ? '広告パートナー（月額）'
                    : '広告パートナー（年額）'
                : 'AI求人パートナー'; // ★ 求人パートナーの名称

        // --- 2. Stripe顧客を作成または再利用 ---
        let customerId = userData.stripeCustomerId;
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: userEmail,
                name: companyName,
                phone: phoneNumber,
                address: { country: 'JP', line1: address },
                metadata: { firebaseUid },
            });
            customerId = customer.id;
            await userRef.update({ stripeCustomerId: customerId });
        }

        // --- 3. 決済フロー ---
        const successUrl = serviceType === 'recruit'
          ? `${BASE_URL}/recruit/dashboard?payment_status=success`
          : `${BASE_URL}/partner/dashboard?payment_status=success`;
          
        const cancelUrl = serviceType === 'recruit'
          ? `${BASE_URL}/recruit/dashboard?payment_status=cancel`
          : `${BASE_URL}/partner/dashboard?payment_status=cancel`;


        if (paymentMethod === 'card') {
            // 🔹 クレジットカード決済 (Stripe Checkout) 🔹
            
            // NOTE: ここは mode: 'subscription' (定期支払い) を前提としています。
            // 1回払いIDが渡された場合はエラーになります。（Stripeの制約）
            const session = await stripe.checkout.sessions.create({
                mode: 'subscription', 
                payment_method_types: ['card'],
                customer: customerId,
                line_items: [{ price: priceId, quantity: 1 }],
                success_url: successUrl,
                cancel_url: cancelUrl,
                metadata: { firebaseUid, serviceType, billingCycle },
                subscription_data: { metadata: { firebaseUid, serviceType, billingCycle } },
                locale: 'ja',
            });

            await userRef.set(
                {
                    stripeSessionId: session.id,
                    paymentIntent: 'pending',
                    isPaid: false, 
                    [`${serviceType}SubscriptionStatus`]: 'pending_card',
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                },
                { merge: true }
            );

            return res.status(200).json({ sessionId: session.id });
        }

        // 🔹 銀行振込（請求書） 🔹
        if (paymentMethod === 'invoice') {
            
            // ★★★ 修正点: 一回限りの支払いとして請求書を作成するロジック ★★★
            // 既存のアクティブなサブスクリプションをキャンセル (年額請求書で上書きする)
            const activeSubs = await stripe.subscriptions.list({ customer: customerId, status: 'active', limit: 1 });
            if (activeSubs.data.length > 0) {
                await stripe.subscriptions.cancel(activeSubs.data[0].id);
            }

            // 1. 顧客に商品を追加 (Price ID は 'one_time' であることを前提とする)
            await stripe.invoiceItems.create({
                customer: customerId,
                price: priceId, // Price ID は 'type=one_time' または 'type=recurring' のどちらでも動作する
                quantity: 1,
                metadata: {
                    firebaseUid,
                    serviceType,
                    billingCycle: 'annual_invoice',
                }
            });

            // 2. 請求書を作成 (Finalizeすることで確定)
            const draftInvoice = await stripe.invoices.create({
                customer: customerId,
                collection_method: 'send_invoice',
                days_until_due: 30,
                auto_advance: false, // 自動送付はしない（手動で送る）
                metadata: {
                    firebaseUid,
                    serviceType,
                    billingCycle: 'annual_invoice',
                },
                footer: BANK_TRANSFER_DETAILS_JAPANESE, // 振込先情報をフッターに挿入
            });
            
            // 3. 請求書を確定させてPDFを取得
            const finalizedInvoice = await stripe.invoices.finalizeInvoice(draftInvoice.id);

            // Firestore更新
            await userRef.set(
                {
                    // サブスクリプションではないのでIDはクリアまたは省略
                    stripeSubscriptionId: null, 
                    stripeInvoiceId: finalizedInvoice.id,
                    isPaid: false, // 振込待ち
                    [`${serviceType}SubscriptionStatus`]: 'pending_invoice',
                    billingCycle: 'annual',
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                },
                { merge: true }
            );

            return res.status(200).json({
                success: true,
                pdfUrl: finalizedInvoice.invoice_pdf,
                bankDetails: BANK_TRANSFER_DETAILS_JAPANESE,
            });
        }

        // 🔸 その他不正な支払い方法
        return res.status(400).json({ error: '無効な支払い方法が指定されました。' });
    } catch (e: any) {
        console.error('[register-and-create-invoice Error]', e);
        const message = e.message || 'サーバーエラーが発生しました。';
        
        // StripeInvalidRequestError: The price specified is set to `type=recurring` but this field only accepts prices with `type=one_time`.
        if (e.type === 'StripeInvalidRequestError' && (e.message.includes('type=one_time') || e.message.includes('type=recurring'))) {
             return res.status(500).json({ error: `Stripeエラー: ${e.message}。プランの価格IDが「一回限り」か「定期支払い」か、設定が合っていません。Stripeダッシュボードで価格タイプをご確認ください。` });
        }
        
        return res.status(500).json({ error: message });
    }
}





























