// lib/firebaseAdmin.ts
import * as admin from "firebase-admin";

let adminDbInstance: admin.firestore.Firestore;
let adminAuthInstance: admin.auth.Auth;

if (typeof window === "undefined") {
  if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error("❌ Firebase Admin credentials are missing in environment variables.");
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });

    console.log("✅ Firebase Admin SDK initialized successfully (using env vars).");
  }

  adminDbInstance = admin.firestore();
  adminAuthInstance = admin.auth();
} else {
  throw new Error("❌ Firebase Admin SDK should not be used on the client side.");
}

export const adminDb = adminDbInstance;
export const adminAuth = adminAuthInstance;
export { admin };

























