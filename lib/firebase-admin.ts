// @/lib/firebase-admin.ts (TSエラーを完全に解消し、他のファイルで安全に使用可能)

import * as admin from "firebase-admin";
// fsはNode.jsのモジュールなので、クライアントにバンドルされないよう注意が必要
import fs from "fs"; 

// 🚨 エクスポートされる実際の変数
let adminDbInstance: admin.firestore.Firestore;
let adminAuthInstance: admin.auth.Auth;

// --- ダミー関数定義（クラッシュ回避のため、AdminSDKが初期化されない場合に備える）---
const createDummyAuth = (errorMessage: string): admin.auth.Auth => {
    // 💡 エラーが発生した場合にダミーメソッドを呼び出すことで、nullではないインスタンスを保証
    return {
        verifySessionCookie: async () => { throw new Error(`Admin Auth Not Initialized: ${errorMessage}`); },
        getUser: async (uid: string) => { throw new Error(`Admin Auth Not Initialized: ${errorMessage}`); },
        // ... (他のメソッドのダミー定義は省略) ...
    } as unknown as admin.auth.Auth;
};

const createDummyDb = (errorMessage: string): admin.firestore.Firestore => {
    // 💡 エラーが発生した場合にダミーメソッドを呼び出すことで、nullではないインスタンスを保証
    return {
        collection: (path: string) => { 
            throw new Error(`Admin DB Not Initialized: ${errorMessage}`);
        },
        // ... (他のメソッドのダミー定義は省略) ...
    } as unknown as admin.firestore.Firestore;
};


// --- Node.js環境チェック (ビルドログ問題を解消する中核の修正) ---
if (typeof window === 'undefined') {

    const SERVICE_ACCOUNT_KEY_PATH = "firebase-service-account.json"; 
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    let serviceAccount: admin.ServiceAccount | null = null;
    let initializationError: string | null = null;

    try {
        if (serviceAccountJson) {
            serviceAccount = JSON.parse(serviceAccountJson);
            // console.log("✅ Admin credentials loaded from environment variable."); // 冗長なログをコメントアウト
        } else {
            // fsモジュールはNode.js環境でのみ実行される
            const jsonData = fs.readFileSync(SERVICE_ACCOUNT_KEY_PATH, "utf8");
            serviceAccount = JSON.parse(jsonData);
            // console.log("✅ Service account file loaded successfully."); // 冗長なログをコメントアウト
        }
    } catch (error) {
        // 環境変数やファイル読み込みの失敗
        initializationError = `Admin credentials load FAILED. Service account data missing or invalid.`;
        console.error("🔴 Failed to load service account:", initializationError);
    }

    // --- 初期化ロジック ---
    try {
        if (!admin.apps.length) {
            if (initializationError || !serviceAccount) {
                console.error(`🔴 Firebase Admin Initialization SKIPPED (No valid credentials).`);
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

} else {
    // --- クライアントサイドでの処理 (クライアント混入エラーを防ぐため) ---
    const clientErrorMsg = "Admin SDK must NOT be imported on the client side (window object exists).";
    // ビルドログスパムを防ぐため、warnは使用を控えるが、エラーを防ぐための措置は取る
    
    // Admin SDKがクライアントサイドにインポートされた場合、必ずエラーを発生させるダミーを割り当てる
    const createClientSideError = (method: string): any => {
        return () => { throw new Error(`${clientErrorMsg} Attempted method: ${method}`); };
    };

    adminAuthInstance = {
        verifySessionCookie: createClientSideError('verifySessionCookie'),
        getUser: createClientSideError('getUser'),
    } as unknown as admin.auth.Auth;

    adminDbInstance = {
        collection: createClientSideError('collection'),
    } as unknown as admin.firestore.Firestore;
}

// 最終的なインスタンスを名前付きエクスポート
export const adminDb = adminDbInstance; 
export const adminAuth = adminAuthInstance;























