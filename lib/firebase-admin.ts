// lib/firebase-admin.ts

import * as admin from 'firebase-admin';

// Netlifyから1行のJSON文字列を読み込む
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (!serviceAccountJson) {
  throw new Error('The FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set.');
}

try {
  const serviceAccount = JSON.parse(serviceAccountJson);

  // Appが初期化済みでない場合のみ初期化する
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
} catch (error) {
  console.error('Failed to initialize Firebase Admin SDK:', error);
  throw new Error('Could not initialize Firebase Admin SDK. Service account key might be invalid.');
}

// 初期化したadminインスタンスをエクスポート
export { admin };
