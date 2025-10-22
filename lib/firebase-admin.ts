// @/lib/firebase-admin.ts

import * as admin from "firebase-admin";
import fs from "fs";

// ★修正点 1: インポートの前に、環境変数から読み込むパスをチェックする
const SERVICE_ACCOUNT_KEY_PATH = "firebase-service-account.json"; 
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

let serviceAccount: admin.ServiceAccount | null = null;
let initializationError: string | null = null;

try {
    if (serviceAccountJson) {
        // 環境変数からの読み込み（本番環境/推奨）
        serviceAccount = JSON.parse(serviceAccountJson);
        console.log("✅ Firebase Admin SDK initialized from environment variable.");
    } else {
        // ローカルファイルからの読み込み（開発環境）
        const jsonData = fs.readFileSync(SERVICE_ACCOUNT_KEY_PATH, "utf8");
        serviceAccount = JSON.parse(jsonData);
        console.log("✅ firebase-service-account.json loaded successfully from file system.");
    }
} catch (error) {
    // ファイル読み込み/パース失敗時
    initializationError = `FIREBASE_SERVICE_ACCOUNT_JSON is not set or file (${SERVICE_ACCOUNT_KEY_PATH}) not found/invalid.`;
    console.error("🔴 Failed to load service account:", initializationError);
}

let adminDb: admin.firestore.Firestore;
let adminAuth: admin.auth.Auth;

// --- ダミー関数定義（省略）---
const createDummyAuth = (errorMessage: string): admin.auth.Auth => {
    return {
        getUserByEmail: async (email: string) => {
            console.error(`🔴 DUMMY_AUTH_CALL: getUserByEmail(${email}) called. Error: ${errorMessage}`);
            throw new Error(`Firebase Admin Auth Not Initialized: ${errorMessage}`);
        },
        createUser: async (properties: admin.auth.CreateRequest) => {
            console.error(`🔴 DUMMY_AUTH_CALL: createUser() called. Error: ${errorMessage}`);
            throw new Error(`Firebase Admin Auth Not Initialized: ${errorMessage}`);
        },
        verifyIdToken: async () => { // verifyIdTokenにもダミー処理を追加
            console.error(`🔴 DUMMY_AUTH_CALL: verifyIdToken() called. Error: ${errorMessage}`);
            throw new Error(`Invalid ID token. (Admin SDK Not Initialized: ${errorMessage})`);
        },
        createSessionCookie: async () => {
            console.error(`🔴 DUMMY_AUTH_CALL: createSessionCookie() called. Error: ${errorMessage}`);
            throw new Error(`Session Cookie creation failed: ${errorMessage}`);
        }
    } as unknown as admin.auth.Auth;
};

const createDummyDb = (errorMessage: string): admin.firestore.Firestore => {
    return {
        collection: (path: string) => {
            console.error(`🔴 DUMMY_DB_CALL: collection(${path}) called. Error: ${errorMessage}`);
            throw new Error(`Firebase Admin DB Not Initialized: ${errorMessage}`);
        },
        batch: () => {
            console.error(`🔴 DUMMY_DB_CALL: batch() called. Error: ${errorMessage}`);
            throw new Error(`Firebase Admin DB Not Initialized: ${errorMessage}`);
        }
    } as unknown as admin.firestore.Firestore;
};

// --- 初期化 ---
try {
    if (!admin.apps.length) {
        if (initializationError || !serviceAccount) {
            console.error(`🔴 Firebase Admin Initialization SKIPPED: ${initializationError}`);
            adminAuth = createDummyAuth(initializationError || "Admin credentials missing.");
            adminDb = createDummyDb(initializationError || "Admin credentials missing.");
            // エラーを投げずにダミーを返して、アプリのクラッシュを防ぐ (Next.js開発時)
        } else {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
            console.log("✅ Firebase Admin SDK initialized successfully.");
        }
    }

    // アプリが初期化された場合、またはダミーが割り当てられた場合にインスタンスを取得/割り当て
    if (!initializationError && admin.apps.length > 0) {
        adminDb = admin.firestore();
        adminAuth = admin.auth();
    }
    
    // 認証情報がなかった場合、ダミーインスタンスを確保
    if (!adminDb) {
        adminDb = createDummyDb(initializationError || "Admin credentials missing.");
    }
    if (!adminAuth) {
        adminAuth = createDummyAuth(initializationError || "Admin credentials missing.");
    }

} catch (error: any) {
    console.error("🔴 Firebase Admin initialization error (Catch Block):", error);
    const finalErrorMsg = error.message || "Unknown initialization failure.";
    adminAuth = createDummyAuth(finalErrorMsg);
    adminDb = createDummyDb(finalErrorMsg);
}

// ★修正点 2: 名前付きエクスポートを維持し、呼び出し側で解決する
export { adminDb, adminAuth };























