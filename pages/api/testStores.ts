import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "@/lib/firebase-admin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const APP_ID = "default-app-id";
  const stores: any[] = [];

  try {
    const usersSnapshot = await adminDb
      .collection("artifacts")
      .doc(APP_ID)
      .collection("users")
      .get();

    console.log("👤 users count:", usersSnapshot.size);

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;

      const storesSnapshot = await userDoc.ref.collection("stores").get();
      console.log(`📁 user ${userId} → stores: ${storesSnapshot.size}`);

      storesSnapshot.forEach((doc) => {
        const data = doc.data();
        console.log("📄 store:", doc.id, data.storeName || data.companyName);
        stores.push({
          userId,
          storeId: doc.id,
          ...data,
        });
      });
    }

    res.status(200).json({
      usersCount: usersSnapshot.size,
      storesCount: stores.length,
      stores,
    });
  } catch (error) {
    console.error("🔥 Firestore test error:", error);
    res.status(500).json({ error: "Firestore test failed" });
  }
}
