import { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '../../../lib/firebase-admin'; // 共通ファイルをインポート

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // POSTメソッド以外は許可しない
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { uid, email, name, kana } = req.body;
    // 必須項目があるかチェック
    if (!uid || !email) {
      return res.status(400).json({ error: 'uid and email are required' });
    }

    const adminDb = getAdminDb();
    
    // Firestoreのusersコレクションに新しいドキュメントを作成
    await adminDb.collection('users').doc(uid).set({
      email: email,
      name: name || '', // 名前がなくてもエラーにならないように
      kana: kana || '', // カナがなくてもエラーにならないように
      subscriptionStatus: 'incomplete', // 決済前の初期ステータス
      createdAt: new Date(),
    }, { merge: true }); // もし既存でも情報をマージする

    res.status(200).json({ success: true });

  } catch (error: any) {
    console.error('Error creating user document:', error);
    res.status(500).json({ error: error.message });
  }
}