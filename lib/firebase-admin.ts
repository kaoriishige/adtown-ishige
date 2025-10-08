import * as admin from 'firebase-admin';
import { GetServerSidePropsContext } from 'next';
import nookies from 'nookies';

// ----------------------------------------------------
// 初期化ステータスを保持する変数
// ----------------------------------------------------
let initializedAdminAuth: admin.auth.Auth | null = null;
let initializedAdminDb: admin.firestore.Firestore | null = null;

/**
 * Firebase Admin SDKを初期化する。既に初期化されていれば何もしない。
 */
export function initializeAdminApp(): void {
  if (admin.apps.length > 0) {
    if (!initializedAdminAuth) {
      initializedAdminAuth = admin.auth();
      initializedAdminDb = admin.firestore();
    }
    return;
  }

  try {
    const serviceAccountJsonString = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    console.log(`[Admin INIT DEBUG] FIREBASE_SERVICE_ACCOUNT_JSON is set: ${!!serviceAccountJsonString}`);
    if (serviceAccountJsonString) {
      console.log(`[Admin INIT DEBUG] Key length: ${serviceAccountJsonString.length}`);
    }

    if (!serviceAccountJsonString) {
      console.error('FIREBASE_SERVICE_ACCOUNT_JSON 環境変数が設定されていません。初期化をスキップします。');
      return;
    }

    const serviceAccount = JSON.parse(serviceAccountJsonString);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    initializedAdminAuth = admin.auth();
    initializedAdminDb = admin.firestore();

    console.log('Firebase Admin SDKの初期化に成功しました。');
  } catch (error: any) {
    console.error('Firebase Admin SDKの初期化に失敗しました。詳細:', error.message);
  }
}

initializeAdminApp();

// ----------------------------------------------------
// 内部Getter関数: AuthとDBにアクセスする前に初期化を保証
// ----------------------------------------------------

function _getAdminAuth(): admin.auth.Auth {
  if (!initializedAdminAuth) {
    initializeAdminApp();
    if (!initializedAdminAuth) {
      throw new Error('Firebase Admin Authが利用できません。環境変数を確認してください。');
    }
  }
  return initializedAdminAuth;
}

function _getAdminDb(): admin.firestore.Firestore {
  if (!initializedAdminDb) {
    initializeAdminApp();
    if (!initializedAdminDb) {
      throw new Error('Firebase Admin Firestoreが利用できません。環境変数を確認してください。');
    }
  }
  return initializedAdminDb;
}

// ----------------------------------------------------
// エクスポート: 定数としてエクスポートし、呼び出し側で()を不要にする
// ----------------------------------------------------

export const adminAuth = {
  verifySessionCookie: (token: string, checkRevoked: boolean) => _getAdminAuth().verifySessionCookie(token, checkRevoked),
  verifyIdToken: (idToken: string, checkRevoked: boolean = true) => _getAdminAuth().verifyIdToken(idToken, checkRevoked),
  createCustomToken: (uid: string, developerClaims?: object) => _getAdminAuth().createCustomToken(uid, developerClaims),
  setCustomUserClaims: (uid: string, customClaims: object) => _getAdminAuth().setCustomUserClaims(uid, customClaims),
  
  // ★★★ 追加した部分: listUsers ★★★
  listUsers: (maxResults?: number, pageToken?: string) => _getAdminAuth().listUsers(maxResults, pageToken),

  createUser: (properties: admin.auth.CreateRequest) => _getAdminAuth().createUser(properties),
  getUserByEmail: (email: string) => _getAdminAuth().getUserByEmail(email),
  deleteUser: (uid: string) => _getAdminAuth().deleteUser(uid),
  createSessionCookie: (idToken: string, options: { expiresIn: number }) => _getAdminAuth().createSessionCookie(idToken, options),
  getUser: (uid: string) => _getAdminAuth().getUser(uid),
};

export const adminDb = {
  collection: (path: string) => _getAdminDb().collection(path),
  doc: (path: string) => _getAdminDb().doc(path),
  runTransaction: (updateFunction: (transaction: admin.firestore.Transaction) => Promise<any>) => _getAdminDb().runTransaction(updateFunction),
  batch: () => _getAdminDb().batch(),
};

export const getUidFromCookie = async (context: GetServerSidePropsContext): Promise<string | null> => {
  try {
    const cookies = nookies.get(context);
    const sessionCookie = cookies.session || '';
    if (!sessionCookie) {
      return null;
    }
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    return decodedToken.uid;
  } catch (error) {
    return null;
  }
};

export const getPartnerUidFromCookie = async (context: GetServerSidePropsContext): Promise<string | null> => {
  try {
    const cookies = nookies.get(context);
    const sessionCookie = cookies.token || '';
    if (!sessionCookie) {
      return null;
    }
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    return decodedToken.uid;
  } catch (error) {
    return null;
  }
};
