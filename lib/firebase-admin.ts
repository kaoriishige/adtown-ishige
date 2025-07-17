// lib/firebase-admin.ts

import * as admin from 'firebase-admin';

// サービスアカウントキーのJSON文字列
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

// 環境変数が設定されていない場合はエラーを投げる
if (!serviceAccountJson) {
  throw new Error('The FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set.');
}

const serviceAccount = JSON.parse(serviceAccountJson);

// Appが初期化済みでない場合のみ初期化する
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// 初期化したadminインスタンスをエクスポート
export { admin };

