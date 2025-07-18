// lib/firebase.ts
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Firebase Appを初期化または取得する関数
const initializeFirebaseApp = (): FirebaseApp => {
  if (getApps().length) {
    return getApp();
  }
  // 設定値がすべて存在するか確認
  if (Object.values(firebaseConfig).some(v => v === undefined)) {
    throw new Error('Firebase config values are missing in .env.local');
  }
  return initializeApp(firebaseConfig);
};

const app = initializeFirebaseApp();

export const db = getFirestore(app);
export const auth = getAuth(app);

















