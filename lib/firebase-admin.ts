import * as admin from 'firebase-admin';

// 環境変数が設定されていない場合のみ、一度だけ初期化を行います
if (!admin.apps.length) {
  try {
    // Netlifyの環境変数から、安全に認証情報を読み込みます
    const serviceAccount = JSON.parse(
      process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY as string
    );

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

// 初期化したadminインスタンスをエクスポートします
export { admin };
