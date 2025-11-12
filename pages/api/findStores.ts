import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "@/lib/firebase-admin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const results: any[] = [];

  try {
    const usersSnapshot = await adminDb.collection("users").get();
    console.log("👤 users count:", usersSnapshot.size);

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;

      // 🔍 候補1: users/{userId}/stores
      const stores1 = await userDoc.ref.collection("stores").get();

      // 🔍 候補2: users/{userId}/artifacts/default-app-id/stores
      const artifactsStores = await userDoc.ref
        .collection("artifacts")
        .doc("default-app-id")
        .collection("stores")
        .get();

      results.push({
        userId,
        stores1: stores1.size,
        artifactsStores: artifactsStores.size,
      });

      console.log(
        `👤 ${userId}: stores=${stores1.size}, artifactsStores=${artifactsStores.size}`
      );
    }

    res.status(200).json(results);
  } catch (error) {
    console.error("🔥 Firestore check error:", error);
    res.status(500).json({ error: "Firestore check failed" });
  }
}
