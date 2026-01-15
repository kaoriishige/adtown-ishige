import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { uid, email, referrerId, name, address, phoneNumber } = req.body || {};

  if (!uid || !email) {
    return res.status(400).json({ error: 'ユーザーUIDとメールアドレスが必要です。' });
  }

  try {
    // カスタムクレームに roles（配列）を入れておく（adminAuth 側で利用）
    await adminAuth.setCustomUserClaims(uid, {
      roles: ['user'],
      role: 'user', // 互換性のために入れておく
    });

    // Firestore にユーザー情報を保存（roles を配列で保持）
    await adminDb.collection('users').doc(uid).set({
      email: email,
      role: 'user',
      roles: ['user'],
      referrerId: referrerId || null,
      name: name || null,
      address: address || null,
      phoneNumber: phoneNumber || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    return res.status(200).json({ uid: uid, message: 'ユーザー情報が正常に作成されました。' });
  } catch (error: any) {
    console.error('Firebase user data creation error:', error);
    return res.status(500).json({ error: 'ユーザー情報の作成中にサーバーエラーが発生しました。' });
  }
}
