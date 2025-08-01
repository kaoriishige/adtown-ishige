import * as admin from 'firebase-admin';

// すでに初期化されている場合は何もしない
if (!admin.apps.length) {
  try {
    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    
    if (!serviceAccountString) {
      throw new Error('The FIREBASE_SERVICE_ACCOUNT_BASE64 environment variable is not set.');
    }

    // Base64でエンコードされたサービスアカウント情報をデコード
    const serviceAccount = JSON.parse(Buffer.from(serviceAccountString, 'base64').toString('utf-8'));

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    console.log('✅ Firebase Admin SDK initialized successfully.');

  } catch (error) {
    console.error('❌ Firebase Admin SDK initialization error', error);
  }
}

export const adminDb = admin.firestore();
export default admin;