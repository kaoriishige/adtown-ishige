import type { NextApiRequest, NextApiResponse } from 'next';
import { admin } from '../../../lib/firebase-admin'; // Firebase Admin SDKの初期化ファイルをインポート
import Stripe from 'stripe';

// Stripe SDKをシークレットキーで初期化
// process.env.STRIPE_SECRET_KEY にキーが設定されている必要があります
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // POSTリクエスト以外は拒否
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    // 1. フロントエンドから送信されたフォームデータを取得
    const {
      storeName,
      address,
      area,
      contactPerson,
      phoneNumber,
      qrStandCount,
      email,
      password,
      category,
    } = req.body;

    // 2. サーバーサイドでの簡単なバリデーション
    if (!email || !password || !storeName || !address) {
        return res.status(400).json({ error: '必須項目が不足しています。' });
    }

    // 3. Firebase Authenticationでユーザーを新規作成
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: storeName,
    });
    const uid = userRecord.uid;

    // 4. Firestoreにパートナーの詳細情報を保存
    const partnerRef = admin.firestore().collection('partners').doc(uid);
    await partnerRef.set({
      uid,
      storeName,
      email,
      address,
      area,
      contactPerson,
      phoneNumber,
      qrStandCount,
      category,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      subscriptionStatus: 'incomplete', // 決済前の初期ステータス
      role: 'partner', // 権限管理用のロール
    });

    // 5. Stripe Checkout Sessionを作成
    const priceId = process.env.STRIPE_AD_PRICE_ID;
    if (!priceId) {
        throw new Error('Stripeの料金ID(STRIPE_AD_PRICE_ID)が設定されていません。');
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription', // サブスクリプションモード
      // 決済成功時とキャンセル時のリダイレクト先URL
      success_url: `${req.headers.origin}/partner/dashboard?payment_success=true`,
      cancel_url: `${req.headers.origin}/partner/signup`,
      // FirebaseのUIDをStripe側に渡しておくことで、後でどのユーザーの決済か紐付けられる
      client_reference_id: uid,
      metadata: {
        firebaseUID: uid,
      }
    });

    // 6. フロントエンドにセッションIDを返す
    return res.status(200).json({ sessionId: session.id });

  } catch (error: any) {
    console.error('Stripe Checkout Session作成エラー:', error);
    let errorMessage = '登録処理中にサーバーエラーが発生しました。';
    // Firebaseのエラーコードに応じたメッセージを返す
    if (error.code === 'auth/email-already-exists') {
        errorMessage = 'このメールアドレスは既に使用されています。別のメールアドレスをお試しください。';
    } else if (error instanceof Stripe.errors.StripeError) {
        errorMessage = `決済システムの接続に失敗しました: ${error.message}`;
    } else if (error.message) {
        errorMessage = error.message;
    }
    return res.status(500).json({ error: errorMessage });
  }
}