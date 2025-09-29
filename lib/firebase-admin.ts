import admin from 'firebase-admin';

// 環境変数が存在するか最初に確認
if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
  console.error("Firebase Admin SDKに必要な環境変数が.env.localに設定されていません。");
}

// Firebase Admin SDKが既に初期化されているかをチェック
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // .env.localの改行文字(\\n)を実際の改行(\n)に置換
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
    console.log("Firebase Admin SDK initialized successfully.");
  } catch (error: any) {
    console.error("Firebase Admin SDK initialization error: ", error.message);
  }
}

// 初期化されたadminインスタンスから、認証とDBの機能を取得してエクスポート
const adminAuth = admin.auth();
const adminDb = admin.firestore();

export { adminAuth, adminDb };