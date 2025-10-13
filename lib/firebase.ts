import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// .env.localファイルからFirebaseの設定を読み込みます。
// NEXT_PUBLIC_ プレフィックスにより、ブラウザ側で安全に環境変数を参照できます。
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;

// サーバーサイドレンダリング時やホットリロード時に再初期化されるのを防ぐためのチェック
if (getApps().length === 0) {
  // アプリがまだ初期化されていない場合は、新しく初期化します。
  app = initializeApp(firebaseConfig);
} else {
  // すでに初期化されている場合は、既存のアプリのインスタンスを取得します。
  app = getApp();
}

// 各Firebaseサービスを初期化し、エクスポートします。
// これにより、アプリケーション内のどこからでも同じインスタンスを再利用できます。
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// 必要に応じて、Firebaseアプリのインスタンス自体もエクスポートします。
export { app };
