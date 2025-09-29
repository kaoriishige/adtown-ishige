import type { NextApiRequest, NextApiResponse } from 'next';
import { Parser } from 'json2csv';
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
function adminAuth: admin.auth.Auth | null {
  try {
    if (!app) initializeFirebaseAdmin();
    return admin.auth(app!);
  } catch (e) { return null; }
}
// --- ここまでが直接書き込んだコード ---

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const adminAuth = adminAuth;
  if (!adminAuth) {
    return res.status(500).json({ error: 'Firebase Admin SDK not initialized' });
  }

  try {
    // 管理者認証
    const cookies = nookies.get({ req });
    if (!cookies.token) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }
    const token = await adminAuth.verifyIdToken(cookies.token);
    // adminカスタムクレームをチェック
    if (token.admin !== true) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    // 全てのユーザー情報を取得
    const listUsersResult = await adminAuth.listUsers(1000); // 最大1000件
    const users = listUsersResult.users.map(userRecord => {
      return {
        uid: userRecord.uid,
        email: userRecord.email,
        emailVerified: userRecord.emailVerified,
        displayName: userRecord.displayName,
        photoURL: userRecord.photoURL,
        disabled: userRecord.disabled,
        creationTime: new Date(userRecord.metadata.creationTime).toLocaleString('ja-JP'),
        lastSignInTime: new Date(userRecord.metadata.lastSignInTime).toLocaleString('ja-JP'),
      };
    });

    // CSVに変換
    const fields = ['uid', 'email', 'displayName', 'creationTime', 'lastSignInTime', 'disabled'];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(users);

    // CSVファイルをダウンロードさせる
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
    res.status(200).send(csv);

  } catch (error) {
    console.error('Error exporting users:', error);
    res.status(500).json({ error: 'Failed to export users data' });
  }
}