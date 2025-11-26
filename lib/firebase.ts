import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// 環境変数が正しく設定されていることを前提とします
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// サーバーサイドレンダリング(SSR)時の二重初期化を防ぐ
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// インスタンスを作成
const auth = getAuth(app);
const db = getFirestore(app);

// 名前付きエクスポート (Named Export)
// pages/projects/[id].tsx 側の import { auth, db } ... に対応します
export { app, auth, db };