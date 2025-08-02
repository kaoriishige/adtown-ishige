import { NextApiRequest, NextApiResponse } from 'next';
import nookies from 'nookies';
import * as admin from 'firebase-admin'; // firebase-adminを直接インポート

// --- ここからが直接書き込んだコード ---
let app: admin.app.App | null = null;
function initializeFirebaseAdmin(): admin.app.App {
  if (admin.apps.length > 0) {
    app = admin.app();
    return app;
  }
  const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (!serviceAccountBase64) {
    throw new Error('環境変数 FIREBASE_SERVICE_ACCOUNT_BASE64 が設定されていません。');
  }
  const serviceAccountJson = Buffer.from(serviceAccountBase64, 'base64').toString('utf-8');
  const serviceAccount = JSON.parse(serviceAccountJson);
  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  return app;
}
function getAdminAuth(): admin.auth.Auth | null {
  try {
    if (!app) initializeFirebaseAdmin();
    return admin.auth(app!);
  } catch (e) { return null; }
}
// --- ここまでが直接書き込んだコード ---

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const adminAuth = getAdminAuth();
  if (!adminAuth) {
    return res.status(500).json({ error: 'Firebase Admin not initialized' });
  }

  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ error: 'ID token is required.' });
    }

    // セッションの有効期限を5日間に設定
    const expiresIn = 60 * 60 * 24 * 5 * 1000;
    // セッションCookieを作成
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    // Cookieのオプションを設定
    const options = {
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    };
    
    // Cookieをブラウザに設定
    nookies.set({ res }, 'token', sessionCookie, options);

    res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('Error creating session cookie:', error);
    res.status(401).json({ error: 'Unauthorized' });
  }
}
