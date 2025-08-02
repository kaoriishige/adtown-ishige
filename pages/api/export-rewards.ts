import type { NextApiRequest, NextApiResponse } from 'next';
import { Parser } from 'json2csv';
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
function getAdminDb(): admin.firestore.Firestore | null {
  try {
    if (!app) initializeFirebaseAdmin();
    return admin.firestore(app!);
  } catch (e) { return null; }
}
// --- ここまでが直接書き込んだコード ---

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const adminAuth = getAdminAuth();
  const adminDb = getAdminDb();

  if (!adminAuth || !adminDb) {
    return res.status(500).json({ error: 'Firebase Admin SDK not initialized' });
  }

  try {
    // 管理者認証
    const cookies = req.cookies;
    if (!cookies.token) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }
    await adminAuth.verifyIdToken(cookies.token);

    // 全ての報酬データを取得
    const rewardsSnapshot = await adminDb.collection('referralRewards').get();
    const rewardsData = rewardsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            // Timestampを人間が読める形式に変換
            createdAt: data.createdAt.toDate().toLocaleString('ja-JP'),
        };
    });

    // CSVに変換
    const fields = ['id', 'referrerUid', 'referredUid', 'rewardAmount', 'rewardStatus', 'createdAt'];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(rewardsData);

    // CSVファイルをダウンロードさせる
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=rewards.csv');
    res.status(200).send(csv);

  } catch (error) {
    console.error('Error exporting rewards:', error);
    res.status(500).json({ error: 'Failed to export rewards data' });
  }
}