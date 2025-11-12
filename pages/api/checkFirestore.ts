import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "@/lib/firebase-admin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log("🔍 Firestore構造確認中...");

  const artifactsUsers = await adminDb
    .collection("artifacts")
    .doc("default-app-id")
    .collection("users")
    .get();

  const rootUsers = await adminDb.collection("users").get();

  console.log("📦 artifacts/default-app-id/users:", artifactsUsers.size);
  console.log("📦 users:", rootUsers.size);

  res.status(200).json({
    artifacts_users: artifactsUsers.size,
    root_users: rootUsers.size,
  });
}
