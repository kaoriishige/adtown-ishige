// pages/api/admin/approve-payment.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

// ⚠ 注意: 本番環境では、ここで管理者の認証と認可を厳密に行ってください。
// 例: セッションクッキー、IDトークン、またはBasic認証などを使用して、
// リクエストを行ったユーザーが「管理者ロール」を持っていることを確認する必要があります。
const checkAdminAuth = async (req: NextApiRequest): Promise<void> => {
    // 実際の実装に応じて認証ロジックをここに記述してください。
    // 例: const token = req.headers.authorization?.split('Bearer ')[1];
    // if (!token || !await adminAuth.verifyIdToken(token).then(c => c.admin === true)) {
    //     throw new Error('管理者権限がありません。');
    // }
    
    // ここでは一時的に、リクエストヘッダーに特定のキーがあるかを確認する（最低限の対策）
    const adminKey = req.headers['x-admin-key'];
    if (process.env.ADMIN_SECRET_KEY && adminKey !== process.env.ADMIN_SECRET_KEY) {
         console.warn('Unauthorized access attempt to approve-payment API.');
         throw new Error('管理者キーが不正です。');
    }
};


export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        res.status(405).end('Method Not Allowed');
        return;
    }

    const { firebaseUid, serviceType } = req.body;

    // 必須パラメータチェック
    if (!firebaseUid || !serviceType || (serviceType !== 'adver' && serviceType !== 'recruit')) {
        return res.status(400).json({ error: '必須パラメータが不足しているか、serviceTypeが不正です。' });
    }

    try {
        // 1. 管理者認証チェック
        await checkAdminAuth(req); 
        
        const userRef = adminDb.collection('users').doc(firebaseUid);
        const snapshot = await userRef.get();

        if (!snapshot.exists) {
            return res.status(404).json({ error: 'ユーザー情報が見つかりません。' });
        }
        
        const userData = snapshot.data();
        const statusField = `${serviceType}SubscriptionStatus`;
        const currentStatus = userData?.[statusField];
        
        // 2. 請求書待ち(pending_invoice)でない場合はエラー
        if (currentStatus !== 'pending_invoice') {
            return res.status(400).json({ 
                error: `現在のステータス (${currentStatus || '未設定'}) は請求書払い（入金待ち）ではないため、有効化できません。` 
            });
        }
        
        // 3. Firestore を更新して有料プランを有効化
        // 有効期限の計算: 年額プランを想定し、1年後を設定します。
        const ONE_YEAR_IN_MS = 365 * 24 * 60 * 60 * 1000;
        const expirationTimestamp = admin.firestore.Timestamp.fromMillis(Date.now() + ONE_YEAR_IN_MS);
        
        // 更新オブジェクト
        const updateData: { [key: string]: any } = {
            isPaid: true, // 全体のisPaidフラグを有料に（念のため設定）
            [statusField]: 'active', // サービス固有のステータスを有料に
            
            // サービス固有の有効期限を設定
            [`${serviceType}ExpiresAt`]: expirationTimestamp, 
            
            paymentReceivedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        await userRef.update(updateData);

        return res.status(200).json({ 
            success: true, 
            message: `ユーザー ${firebaseUid} の ${serviceType} 有料プランを有効化しました。`,
            newStatus: 'active',
            expiresAt: expirationTimestamp.toDate().toISOString()
        });

    } catch (e: any) {
        console.error('[Admin Approve Payment Error]', e);
        // 認証エラーや権限エラーの場合、401/403を返す
        if (e.message.includes('管理者')) {
            return res.status(403).json({ error: e.message });
        }
        return res.status(500).json({ error: e.message || 'サーバーエラーが発生しました。' });
    }
}