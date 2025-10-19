// createFirestoreStructure.js
import admin from "firebase-admin";
import { readFileSync } from "fs";

// サービスアカウントキーを読み込み
const serviceAccount = JSON.parse(readFileSync("./serviceAccountKey.json", "utf-8"));

// Firebase Admin SDK 初期化
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function createDemoData() {
  const ownerId = "9cLXdzFbkaOhvixQ1K5FVkPW4L23";
  const storeId = "4WjxkGjlhW3k2Hq7YENn";
  const dealId = "deal001";

  console.log("⚙️ Firestore構造を作成中...");

  // owners/{ownerId}/stores/{storeId}
  const storeRef = db
    .collection("owners")
    .doc(ownerId)
    .collection("stores")
    .doc(storeId);

  await storeRef.set({
    storeName: "サクセス研究社",
    address: "栃木県那須塩原市上厚崎578-30",
    mainCategory: "専門サービス関連",
    subCategory: "コンサルティング",
    phoneNumber: "080-6526-8070",
    websiteUrl: "https://www.adtown2006.com/",
    status: "approved",
    public: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // deals サブコレクション
  await storeRef.collection("deals").doc(dealId).set({
    title: "AI&勉強会",
    description: "AI&勉強会",
    type: "お得情報",
    isActive: true,
    imageUrl: "https://firebasestorage.googleapis.com/v0/b/minna-no-nasu-app.firebasestorage.app/o/demo-image.jpg?alt=media",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log("✅ 完了: owners → stores → deals 構造を作成しました");
}

createDemoData()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ エラー:", err);
    process.exit(1);
  });
