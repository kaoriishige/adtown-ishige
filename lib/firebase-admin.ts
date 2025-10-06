import * as admin from 'firebase-admin';
import { Auth, getAuth } from 'firebase-admin/auth';
import { Firestore, getFirestore } from 'firebase-admin/firestore';
import { parseCookies } from 'nookies';
import type { GetServerSidePropsContext } from 'next';

// サーバーサイドでのFirebase Admin SDKの初期化処理
export const initializeAdminApp = () => {
    // 既に初期化済みの場合は何もしない
    if (admin.apps.length > 0) {
        return;
    }
    try {
        // 環境変数からサービスアカウント情報を取得して初期化
        const serviceAccount = JSON.parse(
            process.env.FIREBASE_SERVICE_ACCOUNT_JSON as string
        );
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
    } catch (error) {
        console.error('Firebase Admin SDK の初期化に失敗しました:', error);
    }
};

initializeAdminApp();

// 初期化されたインスタンスをエクスポート
export const adminAuth: Auth = getAuth();
export const adminDb: Firestore = getFirestore();

/**
 * サーバーサイドでCookieから認証情報を検証し、Firebase UIDを返す関数
 * @param context GetServerSidePropsのコンテキスト
 * @returns ユーザーのUID。認証失敗時はnull
 */
export const getPartnerUidFromCookie = async (context: GetServerSidePropsContext): Promise<string | null> => {
  try {
    const cookies = parseCookies(context);
    // Cookieの名前を 'token' に統一
    const sessionCookie = cookies.token; 

    if (!sessionCookie) {
      return null; // Cookieがなければ非ログイン
    }

    // ★★★【最重要修正点】★★★
    // IDトークンではなく、セッションCookieを検証する方法に変更します
    const checkRevoked = true; 
    const decodedToken = await adminAuth.verifySessionCookie(
      sessionCookie,
      checkRevoked
    );
    
    return decodedToken.uid;
    
  } catch (error) {
    // Cookieの有効期限切れや不正なCookieの場合
    console.error('認証トークンの検証エラー:', error);
    return null;
  }
};

