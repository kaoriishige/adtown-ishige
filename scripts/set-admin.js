// scripts/set-admin.js

// Firebase Admin SDKを初期化するためのコード
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Firebase Admin SDKを初期化する関数
function initializeFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return;
  }
  try {
    // まず、Netlifyのビルド時に生成される一時ファイルを試す
    const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');
    if (fs.existsSync(serviceAccountPath)) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccountPath),
      });
      return;
    }
    // 環境変数を試す
    const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    if (serviceAccountBase64) {
      const serviceAccountJson = Buffer.from(serviceAccountBase64, 'base64').toString('utf-8');
      const serviceAccount = JSON.parse(serviceAccountJson);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      return;
    }
    throw new Error('Firebase Admin SDKの認証情報が見つかりませんでした。');
  } catch (error) {
    console.error("Firebase Admin SDKの初期化に失敗しました:", error);
    process.exit(1);
  }
}

// メインの処理
async function setAdminRole() {
  // 1. 環境変数を読み込むために `dotenv` を設定
  require('dotenv').config({ path: '.env.local' });
  
  // 2. Firebaseを初期化
  initializeFirebaseAdmin();

  // 3. コマンドラインからメールアドレスを取得
  const email = process.argv[2];
  if (!email) {
    console.error('エラー: 管理者に設定したいユーザーのメールアドレスを指定してください。');
    console.log('実行例: node scripts/set-admin.js your-email@example.com');
    return;
  }

  try {
    // 4. メールアドレスからユーザーを検索
    const user = await admin.auth().getUserByEmail(email);
    
    // 5. ユーザーに管理者権限 (admin: true) を設定
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });
    
    console.log(`成功！ ${email} (UID: ${user.uid}) が管理者に設定されました。`);
    console.log('ウェブサイトで一度ログアウトし、再度ログインして変更を反映させてください。');

  } catch (error) {
    console.error('管理者権限の設定中にエラーが発生しました:', error);
  }
}

setAdminRole();