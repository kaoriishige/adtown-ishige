import { NextApiRequest, NextApiResponse } from 'next';
import { admin } from '../../lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // GETリクエスト以外は受け付けません
  if (req.method !== 'GET') {
    return res.status(405).setHeader('Allow', 'GET').end('Method Not Allowed');
  }

  try {
    // リクエストから認証トークンを取得し、ユーザーを検証します
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const decodedToken = await getAuth().verifyIdToken(token);
    const uid = decodedToken.uid;

    const db = admin.firestore();

    // 紹介者の報酬率を取得します（未設定の場合は20%をデフォルトとします）
    const referrerDoc = await db.collection('users').doc(uid).get();
    const referrerData = referrerDoc.data();
    if (!referrerData) {
        return res.status(404).json({ error: 'Referrer not found' });
    }
    const rewardRate = referrerData.referralRate || 0.20; 
    const monthlyFee = 980; // 月額料金

    // このユーザーが紹介した、「現在も契約が有効な（activeな）」ユーザーを検索します
    const referredUsersQuery = db.collection('users')
      .where('referrerId', '==', uid)
      .where('subscriptionStatus', '==', 'active');
      
    const querySnapshot = await referredUsersQuery.get();
    
    // 見つかった人数と、それに基づいた報酬額の目安を計算します
    const activeReferralCount = querySnapshot.size;
    const potentialMonthlyReward = Math.floor(activeReferralCount * monthlyFee * rewardRate);

    // 計算結果をフロントエンドに返します
    res.status(200).json({
      activeReferralCount,
      potentialMonthlyReward,
    });

  } catch (error: any) {
    console.error("Get referral summary error:", error);
    res.status(500).json({ error: error.message });
  }
}