// pages/api/auth/register-and-create-invoice.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import getStripeAdmin from '@/lib/stripe-admin';
import admin from 'firebase-admin';

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
※入金確認後に管理ページへのログイン情報をお届けします。
`;

const formatPhoneNumberForFirebase = (phoneNumber: string): string | undefined => {
  if (!phoneNumber) return undefined;
  if (phoneNumber.startsWith('0')) return `+81${phoneNumber.substring(1)}`;
  if (phoneNumber.startsWith('+')) return phoneNumber;
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
}): Promise<{ user: admin.auth.UserRecord; customerId: string }> => {
  const { email, password, companyName, address, contactPerson, phoneNumber, serviceType } = data;
  const stripe = getStripeAdmin();
  let user: admin.auth.UserRecord;

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

  if (customerId) {
    try {
      await stripe.customers.retrieve(customerId);
    } catch (e: any) {
      if (e?.type === 'StripeInvalidRequestError' && e?.code === 'resource_missing') {
        console.warn(`Stripe customer ${customerId} not found. Recreating customer for user ${user.uid}.`);
        customerId = undefined as any;
      } else {
        throw e;
      }
    }
  }

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

    const requiredFields = ['serviceType', 'companyName', 'address', 'contactPerson', 'phoneNumber', 'email'];
    const missingFields = requiredFields.filter(f => !req.body[f]);

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

    // 🧾 銀行振込付き請求書を作成
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

    // ✅ finalizedInvoice は再代入されないため const に変更
    const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);

    // Firestore に請求情報を保存
    await adminDb.collection('users').doc(user.uid).set(
      {
        [`${serviceType}SubscriptionStatus`]: 'pending_invoice',
        stripeInvoiceId: finalizedInvoice.id,
      },
      { merge: true }
    );

    // PDF / Hosted Invoice URL の生成を待つ
    const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

    let pdfUrl = finalizedInvoice.invoice_pdf;
    let hostedUrl = finalizedInvoice.hosted_invoice_url;

    if (!pdfUrl || !hostedUrl) {
      await wait(3000);
      const retrieved = await stripe.invoices.retrieve(finalizedInvoice.id);
      pdfUrl = retrieved.invoice_pdf || pdfUrl;
      hostedUrl = retrieved.hosted_invoice_url || hostedUrl;
    }

    if (!pdfUrl && !hostedUrl) {
      res.status(200).json({ success: true, invoiceId: finalizedInvoice.id });
      return;
    }

    res.status(200).json({ success: true, pdfUrl, hostedUrl, invoiceId: finalizedInvoice.id });
  } catch (e: any) {
    console.error('[Invoice API Error]', e);
    const errorMessage =
      e?.type === 'StripeInvalidRequestError' && e?.message?.includes('No such customer')
        ? 'Stripe顧客情報に問題が発生しました。再度お試しください。'
        : e.message || '不明なエラー';
    res.status(500).json({ error: errorMessage });
  }
}

























