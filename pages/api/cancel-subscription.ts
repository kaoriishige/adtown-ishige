import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import nookies from 'nookies';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

// ★★★ レスポンスの型を統一 ★★★
type ApiResponse = {
  success: boolean;
  message: string;
}

// Stripeの初期化をハンドラ内に移動
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { ... });

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse> // ★レスポンス型を適用
) {
  // POSTリクエスト以外は拒否
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  // ★★★ 変更点 1: Stripeの初期化をハンドラ内に移動し、キーの存在をチェック ★★★
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    console.error('Stripe secret key is not set in environment variables.');
    return res.status(500).json({ success: false, message: 'サーバー設定エラー: 決済キーがありません。' });
  }

  // Stripe SDKを初期化
  const stripe = new Stripe(stripeSecretKey, {
    // @ts-expect-error StripeのAPIバージョン型定義が環境変数と合わない場合があるため
    apiVersion: '2024-06-20',
  });
  // ★★★ 変更ここまで ★★★

  if (!adminAuth || !adminDb) {
    console.error("Firebase Admin on cancel-subscription failed to initialize.");
    return res.status(500).json({ success: false, message: 'サーバーの初期化に失敗しました。' });
  }

  try {
    console.log("API: /api/cancel-subscription handler started."); // ★ ログ追加
    
    // 1. ユーザーを認証する
    const cookies = nookies.get({ req });
    if (!cookies.session) {
      console.log("API Error: No session cookie found.");
      return res.status(401).json({ success: false, message: '認証されていません。再度ログインしてください。' });
    }

    const token = await adminAuth.verifySessionCookie(cookies.session, true);
    const { uid } = token;
    console.log(`API: User authenticated. UID: ${uid}`); // ★ ログ追加

    // 2. FirestoreからユーザーのサブスクリプションIDを取得する
    const userDocRef = adminDb.collection('users').doc(uid);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      console.log(`API Error: User doc not found for UID: ${uid}`);
      return res.status(404).json({ success: false, message: 'ユーザー情報が見つかりません。' });
    }

    const userData = userDoc.data();
    const stripeSubscriptionId = userData?.stripeSubscriptionId;
    console.log(`API: Found subscription ID: ${stripeSubscriptionId}`); // ★ ログ追加

    if (!stripeSubscriptionId) {
      return res.status(400).json({ success: false, message: 'サブスクリプション情報が見つかりません。' });
    }

    // 3. Stripeのサブスクリプションをキャンセルする
    console.log(`API: Attempting to cancel Stripe subscription: ${stripeSubscriptionId}`); // ★ ログ追加
    await stripe.subscriptions.update(stripeSubscriptionId, {
      cancel_at_period_end: true,
    });
    console.log("API: Stripe subscription cancellation successful."); // ★ ログ追加
    
    // 4. Firestoreのユーザー情報を更新する
    await userDocRef.update({
      subscriptionStatus: 'canceled', // ステータスを 'canceled' に変更
      isPaid: false, // ★ isPaid も false に更新
    });
    console.log("API: Firestore user doc updated."); // ★ ログ追加

    // 5. Firebase Authのカスタムクレームを更新する
    await adminAuth.setCustomUserClaims(uid, { ...token, isPaid: false });
    console.log("API: Firebase Auth custom claims updated."); // ★ ログ追加
    
    res.status(200).json({ success: true, message: 'サブスクリプションの解約手続きが完了しました。' });

  } catch (error) {
    console.error('Subscription cancellation error:', error);
    const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました。';
    
    res.status(500).json({ success: false, message: `解約処理中にエラーが発生しました: ${errorMessage}` });
  }
}