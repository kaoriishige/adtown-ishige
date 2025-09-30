import * as admin from 'firebase-admin';
// 型情報をインポートする (ここが追加点)
import { Auth } from 'firebase-admin/auth';
import { Firestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

export const initializeAdminApp = () => {
  if (admin.apps.length > 0) {
    return;
  }

  const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON as string
  );

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
};

initializeAdminApp();

// 定数に型を明記する (ここが変更点)
export const adminAuth: Auth = getAuth();
export const adminDb: Firestore = getFirestore();