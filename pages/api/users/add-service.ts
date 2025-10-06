// pages/api/users/add-service.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/lib/firebase-admin'; // adminを削除
import getAdminStripe from '@/lib/stripe-admin';
import { FieldValue } from 'firebase-admin/firestore';
import Stripe from 'stripe';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { email, serviceType } = req.body;

    if (!email || !serviceType) {
        return res.status(400).json({ error: 'メールアドレスとサービスタイプは必須です。' });
    }

    if (serviceType !== 'ad-partner' && serviceType !== 'recruit-partner') {
        return res.status(400).json({ error: '無効なサービスタイプです。' });
    }

    try {
        let userRecord;
        try {
            userRecord = await adminAuth.getUserByEmail(email);
        } catch (authError: any) {
            if (authError.code === 'auth/user-not-found') {
                return res.status(404).json({ error: '指定されたメールアドレスのユーザーが見つかりません。' });
            }
            throw authError;
        }

        const userDocRef = adminDb.collection('users').doc(userRecord.uid);
        const userDoc = await userDocRef.get();
        if (!userDoc.exists) {
            return res.status(404).json({ error: 'ユーザーのFirestoreドキュメントが見つかりません。' });
        }

        const userData = userDoc.data();
        const existingRoles: string[] = userData?.roles || [];

        if (existingRoles.includes(serviceType)) {
            return res.status(409).json({ error: 'このユーザーは既にこのサービスに登録されています。' });
        }

        await userDocRef.update({
            roles: FieldValue.arrayUnion(serviceType)
        });

        const stripe = getAdminStripe();
        let stripeCustomerId = userData?.stripeCustomerId;

        if (stripeCustomerId) {
            await stripe.customers.update(stripeCustomerId, {
                metadata: {
                    ...userData?.metadata,
                    [serviceType]: true,
                },
            });
        }

        res.status(200).json({ status: 'success', message: `ユーザーにサービスタイプ「${serviceType}」を追加しました。` });

    } catch (error: any) {
        console.error('サービス追加エラー:', error);
        res.status(500).json({ error: `サービス追加に失敗しました: ${error.message}` });
    }
}