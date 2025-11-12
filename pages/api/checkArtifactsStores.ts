import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "@/lib/firebase-admin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const APP_ID = "default-app-id";
  const results: any[] = [];

  try {
    const usersSnapshot = await adminDb
      .collection("artifacts")
      .doc(APP_ID)
      .collection("users")
      .get();

    console.log("👤 artifacts/default-app-id/users:", usersSnapshot.size);

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const storesSnapshot = await userDoc.ref.collection("stores").get();

      results.push({
        userId,
        stores: storesSnapshot.size,
      });

      console.log(`📁 user ${userId} → stores: ${storesSnapshot.size}`);
    }

    res.status(200).json(results);
  } catch (error) {
    console.error("🔥 Firestore check error:", error);
    res.status(500).json({ error: "Firestore check failed" });
  }
}
