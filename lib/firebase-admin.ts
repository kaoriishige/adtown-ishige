import * as admin from 'firebase-admin';

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
    console.log("環境変数を使ってFirebase Adminを初期化します...");

    // Netlifyの環境変数から直接サービスアカウント情報を構築します
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Netlifyの環境変数では改行が `\\n` になるため、`\n` に置換します
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    };

    // 必須の環境変数が設定されているか確認します
    if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
      throw new Error('Firebase Admin SDKの初期化に必要な環境変数が設定されていません。');
    }

    // 構築した情報を使って初期化します
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    return app;

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