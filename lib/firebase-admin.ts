import * as admin from 'firebase-admin';

// 既に初期化されている場合は再初期化しない
if (admin.apps.length === 0) {
  try {
    admin.initializeApp({
      // ★あなたのJSONファイルのパスをここに入れました★
      credential: admin.credential.cert(require('C:\\Users\\user\\Downloads\\minna-no-nasu-app-firebase-adminsdk-fbsvc-ebfee99d33.json')),
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

export { admin };