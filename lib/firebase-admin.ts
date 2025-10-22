// @/lib/firebase-admin.ts

import * as admin from "firebase-admin";
import fs from "fs";

// ファイルからサービスアカウントJSONを読み込み
let serviceAccount: admin.ServiceAccount | null = null;
try {
  const jsonData = fs.readFileSync("firebase-service-account.json", "utf8");
  serviceAccount = JSON.parse(jsonData);
  console.log("✅ firebase-service-account.json loaded successfully.");
} catch (error) {
  console.error("🔴 Failed to load firebase-service-account.json:", error);
}

let adminDb: admin.firestore.Firestore;
let adminAuth: admin.auth.Auth;

// ダミーAuth
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
  } as unknown as admin.auth.Auth;
};

// ダミーDB
const createDummyDb = (errorMessage: string): admin.firestore.Firestore => {
  return {
    collection: (path: string) => {
      console.error(`🔴 DUMMY_DB_CALL: collection(${path}) called. Error: ${errorMessage}`);
      throw new Error(`Firebase Admin DB Not Initialized: ${errorMessage}`);
    },
  } as unknown as admin.firestore.Firestore;
};

// 初期化
try {
  if (!admin.apps.length) {
    if (!serviceAccount) {
      const errorMsg = "firebase-service-account.json not found or invalid.";
      console.error(`🔴 ${errorMsg}`);
      adminAuth = createDummyAuth(errorMsg);
      adminDb = createDummyDb(errorMsg);
      throw new Error(errorMsg);
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("✅ Firebase Admin SDK initialized successfully.");
  }

  adminDb = admin.firestore();
  adminAuth = admin.auth();

} catch (error: any) {
  console.error("🔴 Firebase Admin initialization error:", error);
  const finalErrorMsg = error.message || "Unknown initialization failure.";
  adminAuth = createDummyAuth(finalErrorMsg);
  adminDb = createDummyDb(finalErrorMsg);
}

export { adminDb, adminAuth };






















