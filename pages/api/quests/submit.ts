import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, getAdminDb } from '../../../lib/firebase-admin';
import nookies from 'nookies';
import * as admin from 'firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') { return res.status(405).end(); }

  try {
    const cookies = nookies.get({ req });
    const token = await adminAuth().verifySessionCookie(cookies.token, true);
    const { uid } = token;
    const { questId, reportText } = req.body;

    if (!questId) { return res.status(400).json({ error: 'Quest ID is required' }); }

    const db = getAdminDb();
    const userQuestRef = db.collection('users').doc(uid).collection('acceptedQuests').doc(questId);
    
    const userQuestDoc = await userQuestRef.get();
    if (!userQuestDoc.exists || userQuestDoc.data()?.status !== 'accepted') {
      throw new Error('You cannot submit a report for this quest.');
    }

    // ステータスを「承認待ち(submitted)」に更新
    await userQuestRef.update({
      status: 'submitted',
      reportText: reportText || '', // 任意で報告テキストを保存
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).json({ success: true, message: 'Quest report submitted successfully.' });

  } catch (error: any) {
    console.error("Quest submission failed:", error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}