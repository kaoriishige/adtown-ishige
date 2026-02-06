import * as admin from "firebase-admin";

// 型の定義
export type { admin as AdminType };

const initializeFirebaseAdmin = () => {
    // サーバーサイドでのみ実行
    if (typeof window !== "undefined") return null;

    if (!admin.apps.length) {
        const projectId = process.env.FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
        const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

        if (!projectId || !clientEmail || !privateKey) {
            console.error("❌ Firebase Admin credentials missing in environment variables.");
            return null;
        }

        try {
            return admin.initializeApp({
                credential: admin.credential.cert({
                    projectId,
                    clientEmail,
                    privateKey,
                }),
                storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
            });
        } catch (err) {
            console.error("🔥 Firebase Admin SDK initialization failed:", err);
            return null;
        }
    }
    return admin.app();
};

// 初期化を実行
initializeFirebaseAdmin();

// 各インスタンスと、admin本体をエクスポート
// クライアントサイドでは proxy を使って、未定義メソッド呼び出しによるフリーズを防ぐ
const isServer = typeof window === "undefined";

export const adminDb = isServer ? admin.firestore() : {} as admin.firestore.Firestore;
export const adminAuth = isServer ? admin.auth() : {} as admin.auth.Auth;
export { admin }; // これを忘れていたためビルドエラーが出ていました

























