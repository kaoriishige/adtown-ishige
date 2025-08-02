import type { NextApiRequest, NextApiResponse } from 'next';
import * as admin from 'firebase-admin'; // firebase-adminを直接インポート

// --- ここからが直接書き込んだコード ---
let app: admin.app.App | null = null;
function initializeFirebaseAdmin(): admin.app.App {
  if (admin.apps.length > 0) {
    app = admin.app();
    return app;
  }
  const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (!serviceAccountBase64) {
    throw new Error('環境変数 FIREBASE_SERVICE_ACCOUNT_BASE64 が設定されていません。');
  }
  const serviceAccountJson = Buffer.from(serviceAccountBase64, 'base64').toString('utf-8');
  const serviceAccount = JSON.parse(serviceAccountJson);
  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  return app;
}
function getAdminAuth(): admin.auth.Auth | null {
  try {
    if (!app) initializeFirebaseAdmin();
    return admin.auth(app!);
  } catch (e) { return null; }
}
function getAdminDb(): admin.firestore.Firestore | null {
  try {
    if (!app) initializeFirebaseAdmin();
    return admin.firestore(app!);
  } catch (e) { return null; }
}
// --- ここまでが直接書き込んだコード ---

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const adminDb = getAdminDb();
  if (!adminDb) {
    return res.status(500).json({ error: 'Firebase Admin SDK not initialized' });
  }

  try {
    // ここに管理者認証のロジックを追加することを推奨します
    // 例: const token = await getAdminAuth().verifyIdToken(req.cookies.token);
    // if (!token.admin) throw new Error('Unauthorized');

    const usersSnapshot = await adminDb.collection('users').get();
    let updatedCount = 0;

    for (const userDoc of usersSnapshot.docs) {
      const { uid } = userDoc.data();
      const rewardsSnapshot = await adminDb.collection('referralRewards')
        .where('referrerUid', '==', uid)
        .get();
      
      let total = 0;
      let pending = 0;
      rewardsSnapshot.forEach(rewardDoc => {
        const reward = rewardDoc.data();
        total += reward.rewardAmount || 0;
        if (reward.rewardStatus === 'pending') {
          pending += reward.rewardAmount || 0;
        }
      });

      await userDoc.ref.update({
        totalRewardAmount: total,
        pendingRewardAmount: pending,
      });
      updatedCount++;
    }

    res.status(200).json({ success: true, message: `${updatedCount}人のユーザーの報酬額を更新しました。` });
  } catch (error) {
    console.error('Error recalculating rewards:', error);
    res.status(500).json({ error: 'Failed to recalculate rewards' });
  }
}