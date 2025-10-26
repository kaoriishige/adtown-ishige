// pages/api/users/add-service.ts

import type { NextApiRequest, NextApiResponse } from 'next';
// adminを削除というコメントがありますが、adminAuthとadminDbのインポートはそのまま維持します
import { adminAuth, adminDb } from '@/lib/firebase-admin'; 
import getAdminStripe from '@/lib/stripe-admin';
import { FieldValue } from 'firebase-admin/firestore';
import Stripe from 'stripe'; // Stripeは使用されていませんが、インポートはそのまま維持します

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
        // catchブロック内のanyをunknownに修正し、型ガードを使用するのがベストプラクティスですが、
        // 既存コードのエラー修正に絞るため、ここではauthError.codeのアクセスを安全化します。
        try {
            userRecord = await adminAuth.getUserByEmail(email);
        } catch (authError: any) {
            // エラーオブジェクトにcodeプロパティがあるかチェック
            if (authError && typeof authError === 'object' && 'code' in authError && authError.code === 'auth/user-not-found') {
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

        // 1. Firestoreでロールを追加
        await userDocRef.update({
            roles: FieldValue.arrayUnion(serviceType)
        });

        const stripe = getAdminStripe();
        // 2. 修正箇所: 'stripeCustomerId' を 'let' から 'const' に変更
        const stripeCustomerId = userData?.stripeCustomerId; 

        // 3. Stripe顧客情報にメタデータを追加
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
        // error.message に安全にアクセスするために、必要に応じて型ガードまたはanyの使用を維持
        res.status(500).json({ error: `サービス追加に失敗しました: ${error.message}` });
    }
}