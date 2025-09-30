import * as admin from 'firebase-admin';
import { Auth, getAuth } from 'firebase-admin/auth';
import { Firestore, getFirestore } from 'firebase-admin/firestore';
import { Storage, getStorage } from 'firebase-admin/storage'; // Storage用のimportを追加

export const initializeAdminApp = () => {
  if (admin.apps.length > 0) {
    return;
  }
  const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON as string
  );
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    // StorageバケットのURLを初期化設定に追加
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
};

initializeAdminApp();

export const adminAuth: Auth = getAuth();
export const adminDb: Firestore = getFirestore();
export const adminStorage: Storage = getStorage(); // Storageインスタンスをエクスポート

// 他ファイルが必要としている関数
export const getAdminStorageBucket = () => {
  return adminStorage.bucket(); // デフォルトのバケットを返す
};