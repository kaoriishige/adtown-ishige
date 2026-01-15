import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

export default async function registerPartnerHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const {
    uid, // フロントエンドの Firebase Auth で作成したUID
    storeName,
    contactPerson,
    address,
    phoneNumber,
    email,
    serviceType = 'adver'
  } = req.body;

  if (!uid || !email || !storeName) {
    return res.status(400).json({ error: '必須項目が不足しています。' });
  }

  try {
    const userDocRef = adminDb.collection('users').doc(uid);

    // LPの入力内容をFirestoreに保存
    const partnerData = {
      uid,
      email,
      storeName, // LPの項目名に合わせる
      companyName: storeName, // 既存システムとの互換性のため
      contactPerson,
      address,
      phoneNumber,
      roles: admin.firestore.FieldValue.arrayUnion(serviceType),
      isPaid: false, // 決済前なのでfalse
      [`${serviceType}SubscriptionStatus`]: 'pending', // 決済待ち状態
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await userDocRef.set(partnerData, { merge: true });

    // カスタムクレームの設定（ロール付与）
    await adminAuth.setCustomUserClaims(uid, {
      roles: [serviceType],
      paid: false
    });

    return res.status(200).json({ message: 'Success', uid });
  } catch (error: any) {
    console.error('Firestore registration error:', error);
    return res.status(500).json({ error: error.message });
  }
}