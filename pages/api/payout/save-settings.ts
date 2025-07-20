// pages/api/payout/save-settings.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { admin } from '../../../lib/firebase-admin';
import nookies from 'nookies';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  try {
    // ユーザー認証
    const cookies = nookies.get({ req });
    const token = await admin.auth().verifyIdToken(cookies.token);
    const { uid } = token;

    // フロントエンドから送信された口座情報を取得
    const { bankName, branchName, accountType, accountNumber, accountHolderName } = req.body;

    // 簡単なバリデーション
    if (!bankName || !branchName || !accountType || !accountNumber || !accountHolderName) {
      return res.status(400).json({ error: 'すべての項目を入力してください。' });
    }

    const db = admin.firestore();
    const userDocRef = db.collection('users').doc(uid);

    // ユーザーのドキュメントに、payoutInfoというマップ（オブジェクト）で口座情報を保存
    await userDocRef.set({
      payoutInfo: {
        bankName,
        branchName,
        accountType,
        accountNumber,
        accountHolderName,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }
    }, { merge: true }); // merge: true で他のユーザー情報を上書きしないようにする

    res.status(200).json({ success: true, message: '口座情報を保存しました。' });

  } catch (error: any) {
    console.error("Payout settings save error:", error);
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
      return res.status(401).json({ error: '認証エラーが発生しました。再度ログインしてください。' });
    }
    res.status(500).json({ error: error.message });
  }
};

export default handler;