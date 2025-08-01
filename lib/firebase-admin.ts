import * as admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

// ビルドスクリプトがキーファイルを作成する、決まったパス
const SERVICE_ACCOUNT_PATH = path.join(process.cwd(), '.netlify/functions/serviceAccountKey.json');

if (!admin.apps.length) {
  // Netlifyのビルド環境など、ファイルが存在する場合のみ初期化を試みる
  if (fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    try {
      console.log('Initializing Firebase Admin SDK from file...');
      admin.initializeApp({
        // ファイルパスから認証情報を読み込む
        credential: admin.credential.cert(SERVICE_ACCOUNT_PATH)
      });
      console.log('✅ Firebase Admin SDK initialized successfully.');
    } catch (error) {
      console.error('❌ Firebase Admin SDK initialization error', error);
    }
  } else {
    // ローカル開発などでファイルが存在しない場合は警告のみ出す
    console.warn('⚠️ Firebase Admin SDK not initialized: serviceAccountKey.json not found in build output.');
  }
}

export const adminDb = admin.firestore();
export default admin;