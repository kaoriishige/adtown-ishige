// lib/firebase-admin.ts (ローカルファイル読み込み方式に復元)

import * as admin from "firebase-admin";
// 🚨 ファイルシステムとパスモジュールをインポートし直します
import path from "path";
import fs from "fs";

let adminDb: admin.firestore.Firestore;
let adminAuth: admin.auth.Auth;

try {
    if (!admin.apps.length) {
        // 1. サービスアカウントJSONのパスを解決 (プロジェクトのルートにあると仮定)
        const serviceAccountPath = path.resolve(
            process.cwd(),
            "firebase-service-account.json"
        );
        console.log("✅ Service account path:", serviceAccountPath);

        // 2. JSONファイルを読み込む
        // 以前のログから、この処理は問題なく実行されていたと判断
        const jsonString = fs.readFileSync(serviceAccountPath, "utf8");
        const serviceAccount = JSON.parse(jsonString);
        console.log("✅ JSON keys:", Object.keys(serviceAccount));

        // 3. Admin SDKの初期化
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            // 必要であれば process.env.FIREBASE_DATABASE_URL を追加
        });
        console.log("✅ Firebase Admin SDK initialized successfully via local file.");
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





















