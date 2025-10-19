import * as admin from "firebase-admin";
import path from "path";
import fs from "fs";

let adminDb: admin.firestore.Firestore;
let adminAuth: admin.auth.Auth;

try {
    if (!admin.apps.length) {
        let serviceAccountJson: string;

        if (process.env.NODE_ENV === 'production' && process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
            // 1. Netlify/Vercelなどの本番環境: 環境変数からJSON文字列を読み込む
            serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
            console.log("✅ Admin SDK: Initializing from Environment Variable.");
        } else {
            // 2. ローカル開発環境: ローカルファイルから読み込む
            const serviceAccountPath = path.resolve(
                process.cwd(),
                "firebase-service-account.json"
            );
            console.log("✅ Admin SDK: Initializing from local file.");
            
            // 🚨 fs.readFileSync() は同期的なため、try/catchで包む
            serviceAccountJson = fs.readFileSync(serviceAccountPath, "utf8");
        }

        const serviceAccount = JSON.parse(serviceAccountJson);
        console.log("✅ JSON keys:", Object.keys(serviceAccount));

        // 3. Admin SDKの初期化
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            // databaseURL: process.env.FIREBASE_DATABASE_URL, // 必要に応じて追加
        });
        console.log("✅ Firebase Admin SDK initialized successfully.");
    }

    // 初期化されたFirestoreとAuthインスタンスを変数に代入
    adminDb = admin.firestore();
    adminAuth = admin.auth();
    console.log("✅ Firestore instance type:", typeof adminDb);
    
} catch (error) {
    console.error("🔴 Firebase Admin initialization error:", error);
    // 開発継続のため、エラー時にダミーを代入 (実際のFirestore操作は失敗します)
    adminDb = {} as any;
    adminAuth = {} as any;
}

export { adminDb, adminAuth };





















