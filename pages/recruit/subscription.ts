import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import Stripe from 'stripe'; // ★修正: Stripe SDKをインポート

// 【設定箇所 1/3 修正済み】環境変数から秘密鍵を読み込みます
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
    // 秘密鍵が設定されていない場合はエラーをスロー
    throw new Error("STRIPE_SECRET_KEY is not set in environment variables.");
}

// ★修正: 実際のStripeクライアントの初期化
// Stripe APIのバージョンをローカル環境の要求に合わせて更新します。
const stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: '2024-04-10', // ★修正済み: '2023-10-16' -> '2024-04-10'
});


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { action } = req.body; // 'pause' または 'resume'
    const sessionCookie = req.cookies.session;

    if (!sessionCookie) {
        return res.status(401).json({ error: 'Unauthorized: No session cookie' });
    }

    let uid: string;
    try {
        const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
        uid = decodedToken.uid;
    } catch (error) {
        return res.status(401).json({ error: 'Unauthorized: Invalid session token' });
    }

    // 1. ユーザーデータと購読情報の取得
    const userRef = adminDb.collection('users').doc(uid);
    const userDoc = await userRef.get();
    const userData = userDoc.data();

    // 【設定箇所 2/3】購読IDのフィールド名を確認してください
    const subscriptionId = userData?.stripeSubscriptionId; // Stripeの購読IDを想定
    const currentStatus = userData?.recruitSubscriptionStatus || 'inactive';

    if (!subscriptionId) {
        // 決済情報が未登録の場合
        console.error(`User ${uid}: Subscription ID not found.`);
        return res.status(400).json({ error: 'Subscription ID not found. 決済情報が登録されていません。' });
    }

    try {
        let newStatus: 'active' | 'paused' | 'trialing' = currentStatus as any;

        // 2. 決済システム（Stripe）との連携ロジック
        if (action === 'pause' && (currentStatus === 'active' || currentStatus === 'trialing')) {
            
            // ====================================================
            // ★★★ 決済の停止処理 (Stripe APIコール) ★★★
            // ====================================================
            // 実際のStripe処理: クレジット決済を停止します
            await stripe.subscriptions.update(subscriptionId, { 
                pause_collection: { behavior: 'void' } // 'void'は請求書を作成せず停止します
            });
            
            newStatus = 'paused';
            
        } else if (action === 'resume' && currentStatus === 'paused') {
            
            // ====================================================
            // ★★★ 決済の再開処理 (Stripe APIコール) ★★★
            // ====================================================
            // 実際のStripe処理: クレジット決済を再開します
            await stripe.subscriptions.update(subscriptionId, { 
                pause_collection: null // 'null'で保留を解除し、再開します
            });

            newStatus = 'active';
        } else {
            return res.status(200).json({ 
                newStatus: currentStatus, 
                message: `Subscription is already in the requested state (${currentStatus}).` 
            });
        }

        // 3. Firestore（AIマッチングとDB）のステータスを更新
        await userRef.update({
            recruitSubscriptionStatus: newStatus,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        
        // 4. 全ての求人のステータスを更新 (AIマッチングの有効/無効に連動)
        const jobsQuery = await adminDb.collection('jobs').where('ownerId', '==', uid).get();
        const jobUpdatePromises = jobsQuery.docs.map(doc => 
            doc.ref.update({ status: newStatus === 'paused' ? 'paused' : 'active' })
        );
        await Promise.all(jobUpdatePromises);


        return res.status(200).json({ newStatus, message: `Subscription successfully set to ${newStatus}` });

    } catch (error: any) { 
        console.error('Subscription toggle error:', error);
        // エラーを捕捉し、フロントエンドに正確に伝える
        // Stripeのエラー形式を想定
        return res.status(500).json({ error: error.message || 'サーバー側での購読操作に失敗しました。' });
    }
}