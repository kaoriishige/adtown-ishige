import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDb, adminAuth } from '../../../lib/firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // ★★★ 認証チェックを一時的に無効化します ★★★
    /*
    // 1. リクエストからセッションクッキーを取得
    const cookies = req.cookies;
    const sessionCookie = cookies.session || '';
    
    // 2. 呼び出し元が「管理者(admin)」であることを確認
    const token = await adminAuth.verifySessionCookie(sessionCookie, true);
    const adminUserDoc = await adminDb.collection('users').doc(token.uid).get();

    if (!adminUserDoc.exists || !adminUserDoc.data()?.roles?.includes('admin')) {
      return res.status(403).json({ error: 'Forbidden: Not an admin' });
    }
    console.log(`Admin user ${token.uid} is performing activation.`);
    */
    // ★★★ 認証チェック無効化ここまで ★★★
    

    // 3. リクエストの本文から、対象のユーザーIDとサービスを取得
    const { targetUserId, service } = req.body;
    if (!targetUserId || !service || !['adver', 'recruit'].includes(service)) {
      return res.status(400).json({ error: 'Invalid request: targetUserId and service are required.' });
    }

    // 4. 更新するデータを準備
    const userRef = adminDb.collection('users').doc(targetUserId);
    let updateData = {};

    if (service === 'adver') {
      updateData = {
        adverSubscriptionStatus: 'active',
        adverBillingCycle: 'invoice' // 請求書払いで有効化
      };
    } else { // service === 'recruit'
      updateData = {
        recruitSubscriptionStatus: 'active',
        recruitBillingCycle: 'invoice' // 請求書払いで有効化
      };
    }

    // 5. Firestoreのデータを更新 (Admin SDKを使用)
    await userRef.update(updateData);

    return res.status(200).json({ 
        success: true, 
        message: `User ${targetUserId} ${service} plan activated.` 
    });

  } catch (error: any) {
    console.error('API Error (activateUser):', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}