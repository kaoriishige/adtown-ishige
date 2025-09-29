import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { adminDb } from "@/lib/firebase-admin";

// Stripeのシークレットキーを環境変数から取得してStripeインスタンスを作成
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2024-04-10",
});

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    // POSTリクエストのみを許可
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).end('Method Not Allowed');
    }

    try {
        // リクエストボディからパートナー情報を取得
        const {
            uid, email, storeName, address, area,
            contactPerson, phoneNumber, qrStandCount, category
        } = req.body;

        // Stripeで新しい顧客を作成
        const customer = await stripe.customers.create({
            email: email,
            name: storeName,
            metadata: {
                firebaseUID: uid,
            }
        });

        // Firestoreにパートナー情報を保存
        await adminDb.collection('partners').doc(uid).set({
            storeName,
            address,
            area,
            contactPerson,
            phoneNumber,
            email,
            qrStandCount: Number(qrStandCount) || 0,
            category,
            stripeCustomerId: customer.id,
            status: 'trial', // 初期ステータスをトライアルに設定
            createdAt: new Date(),
        });

        // Stripe Checkoutセッションを作成
        const priceId = process.env.STRIPE_AD_PRICE_ID;
        if (!priceId) {
            throw new Error("Stripe価格ID(STRIPE_AD_PRICE_ID)が設定されていません。");
        }

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const session = await stripe.checkout.sessions.create({
            mode: "subscription",
            payment_method_types: ["card"],
            customer: customer.id,
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            // 決済成功時のリダイレクト先
            success_url: `${baseUrl}/partner/subscribe-success?session_id={CHECKOUT_SESSION_ID}`,
            // 決済キャンセル時のリダイレクト先
            cancel_url: `${baseUrl}/partner/signup`,
            subscription_data: {
                // 14日間の無料トライアル期間を設定
                trial_period_days: 14,
            }
        });

        return res.status(200).json({ sessionId: session.id });

    } catch (error: any) {
        console.error("Stripe session creation error:", error);
        return res.status(500).json({ error: error.message });
    }
}