import * as admin from "firebase-admin";
import fs from "fs";

let adminDbInstance: admin.firestore.Firestore;
let adminAuthInstance: admin.auth.Auth;

if (typeof window === 'undefined') {
  let serviceAccount: admin.ServiceAccount | null = null;

  try {
    // ① 環境変数から読み込み
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    } 
    // ② ファイルから読み込み
    else if (fs.existsSync("firebase-service-account.json")) {
      const jsonData = fs.readFileSync("firebase-service-account.json", "utf8");
      serviceAccount = JSON.parse(jsonData);
    }

    if (!admin.apps.length) {
      if (!serviceAccount) {
        throw new Error("Firebase Admin credentials not found (環境変数 or JSONファイル)");
      }

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("✅ Firebase Admin SDK initialized successfully.");
    }

    adminDbInstance = admin.firestore();
    adminAuthInstance = admin.auth();

  } catch (error: any) {
    console.error("🔴 Firebase Admin initialization FAILED:", error.message);
    throw new Error("Firebase Admin initialization failed. Check service account credentials.");
  }

} else {
  throw new Error("❌ Firebase Admin SDK should not be imported on client side.");
}

export const adminDb = adminDbInstance;
export const adminAuth = adminAuthInstance;
export { admin };
























