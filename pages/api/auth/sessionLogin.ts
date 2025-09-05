import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminAuth, getAdminDb } from '../../../lib/firebase-admin';
import nookies from 'nookies';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  
  const { idToken } = req.body;
  if (!idToken) return res.status(400).json({ error: 'ID token is required.' });

  try {
    const decodedToken = await getAdminAuth().verifyIdToken(idToken);
    const { uid } = decodedToken;

    // ▼▼▼ 【重要】データベースからユーザー情報を取得する処理を修正 ▼▼▼
    const userDoc = await getAdminDb().collection('users').doc(uid).get();

    // ユーザー情報が存在しない場合はエラーとする（ログイン処理はユーザーを作成しない）
    if (!userDoc.exists) {
        console.error(`Session login error: User document for UID ${uid} not found in Firestore.`);
        throw new Error('User data not found.');
    }
    
    const userData = userDoc.data();
    const userRole = userData?.role || 'user';
    // ▲▲▲ ここまで ▲▲▲

    const expiresIn = 60 * 60 * 24 * 14 * 1000; // 14 days
    const sessionCookie = await getAdminAuth().createSessionCookie(idToken, { expiresIn });
    const options = { maxAge: expiresIn, httpOnly: true, secure: process.env.NODE_ENV === 'production', path: '/' };
    nookies.set({ res }, 'token', sessionCookie, options);

    return res.status(200).json({ success: true, role: userRole });

  } catch (error) {
    console.error('Session login error:', error);
    return res.status(401).json({ error: 'Authentication failed.' });
  }
}


