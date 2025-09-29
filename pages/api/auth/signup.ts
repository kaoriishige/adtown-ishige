import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, getAdminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

// --- ★★★ ここを修正 ★★★ ---
// Next.jsのAPIとして正しく機能するように、export default function handler(...) の形式に修正
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email, password, name, kana } = req.body;

  try {
    const adminAuth = adminAuth();
    const adminDb = getAdminDb();
    
    const userRecord = await adminAuth.createUser({
      email: email,
      password: password,
      displayName: name,
    });

    const uid = userRecord.uid;

    await adminDb.collection('users').doc(uid).set({
      email: email,
      name: name,
      kana: kana,
      role: 'user', // 一般ユーザーの役割を割り当てる
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).json({ uid: uid });

  } catch (error: any) {
    console.error('User account creation error:', error);
    let errorMessage = '登録に失敗しました。';
    if (error.code === 'auth/email-already-exists') {
      errorMessage = 'このメールアドレスは既に使用されています。';
    }
    res.status(400).json({ error: errorMessage });
  }
}