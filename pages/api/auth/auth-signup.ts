import type { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { email, password, displayName, role } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing email or password' });
    }

    // Firebase Authenticationでユーザーを作成
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName,
    });

    // Firestoreにユーザードキュメントを作成
    await adminDb.collection('users').doc(userRecord.uid).set({
      email: userRecord.email,
      name: userRecord.displayName,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      roles: [role || 'user'], // リクエストにロールが指定されていればそれを使用
      // 他の初期データ
    });

    return res.status(200).json({ message: 'User created successfully', uid: userRecord.uid });

  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ error: 'An error occurred' });
  }
}