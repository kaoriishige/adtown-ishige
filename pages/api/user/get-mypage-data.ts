import { NextApiRequest, NextApiResponse } from 'next';
import { getAdminAuth, getAdminDb } from '../../../lib/firebase-admin';
import nookies from 'nookies';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const cookies = nookies.get({ req });
    const token = await getAdminAuth().verifySessionCookie(cookies.token, true);
    const { uid } = token;

    const userDoc = await getAdminDb().collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data() || {};
    
    // 必要なデータを全て抽出
    const pointsData = userData.points || {};
    const rewardsData = {
        total: userData.totalRewards || 0,
        pending: userData.unpaidRewards || 0
    };
    const treeData = userData.tree || {};

    // フロントエンドに返すデータを構築
    const responseData = {
        email: userData.email || '',
        points: {
            balance: pointsData.balance || 0,
            usableBalance: pointsData.usableBalance || 0,
            pendingBalance: pointsData.pendingBalance || 0,
            activationStatus: pointsData.activationStatus || '',
            expiredAmount: pointsData.expiredAmount || 0,
        },
        rewards: rewardsData,
        subscriptionStatus: userData.subscriptionStatus || null,
        tree: {
            level: treeData.level || 1,
            exp: treeData.exp || 0,
            expToNextLevel: treeData.expToNextLevel || 100,
            fruits: treeData.fruits || [],
            lastWatered: treeData.lastWatered || null,
        }
    };

    res.status(200).json(responseData);

  } catch (error) {
    console.error("Failed to get mypage data:", error);
    res.status(401).json({ error: 'Authentication failed or session expired.' });
  }
}
