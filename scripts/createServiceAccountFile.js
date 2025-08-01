// scripts/createServiceAccountFile.js
const fs = require('fs');
const path = require('path');

// 環境変数が存在するかチェック
if (!process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
  console.error('❌ Error: Required Firebase environment variables are not set.');
  console.error('Please set FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL, and NEXT_PUBLIC_FIREBASE_PROJECT_ID in Netlify.');
  process.exit(1); // エラーでビルドを停止
}

// Netlifyの環境変数からサービスアカウント情報を構築
const serviceAccountJson = {
  "type": "service_account",
  "project_id": process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  "private_key_id": process.env.FIREBASE_PRIVATE_KEY_ID, // この変数はなくても動作することが多い
  "private_key": process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Netlify用に改行を元に戻す
  "client_email": process.env.FIREBASE_CLIENT_EMAIL,
  "client_id": process.env.FIREBASE_CLIENT_ID, // この変数はなくても動作することが多い
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.FIREBASE_CLIENT_EMAIL)}`,
  "universe_domain": "googleapis.com"
};

// Netlify Functions が参照するパスにファイルを出力
const functionsDir = path.resolve(process.cwd(), '.netlify', 'functions');
if (!fs.existsSync(functionsDir)) {
  fs.mkdirSync(functionsDir, { recursive: true });
}
const outputPath = path.join(functionsDir, 'serviceAccountKey.json');

fs.writeFileSync(outputPath, JSON.stringify(serviceAccountJson, null, 2));
console.log('✅ Service Account Key file created successfully from environment variables.');