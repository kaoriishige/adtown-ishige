// scripts/createServiceAccountFile.js
const fs = require('fs');
const path = require('path');

// Base64形式の環境変数からサービスアカウント情報をデコード
const encodedServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

if (!encodedServiceAccount) {
  console.error('❌ Error: Environment variable FIREBASE_SERVICE_ACCOUNT_BASE64 is not set.');
  process.exit(1);
}

try {
  // Base64文字列をデコードして、元のJSON文字列に戻す
  const decodedJsonString = Buffer.from(encodedServiceAccount, 'base64').toString('utf-8');

  // Netlify Functions が参照するパスにファイルを出力
  const functionsDir = path.resolve(process.cwd(), '.netlify', 'functions');
  if (!fs.existsSync(functionsDir)) {
    fs.mkdirSync(functionsDir, { recursive: true });
  }
  const outputPath = path.join(functionsDir, 'serviceAccountKey.json');
  
  fs.writeFileSync(outputPath, decodedJsonString);

  console.log('✅ Service Account Key file created successfully from Base64 encoded variable.');

} catch (error) {
  console.error('❌ Failed to decode or write the service account key from Base64.', error);
  process.exit(1);
}