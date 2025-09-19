import * as admin from 'firebase-admin';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { ServiceAccount } from 'firebase-admin';
import { Bucket } from '@google-cloud/storage';

// 環境変数からFirebaseの認証情報を読み込みます
const serviceAccount: ServiceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
};

// Firebase Admin Appを初期化します（まだ初期化されていない場合のみ）
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      // Storageバケットの情報を追加
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
    console.log('Firebase Admin SDK initialized successfully.');
  } catch (error) {
    console.error('Firebase Admin SDKの初期化エラー:', error);
  }
}

/**
 * 初期化済みのFirebase Admin Authインスタンスを返します。
 */
export const getAdminAuth = (): Auth => {
  return getAuth();
};

/**
 * 初期化済みのFirebase Admin Firestoreインスタンスを返します。
 */
export const getAdminDb = (): Firestore => {
  return getFirestore();
};

/**
 * 初期化済みのFirebase Admin Storageのデフォルトバケットを返します。
 */
export const getAdminStorageBucket = (): Bucket => {
  // 型の競合を強制的に解決します
  return getStorage().bucket() as any as Bucket;
};

// 'admin' 名前空間自体をエクスポートします
export { admin };