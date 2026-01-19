import { NextApiRequest, NextApiResponse } from 'next';
import * as admin from 'firebase-admin';

// Firebase Adminの二重初期化を防止
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // 改行コードの処理を含めて秘密鍵を読み込む
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

const db = admin.firestore();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { uid, storeName, contactPerson, address, phoneNumber, email, serviceType } = req.body;

  // バリデーション
  if (!uid || !email) {
    return res.status(400).json({ error: '必須項目（UID/Email）が不足しています' });
  }

  try {
    // usersコレクションの参照
    const userRef = db.collection('users').doc(uid);

    // merge: true を指定して、既存のデータを保持したまま新しい属性を追加
    await userRef.set({
      storeName: storeName || "",
      contactPerson: contactPerson || "",
      address: address || "",
      phoneNumber: phoneNumber || "",
      email: email,
      // 権限管理用のフラグをセット
      roles: {
        [serviceType]: true, 
        isPartner: true
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    return res.status(200).json({ message: 'Success' });
  } catch (error: any) {
    console.error('Firestore Admin Error:', error);
    return res.status(500).json({ error: 'データベースの更新に失敗しました: ' + error.message });
  }
}