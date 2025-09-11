import * as admin from 'firebase-admin';

let app: admin.app.App;

// 初期化がまだされていない場合のみ実行
if (!admin.apps.length) {
  // 環境変数から認証情報を取得
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  };

  // 認証情報が不足していないかチェック
  if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
    throw new Error('Firebase Admin SDK の認証情報が不足しています。環境変数を確認してください。');
  }
  
  // ▼▼▼ ここが最も重要な修正点 ▼▼▼
  // Admin SDKを初期化する際に、使用するバケット名を明示的に指定する
  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    // あなたが確認した正しいバケット名を直接指定
    storageBucket: 'minna-no-nasu-app.firebasestorage.app' 
  });
  // ▲▲▲ 修正はここまで ▲▲▲

} else {
  // すでに初期化済みの場合は、既存のインスタンスを取得
  app = admin.app();
}

// 各種インスタンスを取得する関数
const getAdminAuth = (): admin.auth.Auth => app.auth();
const getAdminDb = (): admin.firestore.Firestore => app.firestore();
const getAdminStorageBucket = () => app.storage().bucket(); // バケット名指定済のため引数不要

// 他のファイルで使えるようにエクスポート
export { admin, getAdminAuth, getAdminDb, getAdminStorageBucket };