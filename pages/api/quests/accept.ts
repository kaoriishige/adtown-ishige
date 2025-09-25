import { NextApiRequest, NextApiResponse } from 'next';
import { getAdminAuth, getAdminDb } from '../../../lib/firebase-admin';
import nookies from 'nookies';
import * as admin from 'firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  try {
    const cookies = nookies.get({ req });
    const token = await getAdminAuth().verifySessionCookie(cookies.token, true);
    const { uid } = token;
    const { questId } = req.body;

    if (!questId) {
      return res.status(400).json({ error: 'Quest ID is required' });
    }

    const db = getAdminDb();
    const questRef = db.collection('quests').doc(questId);
    const userQuestRef = db.collection('users').doc(uid).collection('acceptedQuests').doc(questId);

    await db.runTransaction(async (transaction) => {
      const questDoc = await transaction.get(questRef);
      const userQuestDoc = await transaction.get(userQuestRef);

      if (!questDoc.exists) { throw new Error('Quest does not exist.'); }
      if (userQuestDoc.exists) { throw new Error('You have already accepted this quest.'); }
      
      const questData = questDoc.data();
      if(questData?.status !== 'open') { throw new Error('This quest is not open for participants.'); }

      // ユーザーの参加記録を作成
      transaction.set(userQuestRef, {
        questId: questId,
        title: questData?.title,
        reward: questData?.reward,
        status: 'accepted', // 参加済み
        acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // クエスト本体の参加者数を増やす
      transaction.update(questRef, {
        participantCount: admin.firestore.FieldValue.increment(1)
      });
    });

    res.status(200).json({ success: true, message: 'Successfully accepted the quest.' });

  } catch (error: any) {
    console.error("Quest acceptance failed:", error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}