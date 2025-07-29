import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebaseクライアントサイドの設定
// ここにあなたのFirebaseプロジェクトのコンフィグレーションを貼り付けてください。
// Firebase Consoleの「プロジェクトの設定」>「全般」>「マイアプリ」セクションで確認できます。
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY, // あなたのAPIキーをここに貼り付け
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, // あなたのAuthドメインをここに貼り付け
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, // あなたのFirebaseプロジェクトID
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, // あなたのStorage Bucketをここに貼り付け
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID, // あなたのMessaging Sender IDをここに貼り付け
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID, // あなたのApp IDをここに貼り付け
};

// Firebaseアプリを初期化（既に初期化されている場合は再初期化しない）
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// 各Firebaseサービスのインスタンスを取得
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };