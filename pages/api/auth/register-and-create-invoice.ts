import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '../../../lib/firebase-admin'; 
import getStripeAdmin from '../../../lib/stripe-admin'; 
import Stripe from 'stripe';

// Stripeの料金IDを環境変数から取得
const AD_PRICE_ID = process.env.STRIPE_AD_ANNUAL_PRICE_ID;
const JOB_PRICE_ID = process.env.STRIPE_JOB_ANNUAL_PRICE_ID;

// 振込先情報
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

// 待機用の関数
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).end();
    }

    // 環境変数のチェック
    if (!AD_PRICE_ID || !JOB_PRICE_ID) {
        console.error("Stripe Price ID is missing.");
        return res.status(500).json({ error: 'サーバー設定エラー: 料金IDが設定されていません。' });
    }

    const { 
        companyName, address, contactPerson, phoneNumber, email, password, 
        isExistingUser, 
        serviceType // 'ad' (広告) or 'recruit' (求人)
    } = req.body;
    
    let user;
    let cleanupUser = false; 
    let priceId = '';

    // --- サービスの決定とPrice IDの選択 ---
    if (serviceType === 'recruit') {
        priceId = JOB_PRICE_ID;
    } else if (serviceType === 'ad') {
        priceId = AD_PRICE_ID;
    } else {
        return res.status(400).json({ error: 'サービスタイプが指定されていません。' });
    }

    // --- 1. Firebaseでユーザー登録 (新規ユーザーの場合のみ) ---
    if (!isExistingUser) {
        try {
            user = await adminAuth.createUser({ email, password, displayName: contactPerson });
            cleanupUser = true; 
            
            await adminDb.collection('users').doc(user.uid).set({
                email,
                displayName: contactPerson,
                companyName,
                address,
                phoneNumber,
                stripeCustomerId: null, 
                roles: ['partner'],
                subscriptionStatus: 'pending_invoice',
                createdAt: new Date(),
            });

        } catch (e: any) {
            if (e.code === 'auth/email-already-in-use') {
                return res.status(400).json({ error: 'アカウント登録に失敗しました: このメールアドレスは既に登録されています。' });
            }
            console.error('Firebase registration error:', e);
            return res.status(500).json({ error: `アカウント登録に失敗しました: ${e.message}` });
        }
    } else {
        // 既存ユーザーの場合、UIDを取得
        try {
            const authHeader = req.headers.authorization;
            const idToken = authHeader ? authHeader.split('Bearer ')[1] : null;
            if (!idToken) {
                return res.status(401).json({ error: '認証トークンがありません。' });
            }
            const decodedToken = await adminAuth.verifyIdToken(idToken);
            user = await adminAuth.getUser(decodedToken.uid);
        } catch (error) {
             return res.status(401).json({ error: '認証エラー。再度ログインしてください。' });
        }
    }
    
    if (!user) {
        return res.status(500).json({ error: 'ユーザー情報の取得に失敗しました。' });
    }
    
    // --- 2. Stripeでの請求書作成 ---
    try {
        const stripe = getStripeAdmin(); 
        
        let customerId;
        const userDocRef = adminDb.collection('users').doc(user.uid);
        const userDoc = await userDocRef.get();
        const userData = userDoc.data();

        // 2-a. Stripe顧客IDの取得または作成
        if (userData?.stripeCustomerId) {
            customerId = userData.stripeCustomerId;
        } else {
            const customer = await stripe.customers.create({
                email: user.email,
                name: `${companyName} 様`, 
                address: { line1: address || '' }, 
                preferred_locales: ['ja'], 
                metadata: { firebaseUid: user.uid },
            });
            customerId = customer.id;
            await userDocRef.update({ stripeCustomerId: customerId });
        }

        // ★★★【最終解決策】ここからロジックを全面的に変更 ★★★

        // ステップ 1: 空の請求書を「下書き(draft)」として作成
        const invoice = await stripe.invoices.create({
            customer: customerId,
            collection_method: 'send_invoice',
            days_until_due: 30,
            footer: BANK_TRANSFER_DETAILS_JAPANESE,
            auto_advance: false, // 手動で確定するため必ずfalse
        });

        // ステップ 2: 作成した下書き請求書に対して、金額情報を持つ請求項目を追加
        await stripe.invoiceItems.create({
            customer: customerId,
            price: priceId,
            invoice: invoice.id, // ★重要: 作成した下書き請求書IDを指定
        });

        // ステップ 3: 項目が追加された請求書を「確定(finalize)」する
        const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);

        // ステップ 4: 確定した請求書を顧客に「送信(send)」する。ここでPDFが生成される
        const sentInvoice = await stripe.invoices.sendInvoice(finalizedInvoice.id);

        // ★★★ ここまでが新しいロジック ★★★

        if (sentInvoice.invoice_pdf) {
            const newRoles = userData?.roles || ['partner'];
            if (!newRoles.includes(serviceType)) {
                newRoles.push(serviceType);
            }
            await userDocRef.update({
                subscriptionStatus: 'pending_invoice',
                roles: newRoles,
            });

            return res.status(200).json({ 
                success: true, 
                pdfUrl: sentInvoice.invoice_pdf,
            });
        } else {
            // ここに来ることはほぼないはずだが、念のためエラーハンドリング
            await sleep(3000); // 3秒待機して再取得を試みる
            const finalCheckInvoice = await stripe.invoices.retrieve(sentInvoice.id);
            if(finalCheckInvoice.invoice_pdf) {
                return res.status(200).json({ success: true, pdfUrl: finalCheckInvoice.invoice_pdf });
            }
            throw new Error('Stripeは請求書PDFの生成に失敗しました。');
        }

    } catch (e: any) {
        console.error('Stripe process error:', e);
        
        // クリーンアップ処理
        if (cleanupUser && user) {
            try {
                await adminAuth.deleteUser(user.uid);
                console.log(`[CLEANUP] Firebase user ${user.uid} deleted due to Stripe error.`);
            } catch (cleanupError) {
                console.error('[CLEANUP FAILED] Firebase user deletion failed:', cleanupError);
            }
        }
        
        return res.status(500).json({ 
            error: `請求書作成中にエラーが発生しました。:${e.message || '不明なエラー'}`, 
        });
    }
}