import * as admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

// Appが初期化済みかどうかのフラグ
let app: admin.app.App | null = null;

// Firebase Admin SDKを初期化する関数
const initializeFirebaseAdmin = (): admin.app.App => {
  // すでに初期化済みの場合は、既存のインスタンスを返す
  if (admin.apps.length > 0) {
    app = admin.app();
    return app;
  }

  try {
    // ★★★ ここからが修正点 ★★★
    // まず、Netlifyのビルド時に生成される一時ファイルを試す
    const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');
    if (fs.existsSync(serviceAccountPath)) {
      console.log("serviceAccountKey.jsonファイルを使ってFirebase Adminを初期化します...");
      app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccountPath),
      });
      return app;
    }

    // 次に、環境変数を試す（ローカル開発や実行時に使われる）
    const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    if (serviceAccountBase64) {
      console.log("環境変数を使ってFirebase Adminを初期化します...");
      const serviceAccountJson = Buffer.from(serviceAccountBase64, 'base64').toString('utf-8');
      const serviceAccount = JSON.parse(serviceAccountJson);
      app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      return app;
    }
    // ★★★ ここまでが修正点 ★★★

    throw new Error('Firebase Admin SDKの認証情報が見つかりませんでした。');

  } catch (error) {
    console.error("Firebase Admin SDKの初期化に失敗しました:", error);
    app = null; 
    throw error;
  }
};

// Authインスタンスを取得する関数
export const getAdminAuth = (): admin.auth.Auth | null => {
  try {
    if (!app) initializeFirebaseAdmin();
    return admin.auth(app!);
  } catch (e) { return null; }
};

// Firestoreインスタンスを取得する関数
export const getAdminDb = (): admin.firestore.Firestore | null => {
  try {
    if (!app) initializeFirebaseAdmin();
    return admin.firestore(app!);
  } catch (e) { return null; }
};