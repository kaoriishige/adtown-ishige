import type { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '../../../lib/firebase-admin';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const { email, uid, referrerId } = req.body;

  if (!email || !uid) {
    return res.status(400).json({ error: 'Email and UID are required.' });
  }

  try {

    // 1. Firestoreにユーザードキュメントを作成
    await adminDb.collection('users').doc(uid).set({
      email: email,
      uid: uid,
      plan: 'free', // 無料プランを設定
      subscriptionStatus: 'free',
      createdAt: new Date().toISOString(),
      referrer: referrerId || null, // 紹介者IDがあれば保存
    });

    // 2. Firebase Authのカスタムクレイムを設定
    await adminAuth.setCustomUserClaims(uid, {
      plan: 'free',
    });

    res.status(200).json({ message: 'User created successfully.' });

  } catch (error) {
    console.error('Error creating free user:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}