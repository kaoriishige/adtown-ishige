import { NextApiRequest, NextApiResponse } from 'next';
import * as admin from 'firebase-admin';

// Firebase Adminの二重初期化を防止
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

const db = admin.firestore();
const auth = admin.auth();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { companyName, contactPerson, address, area, phoneNumber, email, password, serviceType } = req.body;

  // バリデーション
  if (!companyName || !email || !password) {
    return res.status(400).json({ error: '必須項目（企業名/Email/Password）が不足しています' });
  }

  try {
    // ステップ1: Firebase Authenticationユーザーを作成
    let userRecord;
    try {
      userRecord = await auth.createUser({
        email: email,
        password: password,
        displayName: companyName,
      });
    } catch (authError: any) {
      if (authError.code === 'auth/email-already-exists') {
        return res.status(400).json({ error: 'このメールアドレスは既に登録されています' });
      }
      throw authError;
    }

    const uid = userRecord.uid;

    // ステップ2: Firestoreにパートナーデータを保存
    const userRef = db.collection('users').doc(uid);

    await userRef.set({
      companyName: companyName,
      contactPerson: contactPerson || "",
      address: address || "",
      area: area || "",
      phoneNumber: phoneNumber || "",
      email: email,
      roles: {
        [serviceType || 'recruit']: true,
        isPartner: true
      },
      plan: 'recruit-6600',
      paymentStatus: 'pending', // 決済待ちステータス
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // ステップ3: partnerId（uid）を返す
    return res.status(200).json({
      success: true,
      message: 'パートナー仮登録が完了しました',
      partnerId: uid
    });
  } catch (error: any) {
    console.error('Registration Error:', error);
    return res.status(500).json({ error: 'パートナー登録に失敗しました: ' + error.message });
  }
}