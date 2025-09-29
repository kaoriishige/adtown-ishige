import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb, adminAuth } from '../../../lib/firebase-admin';
import nookies from 'nookies';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // ▼▼▼【重要】管理者認証チェックを追加 ▼▼▼
  try {
    const cookies = nookies.get({ req });
    const token = await adminAuth().verifySessionCookie(cookies.token, true);
    const userDoc = await adminDb().collection('users').doc(token.uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
  } catch (error) {
    return res.status(401).json({ error: 'Authentication failed' });
  }
  // ▲▲▲ ここまで追加 ▲▲▲

  try {
    const db = adminDb();
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 各KPIデータを非同期で並行して取得
    const [
      userSnapshot,
      storeSnapshot, // 注: storesコレクションが存在する前提のコードです
      donationsSnapshot,
      revenueSnapshot,
      usersTodaySnapshot,
      storesThisWeekSnapshot,
    ] = await Promise.all([
      db.collection('users').get(),
      db.collection('stores').get(),
      db.collection('transactions').where('type', '==', 'donation').where('createdAt', '>=', startOfMonth).get(),
      db.collection('transactions').where('type', '==', 'payment').where('createdAt', '>=', startOfMonth).get(),
      db.collection('users').where('createdAt', '>=', oneDayAgo).get(),
      db.collection('stores').where('createdAt', '>=', oneWeekAgo).get(),
    ]);

    // --- ユーザーデータの集計 ---
    const totalUsers = userSnapshot.size;
    const userChange = usersTodaySnapshot.size;
    let paidUsers = 0;
    userSnapshot.forEach(doc => {
      if (doc.data().subscriptionStatus === 'active') {
        paidUsers++;
      }
    });
    const freeUsers = totalUsers - paidUsers;

    // --- 加盟店データの集計 ---
    const totalStores = storeSnapshot.size;
    const storeChange = storesThisWeekSnapshot.size;
    let restaurantCount = 0, beautyCount = 0, healthCount = 0, livingCount = 0, leisureCount = 0, otherCount = 0;
    storeSnapshot.forEach(doc => {
        const category = doc.data().category || 'other';
        switch (category) {
            case 'restaurant': restaurantCount++; break;
            case 'hair-salon': case 'beauty': beautyCount++; break;
            case 'health': healthCount++; break;
            case 'living': livingCount++; break;
            case 'leisure': leisureCount++; break;
            default: otherCount++;
        }
    });

    // --- ポイント流通額の集計 ---
    let monthlyRevenue = 0;
    revenueSnapshot.forEach(doc => {
        monthlyRevenue += doc.data().amount || 0;
    });

    // --- オンライン子ども食堂の集計 ---
    let donationTotal = 0;
    const donorIds = new Set<string>();
    donationsSnapshot.forEach(doc => {
        const data = doc.data();
        donationTotal += data.amount || 0;
        if(data.userId) {
            donorIds.add(data.userId);
        }
    });
    const donationCount = donationsSnapshot.size;
    const donors = donorIds.size;

    // フロントエンドに返すデータを構築
    const dashboardData = {
      totalUsers,
      userChange,
      paidUsers,
      freeUsers,
      totalStores,
      storeChange,
      restaurantCount,
      beautyCount,
      healthCount,
      livingCount,
      leisureCount,
      otherCount,
      monthlyRevenue,
      revenueChangePercent: 0, // TODO: 先月比の計算ロジックを実装
      donationTotal,
      donationCount,
      donors,
    };

    res.status(200).json(dashboardData);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}