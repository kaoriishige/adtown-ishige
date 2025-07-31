import type { NextApiRequest, NextApiResponse } from 'next';
import admin from '../../lib/firebase-admin';
import nookies from 'nookies';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // ユーザーを認証
    const cookies = nookies.get({ req });
    const token = await admin.auth().verifyIdToken(cookies.token);
    const { uid } = token;

    // Firestoreから紹介報酬データを取得
    const db = admin.firestore();
    const rewardsQuery = await db.collection('referralRewards').where('referrerUid', '==', uid).get();

    let total = 0;
    let pending = 0;

    rewardsQuery.forEach(doc => {
      const data = doc.data();
      total += data.rewardAmount || 0;
      if (data.rewardStatus === 'pending') {
        pending += data.rewardAmount || 0;
      }
    });

    res.status(200).json({ total, pending });

  } catch (error) {
    console.error('紹介サマリーの取得に失敗:', error);
    res.status(401).json({ error: '認証エラー、またはデータの取得に失敗しました。' });
  }
}