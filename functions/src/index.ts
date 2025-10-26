import * as functions from "firebase-functions/v1"; // ← v1を使用
import * as admin from "firebase-admin";

admin.initializeApp();

// 毎日午前3時に実行するスケジュール関数
export const dailyTask = functions.pubsub
  .schedule("0 3 * * *")
  .timeZone("Asia/Tokyo")
  .onRun(async () => {
    console.log("毎日午前3時に実行されました");
    // ここに処理を書く（例: Firestoreデータ更新など）
    return null;
  });



