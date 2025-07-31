import type { NextApiRequest, NextApiResponse } from 'next';
import admin from '../../../lib/firebase-admin';
import nookies from 'nookies';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }
  
  try {
    // ユーザーを認証し、管理者か確認
    const cookies = nookies.get({ req });
    const token = await admin.auth().verifyIdToken(cookies.token);
    if (!token.admin) {
      return res.status(403).json({ error: '権限がありません。' });
    }

    const { inquiryId, status } = req.body;
    if (!inquiryId || !status) {
      return res.status(400).json({ error: 'IDとステータスが必要です。' });
    }

    // Firestoreのお問い合わせドキュメントを更新
    const db = admin.firestore();
    await db.collection('inquiries').doc(inquiryId).update({ status });

    res.status(200).json({ success: true, message: 'ステータスを更新しました。' });

  } catch (error) {
    console.error('ステータス更新に失敗:', error);
    res.status(500).json({ error: 'サーバー側でエラーが発生しました。' });
  }
}