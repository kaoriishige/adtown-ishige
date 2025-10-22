// Next.js Modules
import { NextApiRequest, NextApiResponse } from 'next';
// Firebase Admin SDK
import { adminDb } from '@/lib/firebase-admin';
// Stripe SDK
import getStripeAdmin from '@/lib/stripe-admin';
import Stripe from 'stripe';
import * as admin from 'firebase-admin';

// Stripe Webhook Secret (環境変数から取得)
const webhookSecret: string = process.env.STRIPE_WEBHOOK_SECRET!;

// Stripeオブジェクトの初期化
const stripe = getStripeAdmin();

// リクエストボディをRaw形式で取得するための設定
export const config = {
    api: {
        bodyParser: false,
    },
};

// --- ヘルパー関数: Raw Bodyの読み込み ---
async function buffer(readable: NextApiRequest & { buffer?: Buffer }): Promise<Buffer> {
    const chunks: Buffer[] = [];
    for await (const chunk of readable) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    readable.buffer = Buffer.concat(chunks);
    return readable.buffer;
}

// --- メイン Webhook ハンドラー ---
export default async function stripeWebhookHandler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).end('Method Not Allowed');
    }

    const buf = await buffer(req);
    const sig = req.headers['stripe-signature'];
    let event: Stripe.Event;

    // 1. Webhookの署名検証
    try {
        event = stripe.webhooks.constructEvent(buf.toString(), sig!, webhookSecret);
    } catch (err: any) {
        console.error(`🔴 Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    // 2. イベントタイプに基づく処理
    const data = event.data.object as any;
    const eventType = event.type;
    
    // StripeのSubscription IDに紐づくFirestoreのUIDを保持する変数
    let userId: string | undefined;

    try {
        switch (eventType) {
            case 'checkout.session.completed':
            case 'invoice.paid': {
                // Subscriptionがアクティブ化された際の処理
                const session = data.object === 'checkout.session' ? data : null;
                const subscription = session ? (await stripe.subscriptions.retrieve(session.subscription)) : null;

                // 支払いが行われた顧客情報を取得
                const customerId = session ? session.customer : data.customer;
                const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
                
                // FirestoreのユーザーID (UID) を取得
                const firebaseUid = customer.metadata.firebaseUid;

                if (!firebaseUid) {
                    console.error('🟡 Webhook Skip: Firebase UID not found in customer metadata.');
                    return res.status(200).json({ received: true });
                }
                
                userId = firebaseUid;
                
                // 3. Firestoreの購読ステータスを更新
                await adminDb.collection('users').doc(firebaseUid).set({
                    subscriptionStatus: 'active',
                    stripeSubscriptionId: subscription?.id || data.subscription,
                    // リファラルIDはこのユーザー登録時にすでに保存されている前提
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                }, { merge: true });

                // 4. 紹介料の発生と記録 (最も重要なロジック)
                const userDoc = await adminDb.collection('users').doc(firebaseUid).get();
                const referralId = userDoc.data()?.referredBy;
                
                if (referralId) {
                    const referralAmount = Math.round(data.amount_paid * 0.3); // 30% 紹介料 (Stripeの金額はセント/円単位)
                    
                    await adminDb.collection('payouts').add({
                        storeId: referralId, // 紹介元店舗のUID
                        userId: firebaseUid, // 紹介されたユーザーのUID
                        amount: referralAmount, 
                        status: 'pending', // 支払待ち
                        description: `有料会員登録による紹介料 (${customer.email})`,
                        payoutDate: null,
                        createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    });
                    console.log(`✅ Payout recorded for store: ${referralId}, Amount: ${referralAmount}`);
                } else {
                    console.log(`🟡 No referral ID found for user: ${firebaseUid}`);
                }

                break;
            }

            case 'customer.subscription.deleted': {
                // 解約時の処理
                const customerId = data.customer;
                const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
                const firebaseUid = customer.metadata.firebaseUid;

                if (firebaseUid) {
                    await adminDb.collection('users').doc(firebaseUid).set({
                        subscriptionStatus: 'canceled',
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    }, { merge: true });
                }
                break;
            }
            
            // 他のイベントタイプ (例: 支払失敗など) は必要に応じてここに追加
            default:
                console.log(`Unhandled event type ${eventType}`);
        }

    } catch (error) {
        console.error(`🔴 Error processing webhook [UID: ${userId}]:`, error);
        // Stripeにエラーを返し、再試行を促す
        return res.status(500).json({ error: 'Webhook processing failed.' });
    }

    // 成功応答
    res.status(200).json({ received: true });
}














