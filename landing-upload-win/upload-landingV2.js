const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('./serviceAccountKey.json');
const landingData = require('./landingV2.json');

console.log("📘 書き込むデータ内容：", JSON.stringify(landingData, null, 2));

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

async function upload() {
  try {
    await db.doc('settings/landingV2').set(landingData);
    console.log("✅ FirestoreにlandingV2を一括登録しました");
  } catch (err) {
    console.error("❌ 書き込みに失敗：", err);
  }
}

upload();
