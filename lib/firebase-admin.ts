import * as admin from 'firebase-admin';

// Firebase Admin SDK の App インスタンスを保持する変数（シングルトンパターン）
let app: admin.app.App | null = null;

/**
 * Firebase Admin を初期化する関数
 * - すでに初期化されていれば再利用
 * - 環境変数からサービスアカウント情報を読み込む
 */
function initializeFirebaseAdmin(): admin.app.App {
  if (admin.apps.length > 0) {
    // すでに初期化済みなら既存の App を返す
    app = admin.app();
    return app;
  }

  // 環境変数からサービスアカウント情報を作成
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  };

  // 必須の値が設定されているかチェック
  if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
    throw new Error(
      'Firebase Admin SDK の認証情報が不足しています。' +
        'FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY を確認してください。'
    );
  }

  // 初期化
  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  return app;
}

/**
 * Firestore インスタンスを返す
 */
export function getAdminDb(): admin.firestore.Firestore {
  if (!app) {
    initializeFirebaseAdmin();
  }
  return admin.firestore(app!);
}

/**
 * Auth インスタンスを返す
 */
export function getAdminAuth(): admin.auth.Auth {
  if (!app) {
    initializeFirebaseAdmin();
  }
  return admin.auth(app!);
}
export { admin };
// ▼▼▼ 以下をファイルの一番下に追加 ▼▼▼
/**
 * Storage Bucket インスタンスを返す
 */
export function getAdminStorageBucket() {
  if (!app) {
    initializeFirebaseAdmin();
  }
  // 環境変数に応じて、ご自身のバケットURLに変更してください
  // 通常は 'プロジェクトID.appspot.com' です
  const bucketName = `${process.env.FIREBASE_PROJECT_ID}.appspot.com`;
  return admin.storage(app!).bucket(bucketName);
}