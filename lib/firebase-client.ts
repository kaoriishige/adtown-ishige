// lib/firebase-client.ts

import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import { getStorage, FirebaseStorage } from "firebase/storage";

// ▼ デバッグ用：Firebase環境変数が undefined のまま動くのを防ぐ
const requiredEnvVars = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// どれか一つでも undefined ならエラー表示
for (const [key, value] of Object.entries(requiredEnvVars)) {
  if (!value) {
    console.error(`❌ Firebase config ERROR: ${key} is missing in .env.local`);
  }
}

// Firebaseクライアント設定
const firebaseConfig = {
  apiKey: requiredEnvVars.apiKey,
  authDomain: requiredEnvVars.authDomain,
  projectId: requiredEnvVars.projectId,
  storageBucket: requiredEnvVars.storageBucket,
  messagingSenderId: requiredEnvVars.messagingSenderId,
  appId: requiredEnvVars.appId,
};

// Firebase 初期化（既存があれば再利用）
let app: FirebaseApp;

try {
  // 環境が既に初期化済みかどうかをチェック
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
} catch (err) {
  console.error("❌ Firebase initialization error", err);
  throw err; // 初期化失敗時は停止
}

// Firebase インスタンスを取得
const db: Firestore = getFirestore(app);
const auth: Auth = getAuth(app);
const storage: FirebaseStorage = getStorage(app);

console.log("✅ Firebase client initialized");

// 必要なものをエクスポート
// ★ここが重要: app をエクスポートすることで home.tsx のエラーが解消します★
export { app, db, auth, storage };



