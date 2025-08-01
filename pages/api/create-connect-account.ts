import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminAuth, getAdminDb } from '../../lib/firebase-admin'; // 修正済みのimport
import Stripe from 'stripe';
import nookies from 'nookies';

// Stripe SDKの初期化
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 修正済みのFirebase Admin SDKの呼び出し
  const adminAuth = getAdminAuth();
  const adminDb = getAdminDb();

  // 初期化に失敗した場合はエラーを返す
  if (!adminAuth || !adminDb) {
    console.error("Firebase Admin on create-connect-account failed to initialize.");
    return res.status(500).json({ error: 'サーバーの初期化に失敗しました。' });
  }

  try {
    // 1. ユーザー認証
    const cookies = nookies.get({ req });
    const token = await adminAuth.verifyIdToken(cookies.token);
    const { uid, email } = token;

    // 2. Stripe Expressアカウントを作成
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'JP',
      email: email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    // 3. 作成したアカウントIDをFirestoreに保存
    await adminDb.collection('users').doc(uid).set({
      stripeAccountId: account.id,
      stripeAccountEnabled: false, // 初期状態はfalse
    }, { merge: true });

    // 4. アカウント登録用のURL（アカウントリンク）を生成
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.BASE_URL}/payout-settings?reauth=true`,
      return_url: `${process.env.BASE_URL}/mypage`,
      type: 'account_onboarding',
    });

    // 5. URLをクライアントに返す
    res.status(200).json({ url: accountLink.url });

  } catch (error) {
    console.error("Stripe Connect account creation failed:", error);
    res.status(500).json({ error: 'Stripeアカウントの作成中にエラーが発生しました。' });
  }
}