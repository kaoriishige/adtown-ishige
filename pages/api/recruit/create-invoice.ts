// pages/api/recruit/create-invoice.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import getAdminStripe from '@/lib/stripe-admin';
import { FieldValue } from 'firebase-admin/firestore';
import Stripe from 'stripe';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { email, serviceType, companyName, address, contactPerson, phoneNumber } = req.body;

    if (!email || !serviceType) {
        return res.status(400).json({ error: 'メールアドレスとサービスタイプは必須です。' });
    }

    try {
        const stripe = getAdminStripe();

        let userRecord;
        try {
            userRecord = await adminAuth.getUserByEmail(email);
        } catch (error: any) {
            if (error.code === 'auth/user-not-found') {
                if (!companyName || !address || !contactPerson || !phoneNumber) {
                    return res.status(400).json({ error: 'アカウント作成には全ての情報が必要です。' });
                }
                userRecord = await adminAuth.createUser({ email, displayName: contactPerson });
                
                const userDocRef = adminDb.collection('users').doc(userRecord.uid);
                await userDocRef.set({
                    email, 
                    displayName: contactPerson, 
                    companyName, 
                    address, 
                    phoneNumber, 
                    stripeCustomerId: null,
                    roles: ['partner', 'recruit-partner'],
                    createdAt: new Date()
                });
            } else {
                throw error;
            }
        }

        const userDocRef = adminDb.collection('users').doc(userRecord.uid);
        const userData = (await userDocRef.get()).data();

        let stripeCustomerId = userData?.stripeCustomerId;
        if (!stripeCustomerId) {
            const customer = await stripe.customers.create({ email: userRecord.email, name: companyName });
            stripeCustomerId = customer.id;
            // 修正箇所: customerIdではなくcustomer.idを使用
            await userDocRef.update({ stripeCustomerId: customer.id }); 
        }
        
        const priceId = process.env.STRIPE_JOB_ANNUAL_PRICE_ID;
        if (!priceId) {
            return res.status(500).json({ error: 'サーバー設定エラー: 年間料金IDが設定されていません。' });
        }

        const invoice = await stripe.invoices.create({
            customer: stripeCustomerId,
            collection_method: 'send_invoice',
            days_until_due: 30,
        });

        await stripe.invoiceItems.create({
            customer: stripeCustomerId,
            price: priceId,
            invoice: invoice.id,
            description: 'AIマッチング求人サービス (年間プラン)',
        });

        const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);

        if (!finalizedInvoice.invoice_pdf) {
            throw new Error('請求書PDFの作成に失敗しました。');
        }

        res.status(200).json({ pdfUrl: finalizedInvoice.invoice_pdf });

    } catch (error: any) {
        console.error('請求書作成エラー:', error);
        res.status(500).json({ error: `請求書作成に失敗しました: ${error.message}` });
    }
}