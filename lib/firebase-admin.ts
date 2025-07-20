// lib/firebase-admin.ts

import * as admin from 'firebase-admin';

// Netlifyから分割されたキーを読み込む
const part1 = process.env.FIREBASE_KEY_PART_1;
const part2 = process.env.FIREBASE_KEY_PART_2;
const part3 = process.env.FIREBASE_KEY_PART_3;

// 3つのパートがすべて存在するかチェック
if (!part1 || !part2 || !part3) {
  throw new Error('One or more parts of the Firebase service account key are missing.');
}

// 3つのパートを合体させて、元の長い文字列に戻す
const base64ServiceAccount = part1 + part2 + part3;

try {
  // 安全な文字列を、元の秘密鍵の形に復元する
  const serviceAccountJson = Buffer.from(base64ServiceAccount, 'base64').toString('utf-8');
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