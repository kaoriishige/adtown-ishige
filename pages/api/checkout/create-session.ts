/**
 * ============================================================
 * [FILE] /pages/api/checkout/create-session.ts
 * [FUNCTION] Stripe Connectを使用した手数料徴収型チェックアウト
 * [FEE] 20% (application_fee_amount)
 * ============================================================
 */

import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

/**
 * 1. STRIPE INITIALIZATION
 * バックエンド専用のシークレットキーを使用
 */
/**
 * 1. STRIPE INITIALIZATION
 */
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    // ここを "2023-10-16" から エラーメッセージが求めている "2023-08-16" に修正
    apiVersion: '2023-08-16',
});

/**
 * 2. MAIN HANDLER
 */
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    // POSTメソッド以外は拒否
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).end('Method Not Allowed');
    }

    try {
        const {
            price,          // 商品価格 (例: 10000)
            productName,    // 商品名
            sellerStripeId, // 出品者のStripeアカウントID (acct_...)
            successUrl,
            cancelUrl
        } = req.body;

        // バリデーション
        if (!price || !sellerStripeId) {
            throw new Error('価格または出品者IDが不足しています。');
        }

        /**
         * 3. 手数料20%の計算ロジック
         * Stripeは「最小単位（日本円なら1円）」で送る必要がある
         */
        const amount = Number(price);
        const feeAmount = Math.floor(amount * 0.2); // 20%を手数料として運営が徴収

        /**
         * 4. CHECKOUT SESSION CREATION
         * Destination Charge方式：
         * 購入者が100%支払い → 運営が20%抜く → 出品者に80%入る
         */
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'jpy',
                        product_data: {
                            name: productName || 'adtown フリマ商品',
                        },
                        unit_amount: amount,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',

            // ここが「20%抜いて振り込む」核心部分
            payment_intent_data: {
                application_fee_amount: feeAmount, // 運営の取り分
                transfer_data: {
                    destination: sellerStripeId,      // 出品者のStripe ID
                },
            },

            success_url: `${req.headers.origin}${successUrl || '/success'}?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.headers.origin}${cancelUrl || '/cancel'}`,
        });

        /**
         * 5. RESPONSE
         */
        return res.status(200).json({
            sessionId: session.id,
            url: session.url // 直接遷移させる場合に使用
        });

    } catch (err: any) {
        console.error('❌ STRIPE ERROR:', err.message);
        return res.status(500).json({
            error: err.message,
            code: 'STRIPE_SESSION_ERROR'
        });
    }
}

/**
 * [TIPS] なぜAPIルートが必要か
 * 1. クライアント側（ブラウザ）にSecret Keyを露出させないため
 * 2. 手数料計算ロジックをユーザーに改ざんさせないため
 * 3. サーバー側で出品者の銀行口座(Stripe ID)をFirebaseから取得して安全に紐付けるため
 */