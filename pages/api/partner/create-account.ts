import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { 
    email, 
    password, 
    storeName, 
    address, 
    contactPerson, 
    phoneNumber, 
    qrStandCount, 
    category 
  } = req.body;

  // バリデーション
  if (!email || !password || !storeName || !address || !contactPerson || !phoneNumber || qrStandCount == null || !category) {
    return res.status(400).json({ error: 'すべての必須項目を入力してください。' });
  }

  if (qrStandCount < 0) {
    return res.status(400).json({ error: 'QRコードスタンドの個数は0以上の数値を入力してください。' });
  }

  try {
    // 1. Firebase Authenticationにユーザーを作成
    const userRecord = await getAdminAuth().createUser({
      email: email,
      password: password,
      displayName: storeName,
    });

    // 2. Firestoreの'users'コレクションに追加情報を保存
    await getAdminDb().collection('users').doc(userRecord.uid).set({
      email: email,
      storeName: storeName,
      address: address,
      contactPerson: contactPerson,
      phoneNumber: phoneNumber,
      qrStandCount: Number(qrStandCount),
      category: category,
      role: 'partner',
      createdAt: new Date().toISOString(),
    });

    return res.status(201).json({ success: true, uid: userRecord.uid });

  } catch (error: any) {
    console.error('Partner creation error:', error);
    let errorMessage = '登録中にエラーが発生しました。';
    if (error.code === 'auth/email-already-exists') {
      errorMessage = 'このメールアドレスは既に使用されています。';
    } else if (error.code === 'auth/invalid-password') {
      errorMessage = 'パスワードは6文字以上で入力してください。';
    }
    return res.status(500).json({ error: errorMessage });
  }
}