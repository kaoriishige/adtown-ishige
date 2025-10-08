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
  // すでに初期化済みの場合は何もしない
  if (admin.apps.length > 0) {
    if (!initializedAdminAuth) {
      initializedAdminAuth = admin.auth();
      initializedAdminDb = admin.firestore();
    }
    return;
  }

  try {
    const serviceAccountJsonString = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    // デバッグログ: 環境変数の読み込み状態をターミナルに出力
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

// ファイルロード時に一度だけ初期化を実行
// ★ Next.jsのAPIルートでは、リクエストごとにこのモジュールが読み込まれるため、
//   この単一の呼び出しで初期化が保証されます。
initializeAdminApp();

// ----------------------------------------------------
// 内部Getter関数: AuthとDBにアクセスする前に初期化を保証
// ----------------------------------------------------

/**
 * Authインスタンスが必要なときに初期化をチェックして返す。
 */
function _getAdminAuth(): admin.auth.Auth {
  if (!initializedAdminAuth) {
    initializeAdminApp();
    if (!initializedAdminAuth) {
      throw new Error('Firebase Admin Authが利用できません。環境変数を確認してください。');
    }
  }
  return initializedAdminAuth;
}

/**
 * Firestoreインスタンスが必要なときに初期化をチェックして返す。
 */
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

// adminAuth.verifySessionCookie の形式で利用可能
export const adminAuth = {
  // 基本認証
  verifySessionCookie: (token: string, checkRevoked: boolean) => _getAdminAuth().verifySessionCookie(token, checkRevoked),

  // ★★★ 修正点: createUser、getUserByEmail、deleteUser を追加 ★★★
  createUser: (properties: admin.auth.CreateRequest) => _getAdminAuth().createUser(properties),
  getUserByEmail: (email: string) => _getAdminAuth().getUserByEmail(email),
  deleteUser: (uid: string) => _getAdminAuth().deleteUser(uid),
  // ----------------------------------------------------------------

  // トークン管理
  createSessionCookie: (idToken: string, options: { expiresIn: number }) => _getAdminAuth().createSessionCookie(idToken, options),

  // ユーザー取得
  getUser: (uid: string) => _getAdminAuth().getUser(uid),
};

// adminDb.collection('settings') の形式で利用可能
export const adminDb = {
  // コレクション/ドキュメントアクセス
  collection: (path: string) => _getAdminDb().collection(path),
  doc: (path: string) => _getAdminDb().doc(path),

  // トランザクション/バッチ処理 (必要に応じて追加)
  // runTransaction: (updateFunction: (transaction: admin.firestore.Transaction) => Promise<any>) => _getAdminDb().runTransaction(updateFunction),
  // batch: () => _getAdminDb().batch(),
};


/**
 * サーバーサイドで一般ユーザーのCookieからUIDを取得し、検証する。
 * @param context - GetServerSidePropsのコンテキスト
 * @returns 認証されたユーザーのUID、またはnull
 */
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

/**
 * サーバーサイドでパートナーログイン用CookieからユーザーUIDを取得し、検証する。
 * @param context - GetServerSidePropsのコンテキスト
 * @returns 認証されたユーザーのUID、またはnull
 */
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

