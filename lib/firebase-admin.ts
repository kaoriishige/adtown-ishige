import * as admin from 'firebase-admin';

// Appが初期化済みかどうかを保持する変数
let app: admin.app.App | null = null;

// Firebase Admin SDKを初期化する関数
function initializeFirebaseAdmin(): admin.app.App {
  // すでに初期化されている場合は、既存のものを返す
  if (admin.apps.length > 0) {
    app = admin.app();
    return app;
  }

  // 環境変数から認証情報を取得
  const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (!serviceAccountBase64) {
    throw new Error('環境変数 FIREBASE_SERVICE_ACCOUNT_BASE64 が設定されていません。');
  }

  // Base64形式の認証情報をデコードしてJSONに戻す
  const serviceAccountJson = Buffer.from(serviceAccountBase64, 'base64').toString('utf-8');
  const serviceAccount = JSON.parse(serviceAccountJson);

  // Firebase Adminを初期化
  console.log("Firebase Admin SDKを初期化します...");
  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log("Firebase Admin SDKの初期化が完了しました。");
  return app;
}

// Authインスタンスを取得するための関数
export function getAdminAuth(): admin.auth.Auth {
  if (!app) {
    initializeFirebaseAdmin();
  }
  return admin.auth(app!);
}

// Firestoreインスタンスを取得するための関数
export function getAdminDb(): admin.firestore.Firestore {
  if (!app) {
    initializeFirebaseAdmin();
  }
  return admin.firestore(app!);
}