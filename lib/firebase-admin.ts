import * as admin from 'firebase-admin';

// すでに初期化されているかをチェックし、重複初期化を防ぐ
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // privateKeyの改行文字(\n)を正しく処理する
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      }),
    });
    console.log('Firebase Admin SDK initialized successfully.');
  } catch (error: any) {
    console.error('Firebase Admin SDK initialization error:', error.stack);
  }
}

// 初期化されたAdmin Appから各サービスを取得してエクスポートする
const adminDb = admin.firestore();
const adminAuth = admin.auth();

export { adminDb, adminAuth };