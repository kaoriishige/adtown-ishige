import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

// Stripeの初期化（環境変数はNetlifyのUIで設定したものを使用）
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2023-10-16' as Stripe.LatestApiVersion,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // POSTメソッド以外は受け付けない
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    // フロントエンドから送られてくるユーザー情報を取得
    const { email, userId } = req.body;

    // Stripe Checkoutセッションの作成
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      
      // Netlifyに登録した価格IDを使用。なければフォールバック。
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID_480 || 'price_xxxxxxxx480',
          quantity: 1,
        },
      ],

      // 7日間の無料トライアル設定
      subscription_data: {
        trial_period_days: 7,
      },

      // ✅ 重要: 決済完了後に誰が支払ったか特定するためにユーザー情報を紐付ける
      client_reference_id: userId || email, 
      customer_email: email, // 入力済みのメールアドレスをStripeに引き継ぐ

      // 決済完了時とキャンセルのリダイレクト先
      // 本番環境と開発環境の両方で動くように origin を取得
      success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/`,
    });

    // フロントエンドへ決済URLを返す
    res.status(200).json({ url: session.url });
  } catch (err: any) {
    console.error('❌ Stripe Checkout error:', err.message);
    res.status(500).json({ error: '決済セッションの作成に失敗しました。', message: err.message });
  }
}