// pages/api/auth/register.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { email, password, displayName, role } = req.body;

    if (!email || !password || !displayName || !role) {
      return res.status(400).json({ message: '必須項目が不足しています。' });
    }

    // 既存ユーザー確認
    const existingUser = await adminAuth.getUserByEmail(email).catch(() => null);

    if (existingUser) {
      const userDocRef = adminDb.collection('users').doc(existingUser.uid);
      const userDoc = await userDocRef.get();
      const existingRoles = userDoc.data()?.roles || [];

      if (!existingRoles.includes(role)) {
        await userDocRef.update({
          roles: FieldValue.arrayUnion(role),
        });
      }

      return res.status(200).json({
        uid: existingUser.uid,
        message: '既存ユーザーに新しいロールを追加しました。',
      });
    }

    // 新規ユーザー作成
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName,
    });

    await adminDb.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email,
      displayName,
      roles: [role],
      createdAt: FieldValue.serverTimestamp(),
    });

    return res.status(201).json({
      uid: userRecord.uid,
      message: '新規ユーザーを作成しました。',
    });
  } catch (error: any) {
    console.error('Registration API Error:', error);
    return res.status(500).json({
      message: 'ユーザー登録中にサーバーエラーが発生しました。',
      error: error.message,
    });
  }
}
