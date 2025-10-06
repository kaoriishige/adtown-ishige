import { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from 'firebase-admin/auth';
import { adminDb, initializeAdminApp } from '@/lib/firebase-admin';

initializeAdminApp();
const adminAuth = getAuth();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { idToken, loginType } = req.body;

  if (!idToken) {
    return res.status(401).json({ error: 'IDトークンは必須です。' });
  }

  const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5日間

  try {
    // 通常は verifyIdToken(idToken) で十分
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    if (loginType && loginType !== 'user') {
      const userDoc = await adminDb.collection('users').doc(uid).get();
      if (!userDoc.exists) {
        return res.status(403).json({ error: 'ユーザー情報が存在しません。' });
      }
      const userRoles = userDoc.data()?.roles || [];
      if (!userRoles.includes(loginType)) {
        const serviceName = loginType === 'ad' ? '広告パートナー' : '求人パートナー';
        return res.status(403).json({ error: `このアカウントは${serviceName}として登録されていません。` });
      }
    }

    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
    const isProduction = process.env.NODE_ENV === 'production';

    res.setHeader('Set-Cookie', [
      `token=${sessionCookie}; Max-Age=${expiresIn / 1000}; Path=/; HttpOnly; SameSite=Lax${isProduction ? '; Secure' : ''}`
    ]);

    res.status(200).json({ status: 'success' });
  } catch (error: any) {
    console.error('Session login error:', error);
    res.status(401).json({ error: '認証に失敗しました: ' + error.message });
  }
}





