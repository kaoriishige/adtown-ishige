import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import nookies from 'nookies';
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
function adminAuth: admin.auth.Auth | null {
  try {
    if (!app) initializeFirebaseAdmin();
    return admin.auth(app!);
  } catch (e) { return null; }
}
function adminDb: admin.firestore.Firestore | null {
  try {
    if (!app) initializeFirebaseAdmin();
    return admin.firestore(app!);
  } catch (e) { return null; }
}
// --- ここまでが直接書き込んだコード ---

// Stripe SDKの初期化
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // @ts-ignore ★★★ この行を追加して、TypeScriptのエラーを強制的に無視します ★★★
  apiVersion: '2024-06-20',
});

// レスポンスの型定義
type Data = {
  url?: string;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  // 新しい方法でFirebaseを呼び出す
  const adminAuth = adminAuth;
  const adminDb = adminDb;

  if (!adminAuth || !adminDb) {
    return res.status(500).json({ error: 'サーバーの初期化に失敗しました。' });
  }

  try {
    // 1. Cookieからトークンを取得し、ユーザーを認証
    const cookies = nookies.get({ req });
    if (!cookies.token) {
      return res.status(401).json({ error: '認証されていません。' });
    }
    const token = await adminAuth.verifyIdToken(cookies.token);
    const { uid, email } = token;

    // 2. Firestoreからユーザーの情報を取得
    const userRef = adminDb.collection('users').doc(uid);
    const userDoc = await userRef.get();
    let stripeAccountId = userDoc.data()?.stripeAccountId;

    // 3. もしStripeアカウントIDがなければ、新しく作成
    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: email,
        country: 'JP',
        capabilities: {
          transfers: { requested: true },
        },
      });
      stripeAccountId = account.id;

      // 4. 作成したIDをFirestoreに保存
      await userRef.set({ stripeAccountId: stripeAccountId }, { merge: true });
    }

    // 5. ユーザーが口座情報を登録するための特別なURL（アカウントリンク）を作成
    const returnUrl = `${process.env.BASE_URL}/mypage`;

    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${process.env.BASE_URL}/payout-settings?reauth=true`,
      return_url: returnUrl,
      type: 'account_onboarding',
    });

    // 6. 作成したURLをクライアントに返す
    res.status(200).json({ url: accountLink.url });

  } catch (error) {
    console.error('Stripe Connectアカウントの作成に失敗しました:', error);
    res.status(500).json({ error: 'サーバー側でエラーが発生しました。' });
  }
}