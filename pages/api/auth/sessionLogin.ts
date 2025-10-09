import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import nookies from 'nookies';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  // idToken を Authorization ヘッダ（Bearer）か body.idToken のどちらからでも受け取れるようにする
  let idToken = '';
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    idToken = authHeader.split(' ')[1];
  } else if (req.body?.idToken) {
    idToken = req.body.idToken;
  }

  if (!idToken) {
    return res.status(401).json({ error: 'Authorization header with Bearer token or body.idToken is required.' });
  }

  const { loginType = 'user' } = req.body || {};

  // 5日（ミリ秒）
  const expiresIn = 60 * 60 * 24 * 5 * 1000;

  try {
    // IDトークンを検証
    let decodedToken: any;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (tokenError) {
      console.error('verifyIdToken failed:', tokenError);
      return res.status(401).json({ error: 'Invalid ID token.' });
    }

    const uid = decodedToken.uid;
    if (!uid) {
      return res.status(400).json({ error: 'Invalid token payload.' });
    }

    // users ドキュメント確認
    const userDoc = await adminDb.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User data not found in database.' });
    }

    const userData = userDoc.data() || {};
    // Firestore 側で roles を配列で保持していることを前提（create-free-user で挿入）
    const userRoles: string[] = Array.isArray(userData.roles) ? userData.roles : (userData.role ? [userData.role] : []);

    // role に応じて許可判定
    if (loginType === 'user') {
      const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
      const isProd = process.env.NODE_ENV === 'production';

      // nookies を使って Cookie をセット（secure / httpOnly 等）
      nookies.set({ res }, 'session', sessionCookie, {
        maxAge: Math.floor(expiresIn / 1000),
        path: '/',
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
      });

      return res.status(200).json({ status: 'success' });
    }

    // partner/adver 等の判定（loginType が 'adver' などのとき）
    const hasRequiredRole = userRoles.includes(loginType) || userRoles.includes('partner');
    if (!hasRequiredRole) {
      const errorMsg =
        loginType === 'adver'
          ? 'このアカウントは広告パートナーとして登録されていません。'
          : 'このアカウントは求人パートナーとして登録されていません。';
      return res.status(403).json({ error: errorMsg });
    }

    // 必要な権限がある場合は session を作成してセット
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
    const isProd = process.env.NODE_ENV === 'production';
    nookies.set({ res }, 'session', sessionCookie, {
      maxAge: Math.floor(expiresIn / 1000),
      path: '/',
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
    });

    return res.status(200).json({ status: 'success' });
  } catch (error: any) {
    console.error('Session login error:', error);
    return res.status(500).json({ error: '認証に失敗しました。時間をおいて再度お試しください。' });
  }
}




