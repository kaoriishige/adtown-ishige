// @/lib/firebase-admin.ts (TSエラーを完全に解消し、他のファイルで安全に使用可能)

import * as admin from "firebase-admin";
import fs from "fs";

// 🚨 エクスポートされる実際の変数
let adminDbInstance: admin.firestore.Firestore;
let adminAuthInstance: admin.auth.Auth;

const SERVICE_ACCOUNT_KEY_PATH = "firebase-service-account.json"; 
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

let serviceAccount: admin.ServiceAccount | null = null;
let initializationError: string | null = null;

try {
    if (serviceAccountJson) {
        serviceAccount = JSON.parse(serviceAccountJson);
        console.log("✅ Firebase Admin SDK initialized from environment variable.");
    } else {
        const jsonData = fs.readFileSync(SERVICE_ACCOUNT_KEY_PATH, "utf8");
        serviceAccount = JSON.parse(jsonData);
        console.log("✅ firebase-service-account.json loaded successfully from file system.");
    }
} catch (error) {
    initializationError = `FIREBASE_SERVICE_ACCOUNT_JSON is not set or file (${SERVICE_ACCOUNT_KEY_PATH}) not found/invalid.`;
    console.error("🔴 Failed to load service account:", initializationError);
}

// --- ダミー関数定義（クラッシュ回避のため、AdminSDKが初期化されない場合に備える）---
const createDummyAuth = (errorMessage: string): admin.auth.Auth => {
    // 💡 エラーが発生した場合にダミーメソッドを呼び出すことで、nullではないインスタンスを保証
    return {
        verifySessionCookie: async () => { throw new Error(`Admin Auth Not Initialized: ${errorMessage}`); },
        // ... (他のメソッドのダミー定義は省略) ...
    } as unknown as admin.auth.Auth;
};

const createDummyDb = (errorMessage: string): admin.firestore.Firestore => {
    // 💡 エラーが発生した場合にダミーメソッドを呼び出すことで、nullではないインスタンスを保証
    return {
        collection: (path: string) => { throw new Error(`Admin DB Not Initialized: ${errorMessage}`); },
        // ... (他のメソッドのダミー定義は省略) ...
    } as unknown as admin.firestore.Firestore;
};


// --- 初期化ロジック ---
try {
    if (!admin.apps.length) {
        if (initializationError || !serviceAccount) {
            console.error(`🔴 Firebase Admin Initialization SKIPPED: ${initializationError}`);
            // エラー時、ダミーインスタンスを変数に割り当てる
            adminAuthInstance = createDummyAuth(initializationError || "Admin credentials missing.");
            adminDbInstance = createDummyDb(initializationError || "Admin credentials missing.");
        } else {
            // 正常初期化
            const app = admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
            console.log("✅ Firebase Admin SDK initialized successfully.");
            adminDbInstance = app.firestore();
            adminAuthInstance = app.auth();
        }
    } else {
        // 既に初期化済みの場合
        const app = admin.app();
        adminDbInstance = app.firestore();
        adminAuthInstance = app.auth();
    }
    
} catch (error: any) {
    console.error("🔴 Firebase Admin initialization error (Catch Block):", error);
    const finalErrorMsg = error.message || "Unknown initialization failure.";
    // 致命的なエラーでも、ダミーを割り当てることで参照エラーを防ぐ
    adminAuthInstance = createDummyAuth(finalErrorMsg);
    adminDbInstance = createDummyDb(finalErrorMsg);
}

// ★修正点: 最終的なインスタンスを名前付きエクスポート
export const adminDb = adminDbInstance; 
export const adminAuth = adminAuthInstance;























