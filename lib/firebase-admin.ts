import * as admin from 'firebase-admin';

// Appインスタンスを一度だけ初期化するための工夫
if (!admin.apps.length) {
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    // Storageを正しく利用するために、バケット名を指定します
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

// 他のファイルが必要としている関数をすべて定義してエクスポートします
const getAdminAuth = (): admin.auth.Auth => admin.auth();
const getAdminDb = (): admin.firestore.Firestore => admin.firestore();
const getAdminStorageBucket = () => admin.storage().bucket();

export { getAdminAuth, getAdminDb, getAdminStorageBucket };