import * as admin from "firebase-admin";

let adminDbInstance: admin.firestore.Firestore;
let adminAuthInstance: admin.auth.Auth;

if (typeof window === "undefined") {
    console.log("🧩 Running on SERVER side");

    // ✅ 環境変数の読み込み確認
    console.log("🔍 ENV CHECK:", {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY ? "✅ Loaded" : "❌ Missing",
    });

    if (!admin.apps.length) {
        const projectId = process.env.FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
        const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

        if (!projectId || !clientEmail || !privateKey) {
            console.error("❌ Firebase Admin credentials are missing in environment variables.");
            throw new Error("❌ Firebase Admin credentials are missing in environment variables.");
        }

        try {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId,
                    clientEmail,
                    privateKey,
                }),
            });
            console.log("✅ Firebase Admin SDK initialized successfully (using env vars).");
        } catch (err) {
            console.error("🔥 Firebase Admin SDK initialization failed:", err);
            throw err;
        }
    } else {
        console.log("ℹ️ Firebase Admin SDK already initialized.");
    }

    // ✅ Firestore / Auth インスタンス生成
    adminDbInstance = admin.firestore();
    adminAuthInstance = admin.auth();

    console.log("📦 Firestore & Auth instances are ready.");
} else {
    // ⚠️ クライアント側では動かないようにする
    console.log("⚠️ Running on CLIENT side (admin SDK should not run here)");
    adminDbInstance = {} as admin.firestore.Firestore;
    adminAuthInstance = {} as admin.auth.Auth;
}

export const adminDb = adminDbInstance;
export const adminAuth = adminAuthInstance;
export { admin };

























