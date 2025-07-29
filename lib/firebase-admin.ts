import * as admin from 'firebase-admin';

if (admin.apps.length === 0) {
  try {
    // FIREBASE_SERVICE_ACCOUNT_KEY 環境変数からサービスアカウント情報をパース
    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountString) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set.');
    }
    const serviceAccount = JSON.parse(serviceAccountString); // JSON文字列をオブジェクトにパース

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount), // パースしたオブジェクトを直接渡す
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

export { admin };