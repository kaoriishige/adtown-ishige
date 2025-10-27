// /pages/api/auth/register-and-create-invoice.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import getStripeAdmin from '@/lib/stripe-admin';
import * as admin from 'firebase-admin';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || process.env.URL || 'http://localhost:3000';

// --- 発行元情報 ---
const ISSUER_TIN = process.env.ISSUER_TIN || 'T7060001012602';
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

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
    return;
  }

  const adAnnualPriceId = process.env.STRIPE_AD_ANNUAL_PRICE_ID;
  const jobAnnualPriceId = process.env.STRIPE_JOB_ANNUAL_PRICE_ID;

  const missingKeys: string[] = [];
  if (!process.env.STRIPE_SECRET_KEY) missingKeys.push('STRIPE_SECRET_KEY');
  if (!adAnnualPriceId) missingKeys.push('STRIPE_AD_ANNUAL_PRICE_ID');
  if (!jobAnnualPriceId) missingKeys.push('STRIPE_JOB_ANNUAL_PRICE_ID');

  if (missingKeys.length > 0) {
    console.error(`[Invoice API] 環境変数不足: ${missingKeys.join(', ')}`);
    return res
      .status(500)
      .json({ error: `サーバー設定エラー: ${missingKeys.join(', ')} が設定されていません。` });
  }

  let user: admin.auth.UserRecord | null = null;
  let snapshot: admin.firestore.DocumentSnapshot<admin.firestore.DocumentData> | undefined;
  let isNewUser = false;

  try {
    const { serviceType, companyName, address, contactPerson, phoneNumber, email, password } = req.body;

    if (!['adver', 'recruit'].includes(serviceType)) {
      res.status(400).json({ error: `無効なサービスタイプ: ${serviceType}` });
      return;
    }

    const missingFields = ['serviceType', 'companyName', 'address', 'contactPerson', 'phoneNumber', 'email'].filter(
      (f) => !req.body[f]
    );

    if (!password) {
      try {
        await adminAuth.getUserByEmail(email);
      } catch (e: any) {
        if (e.code === 'auth/user-not-found') missingFields.push('password');
      }
    }

    if (missingFields.length > 0) {
      res.status(400).json({ error: `必須項目が不足しています: ${missingFields.join(', ')}` });
      return;
    }

    const priceId = serviceType === 'adver' ? adAnnualPriceId : jobAnnualPriceId;
    const productName = serviceType === 'adver' ? '広告パートナー 年間利用料' : 'AI求人パートナー 年間利用料';

    // --- 1. Firebase Authユーザー作成または取得 ---
    try {
      user = await adminAuth.getUserByEmail(email);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        isNewUser = true;
        if (!password) throw new Error('新規登録にはパスワードが必要です。');
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

    // --- 2. Stripe顧客作成または取得 ---
    const userDocRef = adminDb.collection('users').doc(user.uid);
    snapshot = await userDocRef.get();
    let customerId = snapshot.data()?.stripeCustomerId;

    const stripe = getStripeAdmin();

    if (!customerId) {
      const newCustomer = await stripe.customers.create({
        email,
        name: companyName,
        phone: phoneNumber,
        address: { country: 'JP', line1: address },
        metadata: { firebaseUid: user.uid },
      });
      customerId = newCustomer.id;
    }

    // --- 3. 請求書作成 ---
    const invoice = await stripe.invoices.create({
      customer: customerId,
      collection_method: 'send_invoice',
      days_until_due: 30,
      footer: BANK_TRANSFER_DETAILS_JAPANESE,
      auto_advance: false, // finalize前にinvoiceItems追加
    });

    await stripe.invoiceItems.create({
      customer: customerId,
      price: priceId,
      invoice: invoice.id,
      description: productName,
    });

    const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);

    // --- 4. Firestoreへ登録 ---
    await adminDb.collection('users').doc(user.uid).set(
      {
        uid: user.uid,
        email,
        displayName: contactPerson,
        companyName,
        address,
        phoneNumber,
        stripeCustomerId: customerId,
        roles: admin.firestore.FieldValue.arrayUnion(serviceType),
        [`${serviceType}SubscriptionStatus`]: 'pending_invoice',
        billingCycle: 'annual',
        stripeInvoiceId: finalizedInvoice.id,
        createdAt: snapshot.exists
          ? snapshot.data()!.createdAt
          : admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // --- 5. PDF生成確認 ---
    const wait = (ms: number): Promise<void> =>
      new Promise<void>((resolve): void => {
        setTimeout(resolve, ms);
      });

    let pdfUrl = finalizedInvoice.invoice_pdf;
    if (!pdfUrl) {
      await wait(4000);
      const retrieved = await stripe.invoices.retrieve(finalizedInvoice.id);
      pdfUrl = retrieved.invoice_pdf;
    }

    if (!pdfUrl) throw new Error('Stripe請求書PDFが生成されませんでした。');

    res.status(200).json({ success: true, pdfUrl });
  } catch (e: any) {
    if (user && isNewUser && snapshot && !snapshot.exists) {
      await adminAuth.deleteUser(user.uid).catch(console.error);
    }

    console.error('[Invoice API Error]', e);
    const errorMessage =
      e.type === 'StripeInvalidRequestError' && e.message.includes('No such customer')
        ? 'Stripe顧客情報に問題が発生しました。再度お試しください。'
        : e.message || '不明なエラー';

    res.status(500).json({ error: errorMessage });
  }
}


























