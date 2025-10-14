import * as admin from "firebase-admin";

// アプリケーションがまだ初期化されていない場合のみ初期化を実行
if (admin.apps.length === 0) {
  admin.initializeApp();
}

// 初期化済みのインスタンスをエクスポート
export const adminDb = admin.firestore();
export const adminAuth = admin.auth();