// scripts/createServiceAccountFile.js
const fs = require('fs');
const path = require('path');

// --- 【ここを修正します！】 ---
// Base64エンコードされた秘密鍵の文字列を直接埋め込みます。
// ※ 注意: JSONファイルからコピーした private_key の値を、Base64エンコードツールで変換した結果を、
//        バッククォート (`) で囲んでここに貼り付けてください。
// ※ このコードは一時的なテスト用であり、本番環境では絶対にコミットしないでください！
const privateKeyBase64 = `【ここに、Base64エンコードされた長い1行の文字列を貼り付け】`;

let privateKey;
try {
  // Base64デコードして、元の秘密鍵の文字列に戻します
  privateKey = Buffer.from(privateKeyBase64, 'base64').toString('ascii');
  // 念のため、デコードした秘密鍵の先頭と末尾をログ出力
  console.log('Decoded Private Key Start:', privateKey.substring(0, 50));
  console.log('Decoded Private Key End:', privateKey.substring(privateKey.length - 50));
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
  "private_key": privateKey, // ← デコードされた privateKey を使う
  "client_email": clientEmail,
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(clientEmail)}`,
  "universe_domain": "googleapis.com"
};

const outputPath = path.resolve(process.cwd(), '.netlify', 'functions', 'serviceAccountKey.json');
const outputDir = path.dirname(outputPath);

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

try {
  fs.writeFileSync(outputPath, JSON.stringify(serviceAccount, null, 2));
  console.log('--- Netlify Build Script: Creating Service Account Key File ---');
  console.log('Service Account Key file created at:', outputPath);
  console.log('--- End Service Account Key File Creation ---');
} catch (error) {
  console.error('--- Netlify Build Script Error: Failed to create Service Account Key File ---');
  console.error(error);
  process.exit(1);
}