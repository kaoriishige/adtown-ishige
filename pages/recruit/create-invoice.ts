import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '../../lib/firebase-admin';
import stripe from '../../lib/stripe';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const userDoc = await adminDb.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found in Firestore' });
    }
    const userData = userDoc.data()!;
    const stripeCustomerId = userData.stripeCustomerId;

    if (!stripeCustomerId) {
        return res.status(400).json({ error: 'Stripe customer ID not found for this user.' });
    }

    // ★★★ ご指示通り、環境変数名を修正しました ★★★
    const annualPriceId = process.env.STRIPE_JOB_ANNUAL_PRICE_ID;
    if (!annualPriceId) {
        throw new Error('Annual Price ID for job service is not configured.');
    }

    // 請求書アイテムを作成
    await stripe.invoiceItems.create({
      customer: stripeCustomerId,
      price: annualPriceId,
      description: 'AI求人サービス 年間プラン',
    });

    // 請求書を作成
    const invoice = await stripe.invoices.create({
      customer: stripeCustomerId,
      collection_method: 'send_invoice',
      days_until_due: 30,
      auto_advance: true,
    });

    // 請求書をメールで送信
    await stripe.invoices.sendInvoice(invoice.id);

    res.status(200).json({ success: true, message: '請求書をメールで送信しました。' });

  } catch (error: any) {
    console.error('Invoice creation error:', error);
    res.status(500).json({ error: error.message });
  }
}