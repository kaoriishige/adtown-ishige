import * as admin from "firebase-admin";

// 型定義のみエクスポート
export type { admin };

// サーバーサイドでのみ初期化を実行
const initializeFirebaseAdmin = () => {
    if (!admin.apps.length) {
        const projectId = process.env.FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
        const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

        if (!projectId || !clientEmail || !privateKey) {
            console.error("❌ Firebase Admin credentials missing.");
            return null;
        }

        try {
            return admin.initializeApp({
                credential: admin.credential.cert({
                    projectId,
                    clientEmail,
                    privateKey,
                }),
            });
        } catch (err) {
            console.error("🔥 Initialization failed:", err);
            return null;
        }
    }
    return admin.app();
};

// サーバーサイドでのみ有効なインスタンスを取得する関数
const getAdminInstances = () => {
    if (typeof window !== "undefined") {
        // クライアントサイドで呼ばれた場合はエラーを投げるか、プロキシでガードする
        return { adminDb: null as any, adminAuth: null as any };
    }

    initializeFirebaseAdmin();
    return {
        adminDb: admin.firestore(),
        adminAuth: admin.auth(),
    };
};

export const { adminDb, adminAuth } = getAdminInstances();

























