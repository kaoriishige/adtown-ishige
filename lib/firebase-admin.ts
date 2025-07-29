import * as admin from 'firebase-admin';

if (admin.apps.length === 0) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID, // Netlifyの環境変数から読み込む
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL, // Netlifyの環境変数から読み込む
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'), // Netlifyの環境変数から読み込み、改行を変換
      }),
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

export { admin };