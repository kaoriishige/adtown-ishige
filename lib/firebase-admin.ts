import * as admin from 'firebase-admin';

// シングルトンパターンでFirebase Adminの重複初期化を防ぐ
let app: admin.app.App | null = null;

function initializeFirebaseAdmin(): admin.app.App {
  if (admin.apps.length > 0) {
    app = admin.app();
    return app;
  }
  
  // 3つの環境変数から認証情報オブジェクトを作成
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    // 環境変数から秘密鍵を読み込む際の改行処理
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  };

  // 必須の環境変数が設定されているか確認
  if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
    throw new Error('Firebaseの環境変数（PROJECT_ID, CLIENT_EMAIL, PRIVATE_KEY）が設定されていません。');
  }

  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  return app;
}

// 他のファイルから使えるように、関数をエクスポートする
export function getAdminDb(): admin.firestore.Firestore {
  if (!app) initializeFirebaseAdmin();
  return admin.firestore(app!);
}

export function getAdminAuth(): admin.auth.Auth {
  if (!app) initializeFirebaseAdmin();
  return admin.auth(app!);
}