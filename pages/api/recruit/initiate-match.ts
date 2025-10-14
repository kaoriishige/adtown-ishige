import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/lib/firebase-admin'; // Firebase Admin SDK
import * as admin from 'firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { companyUid, userUid, jobTitle } = req.body; // jobTitleはオプション

  if (!companyUid || !userUid) {
    return res.status(400).json({ error: 'Missing companyUid or userUid.' });
  }

  try {
    // セッション認証はフロントエンドで済ませている前提、またはここで別途実装
    // 例: CookieからのUID検証
    // const sessionCookie = req.cookies.session;
    // const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    // if (decodedToken.uid !== companyUid) {
    //   return res.status(403).json({ error: 'Forbidden: Authenticated user does not match companyUid.' });
    // }

    // 既存のマッチングがないか確認 (二重作成防止)
    const existingMatchQuery = await adminDb.collection('matches')
      .where('companyUid', '==', companyUid)
      .where('userUid', '==', userUid)
      .limit(1)
      .get();

    if (!existingMatchQuery.empty) {
      // 既にマッチングが存在する場合は、そのmatchIdを返す
      const existingMatchDoc = existingMatchQuery.docs[0];
      return res.status(200).json({ matchId: existingMatchDoc.id, message: 'Existing match found, reusing chat.' });
    }

    // 新しいマッチングドキュメントを作成
    const newMatchRef = await adminDb.collection('matches').add({
      companyUid: companyUid,
      userUid: userUid,
      status: 'pending_contact_exchange', // 初期ステータスを設定
      jobTitle: jobTitle || '求人情報なし', // どの求人からのマッチングか
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      companyContactExchanged: false, // 企業が連絡先を交換したか
      userContactExchanged: false,   // 求職者が連絡先を交換したか
    });

    // ここで求職者に通知を送るロジックを追加することも可能（例: メール、プッシュ通知）
    // 例: sendNotificationToUser(userUid, `新しい企業があなたとのチャットを開始しました！`);

    return res.status(200).json({ matchId: newMatchRef.id, message: 'New match initiated successfully.' });

  } catch (error: any) {
    console.error('Error initiating match:', error);
    return res.status(500).json({ error: error.message || 'Failed to initiate match.' });
  }
}