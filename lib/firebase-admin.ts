// lib/firebase-admin.ts (診断用コード)

import * as admin from 'firebase-admin';

// --- ここから診断用コード ---
console.log('--- Netlifyの環境変数診断を開始します ---');
console.log('現在認識されているすべてのキー:', Object.keys(process.env));

const keyExists = !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
console.log('FIREBASE_SERVICE_ACCOUNT_KEYは存在しますか？:', keyExists);

if (keyExists) {
    console.log('キーの文字数:', process.env.FIREBASE_SERVICE_ACCOUNT_KEY!.length);
} else {
    console.log('キーが見つかりませんでした。NetlifyのUI設定を再確認してください。');
}
console.log('--- 診断を終了します ---');
// --- ここまで診断用コード ---


// Netlifyから安全な文字列（Base64）を読み込む
const base64ServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (!base64ServiceAccount) {
  throw new Error('The FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set.');
}

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
