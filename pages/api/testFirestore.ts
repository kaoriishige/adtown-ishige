import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "@/lib/firebase-admin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log("🧩 Running Firestore test API...");

  try {
    const usersSnapshot = await adminDb.collection("users").get();
    console.log("👤 users count:", usersSnapshot.size);

    const storesSnapshot = await adminDb.collectionGroup("stores").get();
    console.log("🏪 stores count:", storesSnapshot.size);

    storesSnapshot.forEach((doc) => {
      console.log("📄 store doc:", doc.id, doc.data().storeName);
    });

    // ✅ 結果をブラウザでも見られるように返す
    res.status(200).json({
      usersCount: usersSnapshot.size,
      storesCount: storesSnapshot.size,
      stores: storesSnapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })),
    });
  } catch (error) {
    console.error("🔥 Firestore test failed:", error);
    res.status(500).json({ error: "Firestore test failed", details: error });
  }
}

