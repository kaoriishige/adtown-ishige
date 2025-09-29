import type { NextApiRequest, NextApiResponse } from 'next';
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
function adminAuth(): admin.auth.Auth | null {
  try {
    if (!app) initializeFirebaseAdmin();
    return admin.auth(app!);
  } catch (e) { return null; }
}
function adminDb(): admin.firestore.Firestore | null {
  try {
    if (!app) initializeFirebaseAdmin();
    return admin.firestore(app!);
  } catch (e) { return null; }
}
// --- ここまでが直接書き込んだコード ---

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const adminAuth = adminAuth();
  const adminDb = adminDb();

  if (!adminAuth || !adminDb) {
    return res.status(500).json({ error: 'Firebase Admin SDK not initialized' });
  }

  try {
    const cookies = nookies.get({ req });
    if (!cookies.token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const decodedToken = await adminAuth.verifyIdToken(cookies.token);
    const { uid } = decodedToken;

    // Firestoreからユーザー情報を取得
    const userDocRef = adminDb.collection('users').doc(uid);
    const userDocSnap = await userDocRef.get();
    
    if (!userDocSnap.exists) {
        return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDocSnap.data();
    
    res.status(200).json({
      email: userData?.email,
      // 他に必要なマイページ情報があればここに追加
    });
  } catch (error) {
    console.error('API Error in mypage/get-data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}