// scripts/createServiceAccountFile.js
const fs = require('fs');
const path = require('path');

const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (!privateKey) {
  console.error('Environment variable FIREBASE_PRIVATE_KEY is not set.');
  process.exit(1);
}

// 秘密鍵の改行コードを修正（Netlifyでのエスケープに対応）
const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');

if (!formattedPrivateKey.startsWith('-----BEGIN PRIVATE KEY-----')) {
  console.error('Invalid private key format. Must start with -----BEGIN PRIVATE KEY-----');
  process.exit(1);
}

const serviceAccount = {
  "type": "service_account",
  "project_id": projectId,
  "private_key": formattedPrivateKey,
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