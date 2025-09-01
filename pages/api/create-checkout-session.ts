import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

// Stripe SDKを初期化します。シークレットキーは環境変数から取得してください。
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// メインのAPIハンドラー関数
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // POSTメソッド以外は許可しない
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    // フロントエンドからユーザーIDと紹介者IDを受け取る
    const { uid, referrerUid } = req.body;
    if (!uid) {
      return res.status(400).json({ error: 'User ID is missing' });
    }

    // Netlifyの環境変数から2つの価格IDを読み込む
    const standardPriceId = process.env.STRIPE_STANDARD_PRICE_ID; // 980円プラン用
    const campaignPriceId = process.env.STRIPE_CAMPAIGN_PRICE_ID; // 480円プラン用

    // 環境変数が設定されているか確認
    if (!standardPriceId || !campaignPriceId) {
      throw new Error('Stripe Price IDs are not set in environment variables.');
    }

    // 現在の日時を取得
    const now = new Date();
    // キャンペーン終了日時（2025年11月1日 00:00:00 JST）を設定
    const campaignEndDate = new Date('2025-10-31T15:00:00Z'); // UTCでの終了日時

    let session;
    const trial_period_days = 7; // 7日間の無料トライアル

    // ▼▼▼ 変更点：現在の日付がキャンペーン期間中かどうかだけで判断します ▼▼▼
    if (now < campaignEndDate) {
      // --- 10月31日までの申し込みはこちらの処理 ---
      
      const phase1EndDate = Math.floor(campaignEndDate.getTime() / 1000);

      session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [{ price: campaignPriceId, quantity: 1 }],
        subscription_data: {
          trial_period_days: trial_period_days,
          metadata: { uid: uid, referrerUid: referrerUid || '' },
          // 11月1日から自動で980円プランに切り替わります
          phases: [
            {
              items: [{ price: campaignPriceId, quantity: 1 }],
              end_date: phase1EndDate,
              proration_behavior: 'none',
            },
            {
              items: [{ price: standardPriceId, quantity: 1 }],
            },
          ],
        } as any, 
        success_url: `${req.headers.origin}/login?signup=success`,
        cancel_url: `${req.headers.origin}/signup?canceled=true`,
      });

    } else {
      // --- 11月1日以降の申し込みはこちらの処理 ---
      session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [{ price: standardPriceId, quantity: 1 }],
        subscription_data: {
          trial_period_days: trial_period_days,
          metadata: { uid: uid, referrerUid: referrerUid || '' },
        },
        success_url: `${req.headers.origin}/login?signup=success`,
        cancel_url: `${req.headers.origin}/signup?canceled=true`,
      });
    }

    // 作成したセッションIDをクライアントに返す
    res.status(200).json({ sessionId: session.id });

  } catch (error) {
    console.error('Stripe API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ statusCode: 500, message: errorMessage });
  }
}

