import * as admin from 'firebase-admin';

// Appインスタンスを一度だけ初期化するための工夫
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    }),
  });
}

// 他ファイルが要求している関数を定義してエクスポート
const getAdminAuth = (): admin.auth.Auth => admin.auth();
const getAdminDb = (): admin.firestore.Firestore => admin.firestore();

export { getAdminAuth, getAdminDb };