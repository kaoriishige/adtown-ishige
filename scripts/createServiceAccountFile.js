// scripts/createServiceAccountFile.js
const fs = require('fs');
const path = require('path');

// プロジェクトのルートディレクトリにある serviceAccountKey.json を直接読み込みます
// これにより、Netlifyの環境変数は不要になります
try {
  const serviceAccount = require('../serviceAccountKey.json');

  // GOOGLE_APPLICATION_CREDENTIALS が期待する形式のJSONを作成
  const serviceAccountJson = {
    type: serviceAccount.type,
    project_id: serviceAccount.project_id,
    private_key_id: serviceAccount.private_key_id,
    private_key: serviceAccount.private_key,
    client_email: serviceAccount.client_email,
    client_id: serviceAccount.client_id,
    auth_uri: serviceAccount.auth_uri,
    token_uri: serviceAccount.token_uri,
    auth_provider_x509_cert_url: serviceAccount.auth_provider_x509_cert_url,
    client_x509_cert_url: serviceAccount.client_x509_cert_url,
    universe_domain: "googleapis.com",
  };

  // Netlify Functions が参照するパスにファイルを出力
  const functionsDir = path.resolve(process.cwd(), '.netlify', 'functions');
  if (!fs.existsSync(functionsDir)) {
    fs.mkdirSync(functionsDir, { recursive: true });
  }
  const outputPath = path.join(functionsDir, 'serviceAccountKey.json');
  
  fs.writeFileSync(outputPath, JSON.stringify(serviceAccountJson, null, 2));

  console.log('✅ Service Account Key file created successfully for Netlify Functions.');

} catch (error) {
  // serviceAccountKey.json が見つからない場合のエラー
  if (error.code === 'MODULE_NOT_FOUND') {
    console.error('❌ Error: `serviceAccountKey.json` not found in the root directory.');
    console.error('Please ensure `serviceAccountKey.json` exists in the project root.');
  } else {
    // その他のエラー
    console.error('❌ An error occurred while creating the service account file:', error);
  }
  // エラーがあった場合はビルドを失敗させる
  process.exit(1); 
}