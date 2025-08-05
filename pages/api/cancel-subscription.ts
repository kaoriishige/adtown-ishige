// pages/api/cancel-subscription.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import nookies from 'nookies';
import { getAdminAuth, getAdminDb } from '../../lib/firebase-admin';

// Stripe SDKを初期化
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // @ts-ignore
  apiVersion: '2024-06-20',
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // POSTリクエスト以外は拒否
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const adminAuth = getAdminAuth();
  const adminDb = getAdminDb();

  if (!adminAuth || !adminDb) {
    console.error("Firebase Admin on cancel-subscription failed to initialize.");
    return res.status(500).json({ error: 'サーバーの初期化に失敗しました。' });
  }

  try {
    // 1. ユーザーを認証する
    const cookies = nookies.get({ req });
    const token = await adminAuth.verifyIdToken(cookies.token);
    const { uid } = token;

    // 2. FirestoreからユーザーのサブスクリプションIDを取得する
    const userDocRef = adminDb.collection('users').doc(uid);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'ユーザー情報が見つかりません。' });
    }

    const stripeSubscriptionId = userDoc.data()?.stripeSubscriptionId;

    if (!stripeSubscriptionId) {
      return res.status(400).json({ error: 'サブスクリプション情報が見つかりません。' });
    }

    // 3. Stripeのサブスクリプションをキャンセルする
    // Stripe側で即時解約ではなく、請求期間の終了時に解約するように設定
    await stripe.subscriptions.update(stripeSubscriptionId, {
      cancel_at_period_end: true,
    });
    
    // 4. Firestoreのユーザー情報を更新する
    await userDocRef.update({
      subscriptionStatus: 'canceled', // ステータスを 'canceled' に変更
    });

    // 5. Firebase Authのカスタムクレームを更新する（任意ですが推奨）
    await adminAuth.setCustomUserClaims(uid, { stripeRole: 'free' });

    console.log(`ユーザー(UID: ${uid})のサブスクリプションが正常に解約予約されました。`);
    res.status(200).json({ message: 'サブスクリプションの解約手続きが完了しました。' });

  } catch (error) {
    console.error('Subscription cancellation error:', error);
    const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました。';
    res.status(500).json({ error: `解約処理中にエラーが発生しました: ${errorMessage}` });
  }
}