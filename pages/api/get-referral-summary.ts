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
function getAdminDb(): admin.firestore.Firestore | null {
  try {
    if (!app) initializeFirebaseAdmin();
    return admin.firestore(app!);
  } catch (e) { return null; }
}
// --- ここまでが直接書き込んだコード ---

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const adminAuth = adminAuth();
  const adminDb = getAdminDb();

  if (!adminAuth || !adminDb) {
    return res.status(500).json({ error: 'Firebase Admin SDK not initialized' });
  }

  try {
    // ユーザーを認証
    const cookies = nookies.get({ req });
    if (!cookies.token) {
        return res.status(401).json({ error: 'No token provided' });
    }
    const token = await adminAuth.verifyIdToken(cookies.token);
    const { uid } = token;

    // Firestoreから紹介報酬データを取得
    const rewardsQuery = await adminDb.collection('referralRewards').where('referrerUid', '==', uid).get();

    let total = 0;
    let pending = 0;

    rewardsQuery.forEach(doc => {
      const data = doc.data();
      total += data.rewardAmount || 0;
      if (data.rewardStatus === 'pending') {
        pending += data.rewardAmount || 0;
      }
    });

    res.status(200).json({ total, pending });

  } catch (error) {
    console.error('紹介サマリーの取得に失敗:', error);
    res.status(401).json({ error: '認証エラー、またはデータの取得に失敗しました。' });
  }
}