import * as admin from 'firebase-admin';
import { Auth, getAuth } from 'firebase-admin/auth';
import { Firestore, getFirestore } from 'firebase-admin/firestore';
import { Storage, getStorage } from 'firebase-admin/storage';

// 他ファイルで `admin.firestore.FieldValue` などが使えるように、
// `admin` 本体をエクスポートします（この行が追加点です）。
export { admin };

export const initializeAdminApp = () => {
  if (admin.apps.length > 0) {
    return;
  }
  const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON as string
  );
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
};

initializeAdminApp();

export const adminAuth: Auth = getAuth();
export const adminDb: Firestore = getFirestore();
export const adminStorage: Storage = getStorage();

export const getAdminStorageBucket = () => {
  return adminStorage.bucket();
};