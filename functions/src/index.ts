import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

// ... (他のimport文)

export const playDailyLottery = onCall(async (request) => {
    // v2では、認証情報は request.auth で受け取る
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Authentication is required.');
    }
    const { uid } = request.auth;
    const userRef = admin.firestore().collection('users').doc(uid);
    // ... (以降のロジックはほぼ同じ)
});