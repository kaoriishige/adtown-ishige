// scripts/createServiceAccountFile.js
const fs = require('fs');
const path = require('path');

// 分割された環境変数と、その他の必要な変数を読み込む
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKeyPart1 = process.env.FIREBASE_PRIVATE_KEY_PART1 || '';
const privateKeyPart2 = process.env.FIREBASE_PRIVATE_KEY_PART2 || '';

// 必要な変数が設定されているかチェック
if (!projectId || !clientEmail || !privateKeyPart1 || !privateKeyPart2) {
  console.error('❌ Error: Required Firebase environment variables (PROJECT_ID, CLIENT_EMAIL, PRIVATE_KEY_PART1/2) are not set.');
  process.exit(1);
}

// 分割された秘密鍵を結合して、完全な秘密鍵を復元
const privateKey = privateKeyPart1 + privateKeyPart2;

// サービスアカウントのJSONオブジェクトをプログラムで再構築
const serviceAccountJson = {
  type: "service_account",
  project_id: projectId,
  private_key: privateKey.replace(/\\n/g, '\n'), // ここで初めて改行を元に戻す
  client_email: clientEmail,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(clientEmail)}`,
  universe_domain: "googleapis.com"
};

// Netlify Functions が参照するパスにファイルを出力
const destDir = path.resolve(process.cwd(), '.netlify/functions/');
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}
const destPath = path.join(destDir, 'serviceAccountKey.json');

fs.writeFileSync(destPath, JSON.stringify(serviceAccountJson, null, 2));
console.log('✅ Service Account Key file created successfully from split environment variables.');