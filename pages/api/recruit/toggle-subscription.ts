import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import getStripeAdmin from '@/lib/stripe-admin';
// import * as admin from 'firebase-admin'; // ★ 修正: 未使用のため削除
import Stripe from 'stripe'; 

const stripe = getStripeAdmin();

export default async function handler(req: NextApiRequest, res: NextApiResponse<{ message: string } | { error: string }>) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { action } = req.body; // 'pause' または 'resume'

    // 1. 認証とUIDの取得
    const sessionCookie = req.cookies.session || '';
    let companyUid: string;

    try {
        const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
        companyUid = decodedClaims.uid;
    } catch (e) {
        return res.status(401).json({ error: '認証トークンの検証に失敗しました。再ログインしてください。' });
    }

    try {
        // 2. ユーザーのサブスクリプション情報を取得
        const userSnap = await adminDb.collection('users').doc(companyUid).get();
        const userData = userSnap.data();

        const subscriptionId = userData?.stripeSubscriptionId;
        const billingCycle = userData?.recruitBillingCycle; // 月額か年額か

        if (!subscriptionId) {
            return res.status(400).json({ error: 'サブスクリプションIDが見つかりません。' });
        }
        
        // 年間契約は停止不可の制約を反映
        if (billingCycle === 'annual') {
            return res.status(400).json({ error: '年間契約プランは一時停止できません。' });
        }

        // 3. Stripeサブスクリプションの更新
        let updatedSubscription: Stripe.Subscription; 

        if (action === 'pause') {
            // 月額プランを一時停止 (Stripeでは pause_collection)
            updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
                pause_collection: { behavior: 'void' }, // 請求を行わないように一時停止
            });
            await adminDb.collection('users').doc(companyUid).update({
                recruitSubscriptionStatus: 'paused_by_user', // データベースに一時停止状態を記録
            });
        } else if (action === 'resume') {
            // 再開 (pause_collection を null に設定)
            updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
                pause_collection: null,
            });
            await adminDb.collection('users').doc(companyUid).update({
                recruitSubscriptionStatus: 'active', // データベースに active 状態を記録
            });
        } else {
            return res.status(400).json({ error: '無効なアクションが指定されました。' });
        }

        const statusMessage = action === 'pause' ? '停止' : '再開';
        return res.status(200).json({ message: `求人サービスを正常に${statusMessage}しました。` });

    } catch (e: any) {
        console.error(`❌ サブスクリプション操作エラー (${action}):`, e);
        return res.status(500).json({ error: `サブスクリプションの操作中にエラーが発生しました: ${e.message}` });
    }
}
