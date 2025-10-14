import * as admin from 'firebase-admin';

// サービスアカウントキーのJSONを環境変数から読み込む
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

// 既に初期化済みでないかチェック
if (!admin.apps.length) {
  if (!serviceAccountJson) {
    throw new Error(
      'Firebase Admin SDKの初期化エラー: 環境変数 "FIREBASE_SERVICE_ACCOUNT_JSON" が設定されていません。'
    );
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(serviceAccountJson)),
    });
    console.log('Firebase Admin SDK Initialized.');
  } catch (e) {
    console.error('Firebase Admin SDK initialization error:', e);
  }
}

// 初期化済みのインスタンスを直接エクスポートする
const adminDb = admin.firestore();
const adminAuth = admin.auth();

export { adminDb, adminAuth };