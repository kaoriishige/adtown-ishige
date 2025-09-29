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
function adminAuth: admin.auth.Auth | null {
  try {
    if (!app) initializeFirebaseAdmin();
    return admin.auth(app!);
  } catch (e) { return null; }
}
function adminDb: admin.firestore.Firestore | null {
  try {
    if (!app) initializeFirebaseAdmin();
    return admin.firestore(app!);
  } catch (e) { return null; }
}
// --- ここまでが直接書き込んだコード ---

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  const adminAuth = adminAuth;
  const adminDb = adminDb;

  if (!adminAuth || !adminDb) {
    return res.status(500).json({ error: 'Firebase Admin SDK not initialized' });
  }

  try {
    // ユーザーを認証し、管理者か確認
    const cookies = nookies.get({ req });
    if (!cookies.token) {
        return res.status(401).json({ error: 'No token provided' });
    }
    const token = await adminAuth.verifyIdToken(cookies.token);
    
    // adminカスタムクレームをチェック
    if (token.admin !== true) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const { inquiryId, status } = req.body;
    if (!inquiryId || !status) {
      return res.status(400).json({ error: 'IDとステータスが必要です。' });
    }

    // Firestoreのお問い合わせドキュメントを更新
    await adminDb.collection('inquiries').doc(inquiryId).update({ status });

    res.status(200).json({ success: true, message: 'ステータスを更新しました。' });

  } catch (error) {
    console.error('ステータス更新に失敗:', error);
    res.status(500).json({ error: 'サーバー側でエラーが発生しました。' });
  }
}