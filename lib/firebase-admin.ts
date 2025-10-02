import * as admin from 'firebase-admin';
import { Auth, getAuth } from 'firebase-admin/auth';
import { Firestore, getFirestore } from 'firebase-admin/firestore';
import { Storage, getStorage } from 'firebase-admin/storage';
// ★追加：nookies と Next.jsの型をインポート
import { parseCookies } from 'nookies';
import type { GetServerSidePropsContext } from 'next';

export { admin, getFirestore };

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

export const getPartnerInfoFromFirebase = async (uid: string) => {
    const doc = await adminDb.collection('partners').doc(uid).get();
    if (!doc.exists) {
        // ★修正：nullではなくエラーを投げるか、明示的にnullを返す
        // 今回のコードではnullを返す設計で問題ありません
        return null;
    }
    return doc.data();
};


// ★★★★★ ここから下を丸ごと追加 ★★★★★
/**
 * サーバーサイドでCookieから認証トークンを検証し、Firebase UIDを返す関数
 * @param context GetServerSidePropsのコンテキスト
 * @returns ユーザーのUID。認証失敗時はnull
 */
export const getPartnerUidFromCookie = async (context: GetServerSidePropsContext): Promise<string | null> => {
  try {
    // リクエストからCookieを解析
    const cookies = parseCookies(context);
    // 'token' という名前のCookieを取得（ログイン処理でこの名前で保存する必要がある）
    const token = cookies.token; 

    if (!token) {
      return null; // トークンがなければ非ログイン
    }

    // Firebase Admin SDKでトークンを検証
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // 検証成功後、UIDを返す
    return decodedToken.uid;
    
  } catch (error) {
    // トークンの有効期限切れや不正なトークンの場合
    console.error('認証トークンの検証エラー:', error);
    return null;
  }
};