const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const testData = [
  { referrerId: "tanaka001", month: "2025-07", targetCount: 3, totalAmount: 750 },
  { referrerId: "suzuki999", month: "2025-07", targetCount: 2, totalAmount: 500 },
  { referrerId: "yamamoto22", month: "2025-06", targetCount: 4, totalAmount: 1200 },
];

async function run() {
  for (const data of testData) {
    await db.collection("referralSummaries").add(data);
  }
  console.log("✅ テストデータを追加しました");
}

run();
