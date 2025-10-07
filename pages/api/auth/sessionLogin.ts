import { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from 'firebase-admin/auth';
import { adminDb, initializeAdminApp } from '@/lib/firebase-admin';
import { serialize } from 'cookie';

// Firebase Admin SDKを初期化
initializeAdminApp();
const adminAuth = getAuth();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '認証トークンがありません。' });
    }
    const idToken = authHeader.split('Bearer ')[1];
    
    const { loginType } = req.body;

    // トークンを検証
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // パートナーログインの場合、役割（role）を確認
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

    // セッションCookieを作成
    const expiresIn = 60 * 60 * 24 * 7 * 1000; // 7日間
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    // Cookieをシリアライズして設定
    const cookie = serialize('session', sessionCookie, {
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax', // ブラウザのセキュリティポリシーに対応
    });

    res.setHeader('Set-Cookie', cookie);
    return res.status(200).json({ status: 'success' });
    
  } catch (error: any) {
    console.error('sessionLogin Error:', error);
    return res.status(401).json({ error: 'セッションの作成に失敗しました。' });
  }
}





