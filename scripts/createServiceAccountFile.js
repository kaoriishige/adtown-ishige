// scripts/createServiceAccountFile.js
const fs = require('fs');
const path = require('path');

// --- 【ここを修正します！】 ---
// Netlifyの環境変数から、Base64エンコードされた秘密鍵を読み込みます
// 環境変数名も FIREBASE_PRIVATE_KEY_BASE64 など、区別できると良いでしょう
const privateKeyBase64 = process.env.FIREBASE_PRIVATE_KEY_BASE64; // Netlifyにこの変数名で設定
let privateKey;
try {
  // Base64デコードして、元の秘密鍵の文字列に戻します
  privateKey = Buffer.from(privateKeyBase64, 'base64').toString('ascii');
} catch (error) {
  console.error('--- Base64 Decode Error: Invalid FIREBASE_PRIVATE_KEY_BASE64 ---');
  console.error(error);
  process.exit(1); // デコード失敗でビルドを停止
}

// 環境変数は引き続き Netlify で設定する必要があります
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL; 
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID; 

const serviceAccount = {
  "type": "service_account",
  "project_id": projectId,
  "private_key": privateKey, // ← ここはデコードされた privateKey を使う
  "client_email": clientEmail,
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(clientEmail)}`,
  "universe_domain": "googleapis.com"
};

// ... 残りのコード（outputPath, outputDir, fs.writeFileSync, console.log, try-catch）はそのまま ...