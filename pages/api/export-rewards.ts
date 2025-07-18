// pages/api/export-rewards.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { admin } from '../../lib/firebase-admin';

const convertToCSV = (data: any[]) => {
  const header = ['月', '紹介者メール', '対象人数', '報酬額'];
  const rows = data.map(item =>
    [
      item.month,
      item.referrerEmail,
      item.referralCount,
      item.totalReward
    ].join(',')
  );
  return [header.join(','), ...rows].join('\n');
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const db = admin.firestore();
    const rewardsSnapshot = await db.collection('referralRewards').get();
    const rewards = rewardsSnapshot.docs.map(doc => doc.data());

    const summaryMap: { [key: string]: { totalReward: number; uids: Set<string>; referrerUid: string } } = {};

    for (const reward of rewards) {
      if (reward.paymentDate && reward.referrerUid) {
        const paymentDate = reward.paymentDate.toDate();
        const monthKey = `${paymentDate.getFullYear()}-${(paymentDate.getMonth() + 1).toString().padStart(2, '0')}`;
        const groupKey = `${monthKey}-${reward.referrerUid}`;

        if (!summaryMap[groupKey]) {
          summaryMap[groupKey] = { totalReward: 0, uids: new Set<string>(), referrerUid: reward.referrerUid };
        }
        summaryMap[groupKey].totalReward += reward.rewardAmount;
        summaryMap[groupKey].uids.add(reward.referredUid);
      }
    }

    const referrerUids = Array.from(new Set(Object.values(summaryMap).map(s => s.referrerUid)));
    const userRecords = await Promise.all(
      referrerUids.map(uid => admin.auth().getUser(uid).catch(() => null))
    );
    const emailMap = new Map(userRecords.filter(Boolean).map(u => [u!.uid, u!.email]));

    const summaries = Object.entries(summaryMap).map(([key, data]) => ({
      month: `${key.substring(0, 4)}-${key.substring(5, 7)}`,
      referrerEmail: emailMap.get(data.referrerUid) || '不明なユーザー',
      referralCount: data.uids.size,
      totalReward: data.totalReward,
    }));

    summaries.sort((a, b) => b.month.localeCompare(a.month));

    const csvData = convertToCSV(summaries);
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="rewards-${new Date().toISOString().slice(0,10)}.csv"`);
    res.status(200).send(csvData);

  } catch (error) {
    console.error('Error exporting rewards:', error);
    res.status(500).json({ error: 'Failed to export reward data' });
  }
};

export default handler;
