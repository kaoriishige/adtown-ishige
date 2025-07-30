import type { NextApiRequest, NextApiResponse } from 'next';
import admin from '../../lib/firebase-admin'; // 修正済みのimport文
import Stripe from 'stripe';
import nookies from 'nookies';

// Stripeの初期化
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
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
  // POSTメソッド以外のリクエストは拒否
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    // 1. Cookieからトークンを取得し、ユーザーを認証
    const cookies = nookies.get({ req });
    if (!cookies.token) {
      return res.status(401).json({ error: '認証されていません。' });
    }
    const token = await admin.auth().verifyIdToken(cookies.token);
    const { uid, email } = token;

    // 2. Firestoreからユーザーの情報を取得
    const db = admin.firestore();
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();
    let stripeAccountId = userDoc.data()?.stripeConnectAccountId;

    // 3. もしStripeアカウントIDがなければ、新しく作成
    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: email,
        capabilities: {
          transfers: { requested: true }, // 報酬の送金機能をリクエスト
        },
      });
      stripeAccountId = account.id;

      // 4. 作成したIDをFirestoreに保存
      await userRef.set({ stripeConnectAccountId: stripeAccountId }, { merge: true });
    }

    // 5. ユーザーが口座情報を登録するための、特別なURL（アカウントリンク）を作成
    const returnUrl = `${process.env.BASE_URL}/mypage`; // 登録完了後に戻ってくるURL

    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: returnUrl, // 無効になった場合のリダイレクト先
      return_url: returnUrl,  // 登録完了後のリダイレクト先
      type: 'account_onboarding',
    });

    // 6. 作成したURLをクライアントに返す
    res.status(200).json({ url: accountLink.url });

  } catch (error) {
    console.error('Stripe Connectアカウントの作成に失敗しました:', error);
    res.status(500).json({ error: 'サーバー側でエラーが発生しました。' });
  }
}