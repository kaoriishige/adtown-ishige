import { NextApiRequest, NextApiResponse } from 'next';
import * as admin from 'firebase-admin';

// Firebase Admin SDKの初期化（別のファイルからインポートする）
import { getAdminAuth, getAdminDb } from '../../../lib/firebase-admin';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // POSTリクエスト以外は拒否
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const { storeName, contactPerson, email, password } = req.body;

  // 必要な情報が揃っているか確認
  if (!storeName || !contactPerson || !email || !password || password.length < 6) {
    return res.status(400).json({ error: '必須項目が不足しているか、パスワードが6文字未満です。' });
  }

  try {
    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();

    // 1. Firebase Authenticationにユーザーを作成
    const userRecord = await adminAuth.createUser({
      email: email,
      password: password,
      displayName: contactPerson, // 担当者名をdisplayNameに設定
    });

    // 2. カスタムクレームを設定して、役割を「パートナー」にする
    await adminAuth.setCustomUserClaims(userRecord.uid, { role: 'partner' });

    // 3. Firestoreのusersコレクションにパートナー情報を保存
    await adminDb.collection('users').doc(userRecord.uid).set({
      email: email,
      role: 'partner',
      partnerInfo: {
        storeName: storeName,
        contactPerson: contactPerson,
        address: '', // 住所は後からダッシュボードで登録してもらう
      },
      // パートナーの購読ステータスは最初から有効にするか、仕様に応じて設定
      // 無料で使ってもらう場合は'active'、そうでなければ別のステータスを検討
      subscriptionStatus: 'active',
      totalRewards: 0,
      unpaidRewards: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).json({ success: true, uid: userRecord.uid });

  } catch (error: any) {
    console.error('Partner creation failed:', error);
    // Firebaseから返されたエラーコードに応じて、より親切なメッセージを返す
    const errorMessage = error.code === 'auth/email-already-exists'
      ? 'このメールアドレスは既に使用されています。'
      : '登録に失敗しました。';
    res.status(500).json({ error: errorMessage });
  }
}