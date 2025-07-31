import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebaseクライアントサイドの設定
// ここにあなたのFirebaseプロジェクトのコンフィグレーションを貼り付けてください。
// Firebase Consoleの「プロジェクトの設定」>「全般」>「マイアプリ」セクションで確認できます。
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY, // "AIzaSyDtTt0fWthsU6Baq1fJwUx8CgSakoZnMXY",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, // "minna-no-nasu-app.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, // "minna-no-nasu-app",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, // "minna-no-nasu-app.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID, // "885979930856",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID, // "1:885979930856:web:2b06441bc2d497cf3e695d",
};

// Firebaseアプリを初期化（既に初期化されている場合は再初期化しない）
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// ★ここから追加するコード★
console.log('--- Firebase Initialization Check ---');
console.log('Firebase App Name:', app.name);
console.log('Firebase Project ID (from app.options):', app.options.projectId);
console.log('--- End Firebase Initialization Check ---');
// ★追加するコードここまで★

// 各Firebaseサービスのインスタンスを取得
const auth = getAuth(app); // exportを削除
const db = getFirestore(app);   // exportを削除

export { app, auth, db }; // エクスポートをこの行に統一