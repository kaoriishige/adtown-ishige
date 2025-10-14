import * as admin from "firebase-admin";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { calculateMatchScore } from "../lib/ai-matching-engine";

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

export const matchUpdate = onSchedule("every 24 hours", async () => {
  const usersSnap = await db.collection("users").get();
  const jobsSnap = await db.collection("jobs").get();

  const users = usersSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  const jobs = jobsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  for (const user of users) {
    for (const job of jobs) {
      const { score, reasons } = calculateMatchScore(user, job, {});
      await db.collection("matches").doc(`${user.id}_${job.id}`).set(
        {
          userId: user.id,
          jobId: job.id,
          score,
          reasons,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }
  }

  console.log("✅ matchUpdate: AIスコアを再計算しました");
});




