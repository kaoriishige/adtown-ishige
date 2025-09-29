import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

// Stripeのシークレットキーで初期化します
// 環境変数（.env.local）に `STRIPE_SECRET_KEY` を設定してください
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10', // プロジェクトのStripeライブラリに合わせたバージョン
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    // フロントエンドのフォームから送信される情報を取得します
    const { email, companyName, uid, trialEndDate } = req.body;

    // 環境変数の名前を STRIPE_JOB_PRICE_ID に変更
    const priceId = process.env.STRIPE_JOB_PRICE_ID;

    // --- バリデーション ---
    if (!priceId) {
      // エラーメッセージも分かりやすく更新
      throw new Error('Stripeの価格ID(STRIPE_JOB_PRICE_ID)が環境変数に設定されていません。');
    }
    if (!uid || !email || !companyName || !trialEndDate) {
      return res.status(400).json({ error: { message: 'リクエストに必要な情報が不足しています。' } });
    }

    // --- Stripe顧客の作成 ---
    // このユーザーがStripe上にすでに存在するかどうかを確認
    let customer;
    const existingCustomers = await stripe.customers.list({ email: email, limit: 1 });
    if (existingCustomers.data.length > 0) {
        customer = existingCustomers.data[0];
    } else {
        // 存在しない場合は、新しい顧客を作成します
        customer = await stripe.customers.create({
            email: email,
            name: companyName,
            metadata: {
                firebaseUID: uid, // FirebaseのUIDをメタデータとして保存
            },
        });
    }

    // --- リダイレクトURLの設定 ---
    // ▼▼▼ 【修正点】環境変数の名前を NEXT_PUBLIC_APP_URL に変更 ▼▼▼
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.headers.origin || 'http://localhost:3000';
    // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
    
    // 【重要】決済成功後に正しいダッシュボードへ遷移させます
    const successUrl = `${baseUrl}/recruit/dashboard?payment_success=true`;
    const cancelUrl = `${baseUrl}/recruit`; // 登録ページに戻る

    // --- トライアル終了日時の設定 ---
    // '2025-11-01' のような文字列をUNIXタイムスタンプに変換します
    const trialEndTimestamp = Math.floor(new Date(trialEndDate).getTime() / 1000);

    // --- Stripeチェックアウトセッションの作成 ---
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer: customer.id, // 作成したStripe顧客のIDを指定
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      subscription_data: {
        trial_end: trialEndTimestamp, // 無料トライアル終了日を設定
      },
      success_url: successUrl, // 成功時のリダイレクト先
      cancel_url: cancelUrl,   // キャンセル時のリダイレクト先
      metadata: {
        firebaseUID: uid, // 念のためセッションにもUIDを保存
      }
    });

    // フロントエンドにセッションIDを返します
    res.status(200).json({ sessionId: session.id });

  } catch (error: any) {
    console.error('Stripeセッションの作成に失敗しました:', error);
    res.status(500).json({ error: { message: error.message } });
  }
}
















