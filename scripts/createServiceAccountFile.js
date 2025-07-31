// scripts/createServiceAccountFile.js
const fs = require('fs');
const path = require('path');

let serviceAccount;

// Netlifyビルド環境では、プロジェクトのルートにあるJSONファイルを直接読み込む
// ローカル開発環境では、環境変数から読み込む
if (process.env.CONTEXT === 'production' && fs.existsSync(path.resolve(__dirname, '../../serviceAccountKey.json'))) {
    serviceAccount = require('../../serviceAccountKey.json');
} else {
    // 環境変数から情報を構築する
    serviceAccount = {
        "type": "service_account",
        "project_id": process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        "private_key": process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        "client_email": process.env.FIREBASE_CLIENT_EMAIL,
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_x509_cert_url": `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.FIREBASE_CLIENT_EMAIL)}`,
        "universe_domain": "googleapis.com"
    };
}

const clientEmail = serviceAccount.client_email; 
const projectId = serviceAccount.project_id; 
const privateKey = serviceAccount.private_key;

const serviceAccountJson = {
  "type": "service_account",
  "project_id": projectId,
  "private_key": privateKey,
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
  fs.writeFileSync(outputPath, JSON.stringify(serviceAccountJson, null, 2));
  console.log('--- Netlify Build Script: Creating Service Account Key File ---');
  console.log('Service Account Key file created at:', outputPath);
  console.log('--- End Service Account Key File Creation ---');
} catch (error) {
  console.error('--- Netlify Build Script Error: Failed to create Service Account Key File ---');
  console.error(error);
  process.exit(1);
}