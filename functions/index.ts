import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";

admin.initializeApp();

export const dailyTask = functions.pubsub
  .schedule("0 3 * * *")
  .timeZone("Asia/Tokyo")
  .onRun(async () => {
    console.log("毎日午前3時に実行されました");
    return null;
  });