import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

// 環境変数からStripeのシークレットキーを読み込みます
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

// シークレットキーが設定されていない場合は、起動時にエラーをスローして問題を明確にします
if (!STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set in environment variables.");
}

// Stripeクライアントを初期化します
// 最新のAPIバージョンを指定することで、Stripeの機能を安定して利用できます
const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2024-04-10',
});

/**
 * サブスクリプションの状態をトグル（一時停止/再開）するAPIハンドラ
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // POSTメソッド以外は許可しません
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { action } = req.body; // リクエストボディから 'pause' または 'resume' を受け取る
  const sessionCookie = req.cookies.session;

  // セッションクッキーがない場合は認証エラー
  if (!sessionCookie) {
    return res.status(401).json({ error: 'Unauthorized: No session cookie provided.' });
  }

  let uid: string;
  try {
    // セッションクッキーを検証してユーザーID（uid）を取得します
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    uid = decodedToken.uid;
  } catch (error) {
    console.error("Invalid session cookie:", error);
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired session cookie.' });
  }

  try {
    // 1. Firestoreからユーザーデータと購読情報を取得
    const userRef = adminDb.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found.' });
    }
    const userData = userDoc.data();

    // ユーザーデータからStripeの購読IDと現在のステータスを取得
    // Firestoreのフィールド名が異なる場合は、この部分を修正してください
    const subscriptionId = userData?.stripeSubscriptionId;
    const currentStatus = userData?.recruitSubscriptionStatus || 'inactive';

    if (!subscriptionId) {
      console.error(`User ${uid}: Stripe Subscription ID not found in user document.`);
      return res.status(400).json({ error: 'Subscription ID not found. Payment information may be missing.' });
    }

    let newStatus: 'active' | 'paused' | 'trialing' = currentStatus as any;

    // 2. Stripe APIを呼び出して決済ステータスを変更
    if (action === 'pause' && (currentStatus === 'active' || currentStatus === 'trialing')) {
      // ■ 決済の停止処理
      // pause_collection.behavior = 'void' は、現在の請求期間の終わりにサブスクリプションを停止し、
      // 未払いの請求書を無効にします。
      await stripe.subscriptions.update(subscriptionId, {
        pause_collection: { behavior: 'void' }
      });
      newStatus = 'paused';

    } else if (action === 'resume' && currentStatus === 'paused') {
      // ■ 決済の再開処理
      // pause_collection = null を設定すると、サブスクリプションの停止が解除され、
      // 請求が即座に再開されます。
      await stripe.subscriptions.update(subscriptionId, {
        pause_collection: null
      });
      newStatus = 'active';
    } else {
      // すでに目的の状態になっている、または無効な操作の場合は何もしない
      return res.status(200).json({
        newStatus: currentStatus,
        message: `No action taken. Subscription status is already '${currentStatus}'.`
      });
    }

    // 3. Firestoreのユーザードキュメントのステータスを更新
    await userRef.update({
      recruitSubscriptionStatus: newStatus,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 4. ユーザーが所有する全ての求人情報（jobs）のステータスを同期させる
    // これにより、サブスクリプションが停止されると、関連する求人も非アクティブになります
    const jobsQuery = adminDb.collection('jobs').where('ownerId', '==', uid);
    const jobsSnapshot = await jobsQuery.get();
    
    if (!jobsSnapshot.empty) {
        const batch = adminDb.batch();
        const newJobStatus = newStatus === 'paused' ? 'paused' : 'active';
        jobsSnapshot.docs.forEach(doc => {
            batch.update(doc.ref, { status: newJobStatus });
        });
        await batch.commit();
    }
    
    // 5. 成功レスポンスを返す
    return res.status(200).json({ newStatus, message: `Subscription successfully updated to '${newStatus}'.` });

  } catch (error: any) {
    console.error(`Subscription toggle failed for user ${uid}:`, error);

    // Stripe APIからのエラーか、その他のサーバーエラーかを判別
    if (error.code) { // Stripeエラーは通常、codeプロパティを持つ
      return res.status(500).json({ error: `Stripe Error: ${error.message}` });
    }
    return res.status(500).json({ error: 'An unexpected server error occurred.' });
  }
}