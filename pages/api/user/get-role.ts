import type { NextApiRequest, NextApiResponse } from 'next';
import nookies from 'nookies';
import * as admin from 'firebase-admin'; // firebase-adminを直接インポート

// --- ここからが直接書き込んだコード ---

// Firebase Appのインスタンスを保持する変数
let app: admin.app.App | null = null;

// Firebase Admin SDKを初期化する関数
function initializeFirebaseAdmin(): admin.app.App {
  // すでに初期化済みの場合は、既存のインスタンスを返す
  if (admin.apps.length > 0) {
    app = admin.app();
    return app;
  }

  // 環境変数から認証情報を取得
  const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (!serviceAccountBase64) {
    throw new Error('環境変数 FIREBASE_SERVICE_ACCOUNT_BASE64 が設定されていません。');
  }

  // Base64をデコードしてJSONに戻す
  const serviceAccountJson = Buffer.from(serviceAccountBase64, 'base64').toString('utf-8');
  const serviceAccount = JSON.parse(serviceAccountJson);

  // Firebase Adminを初期化
  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  return app;
}

// Authインスタンスを取得するための関数
function getAdminAuth(): admin.auth.Auth | null {
  try {
    if (!app) {
      initializeFirebaseAdmin();
    }
    return admin.auth(app!);
  } catch (e) {
    console.error("getAdminAuthの初期化でエラー:", e);
    return null;
  }
}

// --- ここまでが直接書き込んだコード ---


// 返却するデータの型を定義します
interface ResponseData {
  role?: 'admin' | 'user';
  error?: string;
}

// APIのメイン処理
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  const adminAuth = getAdminAuth();

  if (!adminAuth) {
    return res.status(500).json({ error: 'サーバー内部でFirebaseの初期化に失敗しました。' });
  }

  try {
    const cookies = nookies.get({ req });

    if (!cookies.token) {
      return res.status(401).json({ error: '認証トークンがありません。' });
    }
    
    const token = await adminAuth.verifyIdToken(cookies.token);
    
    const role = token.admin === true ? 'admin' : 'user';

    res.status(200).json({ role });

  } catch (error) {
    console.error('get-role APIでのトークン検証エラー:', error);
    res.status(401).json({ error: '認証トークンが無効か、有効期限が切れています。' });
  }
}