import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import getStripeAdmin from '@/lib/stripe-admin';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

const MINIMUM_PAYOUT_AMOUNT = 3000; // 支払い最低額 (円)
const PAYOUT_CURRENCY = 'jpy';

/**
 * 支払い対象のパートナーを抽出し、Stripeで振り込みを実行するAPIエンドポイント。
 *
 * このAPIは、Cloud Functionsなどのスケジュール実行環境から、認証付きで呼び出されることを想定しています。
 */
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
): Promise<void> {
    // 🚨 実際の本番環境では、APIキー認証またはCloud Functionsからの呼び出し確認が必要です。
    // 例: if (req.headers.authorization !== `Bearer ${process.env.INTERNAL_CRON_SECRET}`) { return res.status(401).end(); }
    
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        res.status(405).end('Method Not Allowed');
        return;
    }

    try {
        const stripe = getStripeAdmin();
        const batch = adminDb.batch();
        const today = new Date().toISOString().split('T')[0];

        // 1. 支払い対象となる未払い紹介料データを 'referralPayouts' コレクションから取得
        // 支払いステータスが 'pending' のものを抽出
        const pendingPayoutsSnap = await adminDb.collection('referralPayouts')
            .where('status', '==', 'pending')
            .get();

        if (pendingPayoutsSnap.empty) {
            return res.status(200).json({ success: true, message: '支払い対象となる未払いレコードはありません。' });
        }

        // 2. 支払い対象パートナーを金額ごとに集計
        // (referrerUid, stripeCustomerId, unpaidAmount) のマップを作成
        const partnersToPay = new Map<string, {
            partnerId: string,
            stripeCustomerId: string,
            unpaidAmount: number,
            payoutRecordIds: string[]
        }>();

        // 支払い対象のユーザーUIDを取得
        const partnerUids = new Set<string>();

        pendingPayoutsSnap.docs.forEach(doc => {
            const data = doc.data();
            const storeId = data.referrerUid as string;
            const amount = data.amount || 0;
            const payoutId = doc.id;

            if (!partnersToPay.has(storeId)) {
                partnersToPay.set(storeId, {
                    partnerId: storeId,
                    stripeCustomerId: data.referrerStripeCustomerId, // referralPayoutsにStripeIDが格納されている前提
                    unpaidAmount: 0,
                    payoutRecordIds: []
                });
                partnerUids.add(storeId);
            }

            const current = partnersToPay.get(storeId)!;
            current.unpaidAmount += amount;
            current.payoutRecordIds.push(payoutId);

            // referralPayoutsレコードのステータスを'processing'に一時更新
            batch.update(doc.ref, { status: 'processing', processingAt: admin.firestore.FieldValue.serverTimestamp() });
        });

        // データベースを一時的に更新
        await batch.commit();

        // 3. 支払い対象となるユーザー情報を取得（銀行口座情報を含む）
        const usersSnap = await adminDb.collection('users').where(admin.firestore.FieldPath.documentId(), 'in', Array.from(partnerUids)).get();
        const usersData = new Map(usersSnap.docs.map(doc => [doc.id, doc.data()]));
        
        const successfulPayouts: { partnerId: string, amount: number, payoutId: string }[] = [];
        const failedPayouts: { partnerId: string, reason: string }[] = [];

        // 4. 各パートナーに対して支払い（Payer to Payee）を実行
        // 🚨 Array.fromでラップし、TS2802を回避
        for (const [partnerId, paymentInfo] of Array.from(partnersToPay)) {
            const user = usersData.get(partnerId);

            // 支払い最低額チェック
            if (paymentInfo.unpaidAmount < MINIMUM_PAYOUT_AMOUNT) {
                // 最低額に満たない場合はステータスを'pending'に戻す（次の支払いを待つ）
                paymentInfo.payoutRecordIds.forEach((payoutId: string) => {
                    batch.update(adminDb.collection('referralPayouts').doc(payoutId), { status: 'pending', processingAt: admin.firestore.FieldValue.delete() });
                });
                failedPayouts.push({ partnerId, reason: `最低支払い額（${MINIMUM_PAYOUT_AMOUNT}円）未満` });
                continue;
            }
            
            // 銀行口座情報の確認
            // 🚨 Connect Account IDをFirestoreから取得する前提
            const stripeAccountId = user?.stripeAccountId; 

            if (!stripeAccountId) {
                // 銀行口座がない場合は失敗として記録し、ステータスを'pending'に戻す
                paymentInfo.payoutRecordIds.forEach((payoutId: string) => {
                    batch.update(adminDb.collection('referralPayouts').doc(payoutId), { status: 'pending', processingAt: admin.firestore.FieldValue.delete() });
                });
                failedPayouts.push({ partnerId, reason: 'Stripe ConnectアカウントIDが未登録' });
                continue;
            }
            
            // Stripeによる実際の振り込み処理を実行
            try {
                // Stripe Transfer APIを使用して、PlatformからConnect Accountへ送金（Payout）
                // amountはセント/円ではなく、Stripeが要求する最小単位であることに注意（ここでは円単位を仮定し、Stripeが自動変換することを期待）
                const transfer = await stripe.transfers.create({
                    amount: paymentInfo.unpaidAmount,
                    currency: PAYOUT_CURRENCY,
                    destination: stripeAccountId, // Connect Account IDが振込先となる
                    source_transaction: user?.sourceTransactionId, // 必要な場合は元トランザクションIDを指定
                    metadata: {
                        referrer_id: partnerId,
                        payout_reason: 'Referral Rewards Payout',
                    },
                });
                
                successfulPayouts.push({ partnerId, amount: paymentInfo.unpaidAmount, payoutId: transfer.id });

                // 5. 成功時のDB更新 (final commit)
                paymentInfo.payoutRecordIds.forEach((payoutId: string) => {
                    batch.update(adminDb.collection('referralPayouts').doc(payoutId), {
                        status: 'paid',
                        paidAt: admin.firestore.FieldValue.serverTimestamp(),
                        payoutReferenceId: transfer.id,
                    });
                });
                batch.update(adminDb.collection('users').doc(partnerId), {
                    lastReferralPaidDate: today,
                    totalReferralsPaid: admin.firestore.FieldValue.increment(paymentInfo.unpaidAmount),
                });

            } catch (payoutError: any) {
                console.error(`Stripe Transfer failed for ${partnerId}:`, payoutError.message);
                failedPayouts.push({ partnerId, reason: payoutError.message });
                
                // 失敗した場合、ステータスを'pending'に戻す
                paymentInfo.payoutRecordIds.forEach((payoutId: string) => {
                    batch.update(adminDb.collection('referralPayouts').doc(payoutId), { status: 'pending', processingAt: admin.firestore.FieldValue.delete() });
                });
            }
        }
        
        // 最終的なデータベース変更をコミット
        await batch.commit();

        return res.status(200).json({
            success: true,
            totalPartnersProcessed: partnerUids.size,
            successfulPayouts: successfulPayouts,
            failedPayouts: failedPayouts,
            message: `${successfulPayouts.length}件の支払いを実行し、${failedPayouts.length}件が失敗しました。`
        });

    } catch (e: any) {
        console.error('[Payout API System Error]', e);
        res.status(500).json({ error: e.message || 'サーバー側で予期せぬエラーが発生しました。' });
    }
}